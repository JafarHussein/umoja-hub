// ---------------------------------------------------------------------------
// Admin price analytics for the Price Intelligence Engine (Deliverable 11).
//
// Reads the same PriceHistory + MarketplaceListing data the recommendation
// engine uses and rolls it up into the oversight views admins need: a commodity
// overview (median price, trend, volatility), demand hotspots, regional price
// comparison, supply concentration, and market anomalies. `assemblePriceAnalytics`
// is PURE (unit-tested); `computePriceAnalytics` is the async DB wrapper.
// Read-only and additive — no schema or platform-logic changes.
// ---------------------------------------------------------------------------

import { connectDB } from '@/lib/db';
import { logger } from '@/lib/utils';
import { ListingStatus } from '@/types';
import { normalizeCrop } from './seasonality';
import { regionOf } from './regions';
import { recencyWeight, sourceWeight, weightedMedian, roundKES } from './weighting';
import type { WeightedValue } from './weighting';
import { classifyTrend } from './trend';
import type { TrendDirection } from './trend';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Points farther than this many MADs from the median are flagged anomalies. */
const ANOMALY_MAD_K = 3.5;
/** Minimum points before volatility/anomaly stats are trustworthy. */
const MIN_STAT_POINTS = 5;

export interface AnalyticsPricePoint {
  crop: string;
  county: string;
  unit: string;
  pricePerUnit: number;
  source: string;
  recordedAt: Date;
}

export interface AnalyticsListing {
  crop: string;
  county: string;
  farmerId: string;
  quantityAvailable: number;
}

export interface CommodityRow {
  crop: string;
  unit: string;
  medianPrice: number | null;
  trendDirection: TrendDirection;
  changePct30d: number | null;
  volatilityPct: number | null;
  dataPointCount: number;
}

export interface HotspotRow {
  crop: string;
  county: string;
  completedSales30d: number;
  activeListings: number;
  intensity: number;
}

export interface RegionalCropRow {
  crop: string;
  unit: string;
  regions: Array<{ region: string; medianPrice: number; dataPointCount: number }>;
}

export interface ConcentrationRow {
  crop: string;
  activeListings: number;
  sellerCount: number;
  topSellerSharePct: number | null;
}

export interface AnomalyRow {
  crop: string;
  county: string;
  unit: string;
  pricePerUnit: number;
  medianPrice: number;
  deviationPct: number;
  recordedAt: string;
}

export interface PriceAnalytics {
  generatedAt: string;
  commodityOverview: CommodityRow[];
  demandHotspots: HotspotRow[];
  regionalComparison: RegionalCropRow[];
  supplyConcentration: ConcentrationRow[];
  anomalies: AnomalyRow[];
}

// --- pure statistics ------------------------------------------------------

function plainMean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function plainMedian(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? (sorted[mid] ?? null)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

export function coefficientOfVariation(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  const m = plainMean(values);
  if (m === null || m === 0) return null;
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance) / m;
}

function modalUnit(units: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const u of units) counts.set(u, (counts.get(u) ?? 0) + 1);
  let best = 'KG';
  let bestCount = -1;
  for (const [u, n] of counts) {
    if (n > bestCount) {
      best = u;
      bestCount = n;
    }
  }
  return best;
}

// --- pure assembly --------------------------------------------------------

