// ---------------------------------------------------------------------------
// NGO market-health insights for the Price Intelligence Engine (Deliverable 13).
//
// Aggregate, anonymised market signals for the counties an NGO serves: food
// availability by crop, regional shortage alerts (low/off-season + thin supply
// where there is demand), and price stability. Read-only over MarketplaceListing
// + PriceHistory. NGOs stay non-transactional — this is oversight, not a ledger.
// `assembleNgoMarketHealth` is pure.
// ---------------------------------------------------------------------------

import { connectDB } from '@/lib/db';
import { logger } from '@/lib/utils';
import { ListingStatus } from '@/types';
import { normalizeCrop, getSeasonPhase } from './seasonality';
import type { SeasonPhase } from './seasonality';
import { roundKES } from './weighting';
import { coefficientOfVariation } from './priceAnalytics';

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 90;
/** A cell with demand but fewer than this many active listings reads as thin. */
const THIN_SUPPLY = 3;

export interface NgoListing {
  crop: string;
  county: string;
  quantityAvailable: number;
}

export interface NgoPoint {
  crop: string;
  county: string;
  unit: string;
  pricePerUnit: number;
  source: string;
  recordedAt: Date;
}

export interface CropAvailabilityRow {
  crop: string;
  activeListings: number;
  totalQuantity: number;
  seasonPhase: SeasonPhase;
}

export interface ShortageAlertRow {
  crop: string;
  county: string;
  seasonPhase: SeasonPhase;
  completedSales90d: number;
  activeListings: number;
}

export interface PriceStabilityRow {
  crop: string;
  unit: string;
  medianPrice: number | null;
  volatilityPct: number | null;
}

export interface NgoMarketHealth {
  generatedAt: string;
  servedCounties: string[];
  summary: {
    servedCounties: number;
    activeListings: number;
    completedSales30d: number;
    crops: number;
  };
  cropAvailability: CropAvailabilityRow[];
  shortageAlerts: ShortageAlertRow[];
  priceStability: PriceStabilityRow[];
}

function plainMedian(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? (sorted[mid] ?? null)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
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

export function assembleNgoMarketHealth(
  servedCounties: readonly string[],
  listings: readonly NgoListing[],
  points: readonly NgoPoint[],
  now: Date = new Date()
): NgoMarketHealth {
  const crops = [...new Set([...listings.map((l) => l.crop), ...points.map((p) => p.crop)])];

  // Food availability — supply per crop across served counties.
  const cropAvailability: CropAvailabilityRow[] = crops
    .map((crop) => {
      const cropListings = listings.filter((l) => l.crop === crop);
      return {
        crop,
        activeListings: cropListings.length,
        totalQuantity: cropListings.reduce((s, l) => s + l.quantityAvailable, 0),
        seasonPhase: getSeasonPhase(crop, now),
      };
    })
    .filter((r) => r.activeListings > 0)
    .sort((a, b) => b.activeListings - a.activeListings);

  // Shortage alerts — demand present, supply thin, and low/off season.
  const completedByCell = new Map<string, number>();
  for (const p of points) {
    if (p.source === 'ORDER_COMPLETED') {
      const key = `${p.crop}|${p.county}`;
      completedByCell.set(key, (completedByCell.get(key) ?? 0) + 1);
    }
  }
  const activeByCell = new Map<string, number>();
  for (const l of listings) {
    const key = `${l.crop}|${l.county}`;
    activeByCell.set(key, (activeByCell.get(key) ?? 0) + 1);
  }
  const shortageAlerts: ShortageAlertRow[] = [...completedByCell.entries()]
    .map(([key, completedSales90d]) => {
      const [crop, county] = key.split('|');
      const seasonPhase = getSeasonPhase(crop ?? '', now);
      return {
        crop: crop ?? '',
        county: county ?? '',
        seasonPhase,
        completedSales90d,
        activeListings: activeByCell.get(key) ?? 0,
      };
    })
    .filter(
      (r) =>
        r.completedSales90d >= 2 &&
        r.activeListings < THIN_SUPPLY &&
        (r.seasonPhase === 'LOW_SUPPLY' || r.seasonPhase === 'OFF_SEASON')
    )
    .sort((a, b) => b.completedSales90d - a.completedSales90d)
    .slice(0, 10);

  // Price stability — median + volatility per crop (dominant unit).
  const priceStability: PriceStabilityRow[] = crops
    .map((crop) => {
      const cropPoints = points.filter((p) => p.crop === crop);
      const unit = modalUnit(cropPoints.map((p) => p.unit));
      const prices = cropPoints.filter((p) => p.unit === unit).map((p) => p.pricePerUnit);
      const med = plainMedian(prices);
      const cv = coefficientOfVariation(prices);
      return {
        crop,
        unit,
        medianPrice: med !== null ? roundKES(med) : null,
        volatilityPct: cv !== null ? Math.round(cv * 100 * 10) / 10 : null,
      };
    })
    .filter((r) => r.medianPrice !== null)
    .sort((a, b) => (b.volatilityPct ?? 0) - (a.volatilityPct ?? 0))
    .slice(0, 10);

  const completedSales30d = points.filter(
    (p) => p.source === 'ORDER_COMPLETED' && p.recordedAt.getTime() >= now.getTime() - 30 * DAY_MS
  ).length;

  return {
    generatedAt: now.toISOString(),
    servedCounties: [...servedCounties],
    summary: {
      servedCounties: servedCounties.length,
      activeListings: listings.length,
      completedSales30d,
      crops: cropAvailability.length,
    },
    cropAvailability,
    shortageAlerts,
    priceStability,
  };
}

export async function computeNgoMarketHealth(
  servedCounties: readonly string[]
): Promise<NgoMarketHealth> {
  const now = new Date();
  if (servedCounties.length === 0) {
    return assembleNgoMarketHealth([], [], [], now);
  }

  try {
    await connectDB();
    const { default: MarketplaceListing } = await import('@/lib/models/MarketplaceListing.model');
    const { default: PriceHistory } = await import('@/lib/models/PriceHistory.model');
    const counties = [...servedCounties];
    const cutoff = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);

    const [rawListings, rawPoints] = await Promise.all([
      MarketplaceListing.find({
        listingStatus: ListingStatus.AVAILABLE,
        pickupCounty: { $in: counties },
      })
        .select('cropName pickupCounty quantityAvailable')
        .limit(5000)
        .lean(),
      PriceHistory.find({ county: { $in: counties }, recordedAt: { $gte: cutoff } })
        .select('cropName county unit pricePerUnit source recordedAt')
        .limit(8000)
        .lean(),
    ]);

    const listings: NgoListing[] = rawListings.map((l) => ({
      crop: normalizeCrop(l.cropName),
      county: l.pickupCounty,
      quantityAvailable: l.quantityAvailable ?? 0,
    }));
    const points: NgoPoint[] = rawPoints.map((p) => ({
      crop: normalizeCrop(p.cropName),
      county: p.county,
      unit: p.unit,
      pricePerUnit: p.pricePerUnit,
      source: p.source,
      recordedAt: new Date(p.recordedAt),
    }));

    return assembleNgoMarketHealth(counties, listings, points, now);
  } catch (error) {
    logger.error('ngoMarketHealth', 'computeNgoMarketHealth failed; returning empty', { error });
    return assembleNgoMarketHealth([], [], [], now);
  }
}
