// ---------------------------------------------------------------------------
// Price Intelligence Engine — the orchestrator.
//
// `assembleRecommendation` is PURE (unit-tested): given already-fetched price
// points + demand metrics it produces the full recommendation. `composeRecommendation`
// is the thin async wrapper that reads PriceHistory / Order / MarketplaceListing /
// FarmerTrustScore and calls the pure core. The engine never throws to callers
// and never blocks listing creation — see context/PRICE_INTELLIGENCE_ENGINE_DESIGN.md.
// ---------------------------------------------------------------------------

import { connectDB } from '@/lib/db';
import { logger } from '@/lib/utils';
import {
  FarmerTrustTier,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  PriceHistorySource,
  ListingStatus,
} from '@/types';
import { scopeOf } from './regions';
import type { GeoScope } from './regions';
import {
  MIN_POINTS,
  pointWeight,
  weightedMedian,
  weightedPercentile,
  weightedMean,
  roundKES,
} from './weighting';
import type { WeightedValue } from './weighting';
import { classifyTrend } from './trend';
import type { TrendPoint } from './trend';
import { scoreDemand } from './demand';
import type { DemandInputs, DemandResult } from './demand';
import { getSeasonPhase, normalizeCrop } from './seasonality';
import type { SeasonPhase } from './seasonality';
import { buildInsight } from './insight';
import { cropNamePattern, matchesCrop, resolveCrop } from '@/lib/taxonomy/crops';
import { cacheKey, cached } from '@/lib/cache';

/** Span used for the recommendation statistic (weighted median + range). */
export const RECO_WINDOW_DAYS = 90;
/** Wider span used for trend windows (needs the period before each window). */
export const TREND_LOOKBACK_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ConfidenceBand = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PriceRecommendation {
  crop: string;
  county: string;
  unit: string;
  recommendedPricePerUnit: number | null;
  range: { low: number; high: number } | null;
  regionalAveragePerUnit: number | null;
  nationalAveragePerUnit: number | null;
  expectedEarningsKES: number | null;
  demand: DemandResult;
  trend: ReturnType<typeof classifyTrend>;
  season: { phase: SeasonPhase };
  confidence: number;
  confidenceBand: ConfidenceBand;
  insight: string;
  basis: {
    dataPointCount: number;
    completedSaleShare: number;
    geoScope: GeoScope;
    windowDays: number;
  };
}

/** A price observation enriched with everything weighting needs. */
export interface EnginePoint {
  pricePerUnit: number;
  /**
   * The unit the price was quoted in. Only points matching the caller's unit are
   * comparable — see `sameUnit` below for why we filter rather than convert.
   */
  unit: string;
  county: string;
  source: string;
  recordedAt: Date;
  tier: FarmerTrustTier | null;
  isDisputed: boolean;
  /** Who produced this observation. Needed only for the D12 anti-feedback rule. */
  farmerId?: string | null;
}

/**
 * Unit equality, tolerant of casing and padding since `PriceHistory.unit` is a
 * plain String rather than an enum at the schema level.
 *
 * We compare like with like instead of converting to a common basis. A Kenyan
 * "bag" has no single weight — maize trades at 90 kg/bag while the Crops (Food
 * Crops) Regulations 2019 cap a package at 50 kg, and potatoes are capped at
 * 50 kg while 110 kg extended bags persist. Converting with the wrong constant
 * would introduce a ~44% error, which is worse than the mixed-unit defect this
 * filtering fixes. See src/lib/taxonomy/units.ts for the full reasoning.
 */