export function assemblePriceAnalytics(
  points: readonly AnalyticsPricePoint[],
  listings: readonly AnalyticsListing[],
  now: Date = new Date()
): PriceAnalytics {
  const crops = [...new Set(points.map((p) => p.crop))];

  // Commodity overview — one row per crop, scoped to its dominant unit so
  // BAG and KG prices never get mixed into one median.
  const commodityOverview: CommodityRow[] = [];
  const regionalComparison: RegionalCropRow[] = [];
  const anomalies: AnomalyRow[] = [];

  for (const crop of crops) {
    const cropPoints = points.filter((p) => p.crop === crop);
    const unit = modalUnit(cropPoints.map((p) => p.unit));
    const unitPoints = cropPoints.filter((p) => p.unit === unit);
    const prices = unitPoints.map((p) => p.pricePerUnit);

    const weighted: WeightedValue[] = unitPoints.map((p) => ({
      value: p.pricePerUnit,
      weight:
        recencyWeight((now.getTime() - p.recordedAt.getTime()) / DAY_MS) * sourceWeight(p.source),
    }));
    const median = weightedMedian(weighted);
    const trend = classifyTrend(
      unitPoints.map((p) => ({ pricePerUnit: p.pricePerUnit, recordedAt: p.recordedAt })),
      now
    );
    const cv = coefficientOfVariation(prices);

    commodityOverview.push({
      crop,
      unit,
      medianPrice: median !== null ? roundKES(median) : null,
      trendDirection: trend.direction,
      changePct30d: trend.changePct30d,
      volatilityPct: cv !== null ? Math.round(cv * 100 * 10) / 10 : null,
      dataPointCount: unitPoints.length,
    });

    // Regional comparison for this crop.
    const byRegion = new Map<string, number[]>();
    for (const p of unitPoints) {
      const region = regionOf(p.county);
      if (!region) continue;
      const arr = byRegion.get(region) ?? [];
      arr.push(p.pricePerUnit);
      byRegion.set(region, arr);
    }
    const regions = [...byRegion.entries()]
      .filter(([, arr]) => arr.length >= 2)
      .map(([region, arr]) => ({
        region,
        medianPrice: roundKES(plainMedian(arr) ?? 0),
        dataPointCount: arr.length,
      }))
      .sort((a, b) => b.medianPrice - a.medianPrice);
    if (regions.length >= 2) {
      regionalComparison.push({ crop, unit, regions });
    }

    // Anomalies via median absolute deviation.
    const med = plainMedian(prices);
    if (med !== null && unitPoints.length >= MIN_STAT_POINTS) {
      const mad = plainMedian(prices.map((p) => Math.abs(p - med)));
      if (mad !== null && mad > 0) {
        for (const p of unitPoints) {
          if (Math.abs(p.pricePerUnit - med) > ANOMALY_MAD_K * mad) {
            anomalies.push({
              crop,
              county: p.county,
              unit,
              pricePerUnit: p.pricePerUnit,
              medianPrice: roundKES(med),
              deviationPct: Math.round(((p.pricePerUnit - med) / med) * 100),
              recordedAt: p.recordedAt.toISOString(),
            });
          }
        }
      }
    }
  }

  commodityOverview.sort((a, b) => b.dataPointCount - a.dataPointCount);
  regionalComparison.sort((a, b) => b.regions.length - a.regions.length);
  anomalies.sort((a, b) => Math.abs(b.deviationPct) - Math.abs(a.deviationPct));

  // Demand hotspots — completed-sale velocity vs active supply per crop+county.
  const thirtyDaysAgo = now.getTime() - 30 * DAY_MS;
  const completedByCell = new Map<string, number>();
  for (const p of points) {
    if (p.source === 'ORDER_COMPLETED' && p.recordedAt.getTime() >= thirtyDaysAgo) {
      const key = `${p.crop}|${p.county}`;
      completedByCell.set(key, (completedByCell.get(key) ?? 0) + 1);
    }
  }
  const activeByCell = new Map<string, number>();
  for (const l of listings) {
    const key = `${l.crop}|${l.county}`;
    activeByCell.set(key, (activeByCell.get(key) ?? 0) + 1);
  }
  const demandHotspots: HotspotRow[] = [...completedByCell.entries()]
    .filter(([, count]) => count >= 2)
    .map(([key, completedSales30d]) => {
      const [crop, county] = key.split('|');
      const activeListings = activeByCell.get(key) ?? 0;
      return {
        crop: crop ?? '',
        county: county ?? '',
        completedSales30d,
        activeListings,
        intensity: Math.round((completedSales30d / Math.max(activeListings, 1)) * 100) / 100,
      };
    })
    .sort((a, b) => b.intensity - a.intensity || b.completedSales30d - a.completedSales30d)
    .slice(0, 8);

  // Supply concentration — top-seller share per crop.
  const listingsByCrop = new Map<string, AnalyticsListing[]>();
  for (const l of listings) {
    const arr = listingsByCrop.get(l.crop) ?? [];
    arr.push(l);
    listingsByCrop.set(l.crop, arr);
  }
  const supplyConcentration: ConcentrationRow[] = [...listingsByCrop.entries()]
    .map(([crop, arr]) => {
      const byFarmer = new Map<string, number>();
      for (const l of arr) byFarmer.set(l.farmerId, (byFarmer.get(l.farmerId) ?? 0) + 1);
      const maxByOne = Math.max(...byFarmer.values());
      return {
        crop,
        activeListings: arr.length,
        sellerCount: byFarmer.size,
        topSellerSharePct: arr.length > 0 ? Math.round((maxByOne / arr.length) * 100) : null,
      };
    })
    .sort((a, b) => b.activeListings - a.activeListings)
    .slice(0, 8);

  return {
    generatedAt: now.toISOString(),
    commodityOverview,
    demandHotspots,
    regionalComparison: regionalComparison.slice(0, 5),
    supplyConcentration,
    anomalies: anomalies.slice(0, 10),
  };
}

// --- async DB wrapper -----------------------------------------------------

const ANALYTICS_WINDOW_DAYS = 90;

function emptyAnalytics(now: Date): PriceAnalytics {
  return {
    generatedAt: now.toISOString(),
    commodityOverview: [],
    demandHotspots: [],
    regionalComparison: [],
    supplyConcentration: [],
    anomalies: [],
  };
}

export async function computePriceAnalytics(): Promise<PriceAnalytics> {
  const now = new Date();
  try {
    await connectDB();
    const { default: PriceHistory } = await import('@/lib/models/PriceHistory.model');
    const { default: MarketplaceListing } = await import('@/lib/models/MarketplaceListing.model');

    const cutoff = new Date(now.getTime() - ANALYTICS_WINDOW_DAYS * DAY_MS);

    const [rawPoints, rawListings] = await Promise.all([
      PriceHistory.find({ recordedAt: { $gte: cutoff } })
        .select('cropName county unit pricePerUnit source recordedAt')
        .sort({ recordedAt: -1 })
        .limit(8000)
        .lean(),
      MarketplaceListing.find({ listingStatus: ListingStatus.AVAILABLE })
        .select('cropName pickupCounty farmerId quantityAvailable')
        .limit(5000)
        .lean(),
    ]);

    const points: AnalyticsPricePoint[] = rawPoints.map((p) => ({
      crop: normalizeCrop(p.cropName),
      county: p.county,
      unit: p.unit,
      pricePerUnit: p.pricePerUnit,
      source: p.source,
      recordedAt: new Date(p.recordedAt),
    }));

    const listings: AnalyticsListing[] = rawListings.map((l) => ({
      crop: normalizeCrop(l.cropName),
      county: l.pickupCounty,
      farmerId: String(l.farmerId),
      quantityAvailable: l.quantityAvailable ?? 0,
    }));

    return assemblePriceAnalytics(points, listings, now);
  } catch (error) {
    logger.error('priceAnalytics', 'computePriceAnalytics failed; returning empty', { error });
    return emptyAnalytics(now);
  }
}
