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
  mean,
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
  county: string;
  source: string;
  recordedAt: Date;
  tier: FarmerTrustTier | null;
  isDisputed: boolean;
}

export interface AssembleInput {
  crop: string;
  county: string;
  unit: string;
  quantity?: number | undefined;
  /** Points over the full TREND_LOOKBACK window (engine fetches this span). */
  points: readonly EnginePoint[];
  demandInputs: DemandInputs;
  now?: Date;
}

const GEO_CONFIDENCE_FACTOR: Record<GeoScope, number> = {
  COUNTY: 1.0,
  REGION: 0.8,
  NATIONAL: 0.55,
};

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
  const scoped = input.points
    .map((p) => ({ ...p, scope: scopeOf(county, p.county) }))
    .filter((p) => p.recordedAt.getTime() >= windowCutoff);

  const nCounty = scoped.filter((p) => p.scope === 'COUNTY').length;
  const nRegion = scoped.filter((p) => p.scope === 'COUNTY' || p.scope === 'REGION').length;

  const geoScope: GeoScope = nCounty >= MIN_POINTS ? 'COUNTY' : nRegion >= MIN_POINTS ? 'REGION' : 'NATIONAL';

  // Keep only the points belonging to the chosen tier — local data stays
  // undiluted when it is sufficient on its own.
  const tierMatch = (scope: GeoScope): boolean => {
    if (geoScope === 'COUNTY') return scope === 'COUNTY';
    if (geoScope === 'REGION') return scope === 'COUNTY' || scope === 'REGION';
    return true;
  };
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
  const nationalAverage = mean(scoped.map((p) => p.pricePerUnit));

  const recommendedRounded = recommended !== null ? roundKES(recommended) : null;
  const expectedEarnings =
    recommendedRounded !== null && input.quantity && input.quantity > 0
      ? roundKES(recommendedRounded * input.quantity)
      : null;

  // Trend uses the full lookback (not just the 90-day window) for the chosen tier.
  const trendPoints: TrendPoint[] = input.points
    .filter((p) => tierMatch(scopeOf(county, p.county)))
    .map((p) => ({ pricePerUnit: p.pricePerUnit, recordedAt: p.recordedAt }));
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
}

/**
 * Reads the platform's existing collections and produces a recommendation.
 * Degrades gracefully: any failure returns an empty (null-price, zero-confidence)
 * recommendation rather than throwing.
 */
export async function composeRecommendation(input: ComposeInput): Promise<PriceRecommendation> {
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

    const normCrop = normalizeCrop(input.crop);
    const cropMatch = new RegExp('^' + escapeRegex(normCrop), 'i');
    const lookbackCutoff = new Date(now.getTime() - TREND_LOOKBACK_DAYS * DAY_MS);

    const rawPoints = await PriceHistory.find({
      cropName: cropMatch,
      recordedAt: { $gte: lookbackCutoff },
    })
      .select('pricePerUnit county source recordedAt farmerId orderId')
      .sort({ recordedAt: -1 })
      .limit(3000)
      .lean();

    const farmerIds = [...new Set(rawPoints.map((p) => String(p.farmerId)).filter(Boolean))];
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

    const points: EnginePoint[] = rawPoints.map((p) => ({
      pricePerUnit: p.pricePerUnit,
      county: p.county,
      source: p.source,
      recordedAt: new Date(p.recordedAt),
      tier: tierMap.get(String(p.farmerId)) ?? null,
      isDisputed: p.orderId ? disputedSet.has(String(p.orderId)) : false,
    }));

    // Demand metrics, scoped to crop + county. Best-effort; zeros on any failure.
    let demandInputs = emptyDemand;
    try {
      const recentListingCutoff = new Date(now.getTime() - RECO_WINDOW_DAYS * DAY_MS);
      const listings = await MarketplaceListing.find({
        cropName: cropMatch,
        pickupCounty: input.county,
        createdAt: { $gte: recentListingCutoff },
      })
        .select('_id quantityAvailable viewCount listingStatus')
        .lean();

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
      points,
      demandInputs,
      now,
    });
  } catch (error) {
    logger.error('priceIntelligence', 'composeRecommendation failed; returning empty', {
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