function sameUnit(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

export interface AssembleInput {
  crop: string;
  county: string;
  unit: string;
  quantity?: number | undefined;
  /**
   * Suppresses this farmer's own `LISTING_CREATED` points (D12).
   *
   * Without it, typing a price, saving, and reopening the form nudges the
   * recommendation toward whatever they typed — the farmer's own asking price
   * becomes evidence for the advice given back to them. Their *completed sales*
   * deliberately stay: those are settled facts, not aspirations.
   */
  excludeFarmerId?: string | undefined;
  /** Points over the full TREND_LOOKBACK window (engine fetches this span). */
  points: readonly EnginePoint[];
  demandInputs: DemandInputs;
  now?: Date;
}

/**
 * How much a widened search costs the confidence figure. ADJACENT is 0.9 — a
 * bordering county is a real answer to "what is this worth near me", so it is
 * penalised far less than a province-wide or national fallback (`09` §3.1).
 */
const GEO_CONFIDENCE_FACTOR: Record<GeoScope, number> = {
  COUNTY: 1.0,
  ADJACENT: 0.9,
  REGION: 0.8,
  NATIONAL: 0.55,
};

/** The widening tiers the engine searches, narrowest first. Order is load-bearing. */
const GEO_LADDER: readonly GeoScope[] = ['COUNTY', 'ADJACENT', 'REGION', 'NATIONAL'];

function bandFor(confidence: number): ConfidenceBand {
  if (confidence >= 75) return 'HIGH';
  if (confidence >= 50) return 'MEDIUM';
  return 'LOW';
}

/**
 * Pure recommendation assembly. Picks the narrowest geo tier that clears
 * MIN_POINTS (county → region → national), weights the points, and derives the
 * median/range/averages, trend, demand, season, confidence and insight.
 */
export function assembleRecommendation(input: AssembleInput): PriceRecommendation {
  const now = input.now ?? new Date();
  const crop = normalizeCrop(input.crop);
  const { county, unit } = input;

  const windowCutoff = now.getTime() - RECO_WINDOW_DAYS * DAY_MS;

  // D12 — applied before anything else, so the farmer's own asking prices are
  // absent from the median, the range, the averages and the trend alike. Only
  // LISTING_CREATED is dropped; their completed sales remain evidence.
  const eligible = input.excludeFarmerId
    ? input.points.filter(
        (p) =>
          !(
            p.source === PriceHistorySource.LISTING_CREATED &&
            p.farmerId != null &&
            String(p.farmerId) === input.excludeFarmerId
          )
      )
    : input.points;

  const comparable = eligible.filter((p) => sameUnit(p.unit, unit));
  const scoped = comparable
    .map((p) => ({ ...p, scope: scopeOf(county, p.county) }))
    .filter((p) => p.recordedAt.getTime() >= windowCutoff);

  // The widening ladder, narrowest first. Each tier is cumulative — it includes
  // every tier before it. ADJACENT was inserted between COUNTY and REGION to
  // close D7: without it, Nairobi (a former province of one) had no peers at all
  // between its own borders and the entire country, and every other county
  // reached its province-mates before its actual neighbours.
  const geoRank = (scope: GeoScope): number => GEO_LADDER.indexOf(scope);
  const countThrough = (tier: GeoScope): number =>
    scoped.filter((p) => geoRank(p.scope) <= geoRank(tier)).length;

  // Stop at the first tier that clears MIN_POINTS, so local evidence is never
  // diluted by a wider tier it did not need.
  const geoScope: GeoScope = GEO_LADDER.find((tier) => countThrough(tier) >= MIN_POINTS) ?? 'NATIONAL';

  // Keep only the points belonging to the chosen tier.
  const tierMatch = (scope: GeoScope): boolean => geoRank(scope) <= geoRank(geoScope);
  const recoPoints = scoped.filter((p) => tierMatch(p.scope));

  const weighted: WeightedValue[] = recoPoints.map((p) => ({
    value: p.pricePerUnit,
    weight: pointWeight({
      ageDays: (now.getTime() - p.recordedAt.getTime()) / DAY_MS,
      source: p.source,
      tier: p.tier,
      scope: p.scope,
      isDisputed: p.isDisputed,
    }),
  }));

  const rawCount = recoPoints.length;
  const hasEnough = rawCount >= MIN_POINTS;

  const recommended = hasEnough ? weightedMedian(weighted) : null;
  const p25 = hasEnough ? weightedPercentile(weighted, 25) : null;
  const p75 = hasEnough ? weightedPercentile(weighted, 75) : null;
  const range =
    recommended !== null && p25 !== null && p75 !== null
      ? { low: roundKES(p25), high: roundKES(p75) }
      : null;
  const regionalAverage = hasEnough ? weightedMean(weighted) : null;

  // The national average was the one unweighted figure on the card, so a stale
  // asking price from an untrusted farmer counted as much as yesterday's settled
  // sale. It is now weighted by the same data-quality terms as everything else
  // — recency, source, trust tier and dispute status — but with the geographic
  // term held neutral: distance from the farmer governs how RELEVANT a point is
  // to a local estimate, not how true it is of the country as a whole.
  const nationalWeighted: WeightedValue[] = scoped.map((p) => ({
    value: p.pricePerUnit,
    weight: pointWeight({
      ageDays: (now.getTime() - p.recordedAt.getTime()) / DAY_MS,
      source: p.source,
      tier: p.tier,
      scope: 'COUNTY',
      isDisputed: p.isDisputed,
    }),
  }));
  const nationalAverage = weightedMean(nationalWeighted);

  const recommendedRounded = recommended !== null ? roundKES(recommended) : null;
  const expectedEarnings =
    recommendedRounded !== null && input.quantity && input.quantity > 0
      ? roundKES(recommendedRounded * input.quantity)
      : null;

  // Trend uses the full lookback (not just the 90-day window) for the chosen
  // tier — still restricted to the requested unit, or it would compare a BAG
  // series against a KG one and report a meaningless percentage change.
  //
  // Each window is a weighted mean (D11), carrying the same data-quality terms
  // as the headline figure, with the geographic term held neutral exactly as the
  // national average does: within an already tier-filtered series, distance
  // governs how relevant a point is, not how true it is of the direction.
  const trendPoints: TrendPoint[] = comparable
    .filter((p) => tierMatch(scopeOf(county, p.county)))
    .map((p) => ({
      pricePerUnit: p.pricePerUnit,
      recordedAt: p.recordedAt,
      weight: pointWeight({
        ageDays: (now.getTime() - p.recordedAt.getTime()) / DAY_MS,
        source: p.source,
        tier: p.tier,
        scope: 'COUNTY',
        isDisputed: p.isDisputed,
      }),
    }));
  const trend = classifyTrend(trendPoints, now);

  const demand = scoreDemand(input.demandInputs);
  const season = getSeasonPhase(crop, now);

  // Confidence.
  const effectiveN = weighted.reduce((sum, p) => sum + p.weight, 0);
  const recentWeight = recoPoints.reduce((sum, p, i) => {
    const ageDays = (now.getTime() - p.recordedAt.getTime()) / DAY_MS;
    return ageDays <= 14 ? sum + (weighted[i]?.weight ?? 0) : sum;
  }, 0);
  const recencyFactor = effectiveN > 0 ? recentWeight / effectiveN : 0;
  const completedCount = recoPoints.filter(
    (p) => p.source === PriceHistorySource.ORDER_COMPLETED
  ).length;
  const completedSaleShare = rawCount > 0 ? completedCount / rawCount : 0;
  const nFactor = 1 - Math.exp(-effectiveN / 6);
  const sourceFactor = 0.5 + 0.5 * completedSaleShare;
  const geoFactor = GEO_CONFIDENCE_FACTOR[geoScope];
  const confidence = hasEnough
    ? Math.max(
        0,
        Math.min(100, Math.round(100 * nFactor * (0.4 + 0.6 * recencyFactor) * sourceFactor * geoFactor))
      )
    : 0;

  const insight = buildInsight({
    crop,
    county,
    unit,
    recommended: recommendedRounded,
    range,
    demand: demand.level,
    trend,
    season,
    geoScope,
  });

  return {
    crop,
    county,
    unit,
    recommendedPricePerUnit: recommendedRounded,
    range,
    regionalAveragePerUnit: regionalAverage !== null ? roundKES(regionalAverage) : null,
    nationalAveragePerUnit: nationalAverage !== null ? roundKES(nationalAverage) : null,
    expectedEarningsKES: expectedEarnings,
    demand,
    trend,
    season: { phase: season },
    confidence,
    confidenceBand: bandFor(confidence),
    insight,
    basis: {
      dataPointCount: rawCount,
      completedSaleShare: Math.round(completedSaleShare * 100) / 100,
      geoScope,
      windowDays: RECO_WINDOW_DAYS,
    },
  };
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface ComposeInput {
  crop: string;
  county: string;
  unit: string;
  quantity?: number | undefined;
  /** See `AssembleInput.excludeFarmerId` (D12). Enters the cache key. */
  excludeFarmerId?: string | undefined;
}

/**
 * The market view moves slowly relative to how often callers ask for it — the
 * listing form fires on every debounced keystroke, and cooperative insights ask
 * for up to eight crops in a row — so a few minutes of staleness is invisible
 * while removing almost all of the query load.
 */
const RECOMMENDATION_TTL_SECONDS = 600;

/**
 * Reads the platform's existing collections and produces a recommendation for a
 * crop/county/unit, ignoring quantity. Wrapped by `composeRecommendation`, which
 * adds caching and applies the caller's quantity.
 *
 * Degrades gracefully: any failure returns an empty (null-price,
 * zero-confidence) recommendation rather than throwing.
 */
async function computeRecommendation(input: ComposeInput): Promise<PriceRecommendation> {
  const now = new Date();
  const emptyDemand: DemandInputs = {
    completedOrders30d: 0,
    activeListings: 0,
    totalQuantityOrdered: 0,
    totalQuantityListed: 0,
    avgViewCount: 0,
  };

  try {
    await connectDB();
    const { default: PriceHistory } = await import('@/lib/models/PriceHistory.model');
    const { default: FarmerTrustScore } = await import('@/lib/models/FarmerTrustScore.model');
    const { default: Order } = await import('@/lib/models/Order.model');
    const { default: MarketplaceListing } = await import('@/lib/models/MarketplaceListing.model');

    // Crop identity comes from the canonical taxonomy so the engine, /api/prices
    // and the price-alert cron all agree on what "maize" matches. Unregistered
    // crops keep the previous anchored-prefix behaviour rather than returning
    // nothing.
    const cropId = resolveCrop(input.crop);
    const cropMatch = cropId
      ? cropNamePattern(cropId)
      : new RegExp('^' + escapeRegex(normalizeCrop(input.crop)), 'i');
    const lookbackCutoff = new Date(now.getTime() - TREND_LOOKBACK_DAYS * DAY_MS);

    // Filter the unit at the database rather than only in memory: the 3,000-row
    // cap is shared across every unit for a crop, so BAG rows would otherwise
    // crowd out the KG rows the caller actually asked for. Anchored and
    // case-insensitive because `unit` is a plain String on the schema.
    const unitMatch = new RegExp('^' + escapeRegex(input.unit.trim()) + '$', 'i');

    const rawPoints = await PriceHistory.find({
      cropName: cropMatch,
      unit: unitMatch,
      recordedAt: { $gte: lookbackCutoff },
    })
      .select('cropName pricePerUnit unit county source recordedAt farmerId orderId')
      .sort({ recordedAt: -1 })
      .limit(3000)
      .lean();

    // Drop rows without a farmerId *before* stringifying: `String(undefined)` is
    // the truthy string "undefined", which survives `filter(Boolean)` and reaches
    // the `$in` as a non-castable ObjectId. That throws the whole query, and the
    // catch below turns it into an empty recommendation — so a single row with no
    // farmerId would silently blank the price for that crop. `farmerId` is
    // optional on the schema, so such a row is legal.
    const farmerIds = [
      ...new Set(rawPoints.filter((p) => p.farmerId).map((p) => String(p.farmerId))),
    ];
    const trustScores = farmerIds.length
      ? await FarmerTrustScore.find({ farmerId: { $in: farmerIds } })
          .select('farmerId tier')
          .lean()
      : [];
    const tierMap = new Map<string, FarmerTrustTier>(
      trustScores.map((t) => [String(t.farmerId), t.tier as FarmerTrustTier])
    );

    const disputedOrders = await Order.find({
      cropName: cropMatch,
      $or: [
        { fulfillmentStatus: OrderFulfillmentStatus.DISPUTED },
        { paymentStatus: OrderPaymentStatus.REFUNDED },
      ],
    })
      .select('_id')
      .lean();
    const disputedSet = new Set(disputedOrders.map((o) => String(o._id)));

    const points: EnginePoint[] = rawPoints
      // `cropNamePattern` is a superset match — "beans" also hits "French Beans".
      // Narrow it here, where alias precedence can be applied properly.
      .filter((p) => (cropId ? matchesCrop(p.cropName, cropId) : true))
      .map((p) => ({
        pricePerUnit: p.pricePerUnit,
        unit: p.unit,
        county: p.county,
        source: p.source,
        recordedAt: new Date(p.recordedAt),
        tier: tierMap.get(String(p.farmerId)) ?? null,
        isDisputed: p.orderId ? disputedSet.has(String(p.orderId)) : false,
        farmerId: p.farmerId ? String(p.farmerId) : null,
      }));

    // Demand metrics, scoped to crop + county. Best-effort; zeros on any failure.
    let demandInputs = emptyDemand;
    try {
      const recentListingCutoff = new Date(now.getTime() - RECO_WINDOW_DAYS * DAY_MS);
      const listings = (
        await MarketplaceListing.find({
          cropName: cropMatch,
          pickupCounty: input.county,
          createdAt: { $gte: recentListingCutoff },
        })
          .select('_id cropName quantityAvailable viewCount listingStatus')
          .lean()
      ).filter((l) => (cropId ? matchesCrop(l.cropName, cropId) : true));

      const activeListings = listings.filter(
        (l) => l.listingStatus === ListingStatus.AVAILABLE
      ).length;
      const totalQuantityListed = listings.reduce((s, l) => s + (l.quantityAvailable ?? 0), 0);
      const avgViewCount =
        listings.length > 0
          ? listings.reduce((s, l) => s + (l.viewCount ?? 0), 0) / listings.length
          : 0;

      const listingIds = listings.map((l) => l._id);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
      const orders = listingIds.length
        ? await Order.find({
            listingId: { $in: listingIds },
            createdAt: { $gte: recentListingCutoff },
          })
            .select('quantityOrdered paymentStatus createdAt')
            .lean()
        : [];

      const completedOrders30d = orders.filter(
        (o) =>
          o.paymentStatus === OrderPaymentStatus.PAID && new Date(o.createdAt) >= thirtyDaysAgo
      ).length;
      const totalQuantityOrdered = orders
        .filter((o) => o.paymentStatus === OrderPaymentStatus.PAID)
        .reduce((s, o) => s + (o.quantityOrdered ?? 0), 0);

      demandInputs = {
        completedOrders30d,
        activeListings,
        totalQuantityOrdered,
        totalQuantityListed,
        avgViewCount,
      };
    } catch (demandErr) {
      logger.warn('priceIntelligence', 'Demand metric gathering failed; defaulting to zero', {
        crop: input.crop,
        county: input.county,
        demandErr,
      });
    }

    return assembleRecommendation({
      crop: input.crop,
      county: input.county,
      unit: input.unit,
      quantity: input.quantity,
      excludeFarmerId: input.excludeFarmerId,
      points,
      demandInputs,
      now,
    });
  } catch (error) {
    logger.error('priceIntelligence', 'computeRecommendation failed; returning empty', {
      crop: input.crop,
      county: input.county,
      error,
    });
    return assembleRecommendation({
      crop: input.crop,
      county: input.county,
      unit: input.unit,
      quantity: input.quantity,
      points: [],
      demandInputs: emptyDemand,
      now,
    });
  }
}

/**
 * Cached entry point. Every consumer — the farmer listing form, the standalone
 * prices page, buyer fairness, cooperative insights and the AI assistant — goes
 * through here.
 *
 * Quantity is deliberately NOT part of the cache key: it only scales
 * `expectedEarningsKES`, a plain multiple of the recommended price, so including
 * it would mint a fresh entry on every keystroke in the quantity field and
 * defeat the cache. The market view is computed once and the caller's quantity
 * applied to it afterwards.
 *
 * `excludeFarmerId` DOES enter the key, because unlike quantity it changes the
 * point set the view is built from. Its cardinality is bounded by the farmers
 * actively editing a listing, which is small.
 */
export async function composeRecommendation(input: ComposeInput): Promise<PriceRecommendation> {
  const recommendation = await cached(
    cacheKey('price-reco', input.crop, input.county, input.unit, input.excludeFarmerId ?? ''),
    RECOMMENDATION_TTL_SECONDS,
    () =>
      computeRecommendation({
        crop: input.crop,
        county: input.county,
        unit: input.unit,
        // Must be forwarded, and must match the cache key above. `quantity` is
        // the only field deliberately withheld — it is applied to the cached
        // view afterwards.
        excludeFarmerId: input.excludeFarmerId,
      }),
    {
      // A zero-confidence result is indistinguishable from one produced while
      // the database was unreachable. Pinning that for ten minutes would turn a
      // blip into an outage, so only evidenced recommendations are stored.
      shouldCache: (result) => result.confidence > 0,
    }
  );

  if (input.quantity && input.quantity > 0 && recommendation.recommendedPricePerUnit !== null) {
    return {
      ...recommendation,
      expectedEarningsKES: roundKES(recommendation.recommendedPricePerUnit * input.quantity),
    };
  }
  return recommendation;
}
