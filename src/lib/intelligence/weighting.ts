// ---------------------------------------------------------------------------
// Data-point weighting + weighted statistics for the Price Intelligence Engine.
//
// A price recommendation is a weighted robust statistic over PriceHistory, not
// a naive mean. Each point's weight = recency × source × trust × geo, with
// disputed/refunded points heavily down-weighted. Constants are LOCKED — see
// context/PRICE_INTELLIGENCE_ENGINE_DESIGN.md §3.6.
// ---------------------------------------------------------------------------

import { FarmerTrustTier, PriceHistorySource } from '@/types';
import type { GeoScope } from './regions';

/** Recency half-life: a point loses half its weight every 21 days. */
export const HALF_LIFE_DAYS = 21;

/** Minimum raw data points (after geo-fallback) before a price is surfaced. */
export const MIN_POINTS = 3;

/** A completed sale is ground truth; an asking price is aspirational. */
export const SOURCE_WEIGHT: Record<string, number> = {
  [PriceHistorySource.ORDER_COMPLETED]: 1.0,
  [PriceHistorySource.LISTING_CREATED]: 0.6, // softened from 0.5 (owner decision 2026-06-22)
  [PriceHistorySource.EXTERNAL_INGESTION]: 0.7,
};

/** A trusted farmer's realised price counts for more than a newcomer's. */
export const TRUST_WEIGHT: Record<FarmerTrustTier, number> = {
  [FarmerTrustTier.PREMIUM]: 1.3,
  [FarmerTrustTier.TRUSTED]: 1.15,
  [FarmerTrustTier.ESTABLISHED]: 1.0,
  [FarmerTrustTier.NEW]: 0.85,
};

/** Local data dominates; wider tiers only fill out the evidence base. */
export const GEO_WEIGHT: Record<GeoScope, number> = {
  COUNTY: 1.0,
  REGION: 0.6,
  NATIONAL: 0.3,
};

/** Points tied to a disputed or refunded order are nearly discounted. */
export const DISPUTED_WEIGHT = 0.25;

export function recencyWeight(ageDays: number, halfLife: number = HALF_LIFE_DAYS): number {
  if (ageDays <= 0) return 1;
  return Math.pow(0.5, ageDays / halfLife);
}

export function sourceWeight(source: string): number {
  return SOURCE_WEIGHT[source] ?? 0.5;
}

export function trustWeight(tier: FarmerTrustTier | null | undefined): number {
  if (!tier) return TRUST_WEIGHT[FarmerTrustTier.NEW];
  return TRUST_WEIGHT[tier] ?? TRUST_WEIGHT[FarmerTrustTier.NEW];
}

export function geoWeight(scope: GeoScope): number {
  return GEO_WEIGHT[scope];
}

export interface WeightInputs {
  ageDays: number;
  source: string;
  tier: FarmerTrustTier | null | undefined;
  scope: GeoScope;
  isDisputed: boolean;
}

/** Combined per-point weight. Always ≥ 0. */
export function pointWeight(input: WeightInputs): number {
  const w =
    recencyWeight(input.ageDays) *
    sourceWeight(input.source) *
    trustWeight(input.tier) *
    geoWeight(input.scope) *
    (input.isDisputed ? DISPUTED_WEIGHT : 1);
  return w > 0 ? w : 0;
}

export interface WeightedValue {
  value: number;
  weight: number;
}

/**
 * Weighted percentile (0–100) via the cumulative-weight method. Robust to
 * outliers, which is why the headline recommendation uses the median (p50).
 * Returns null when there is no positive weight.
 */
export function weightedPercentile(points: readonly WeightedValue[], percentile: number): number | null {
  const valid = points.filter((p) => p.weight > 0).sort((a, b) => a.value - b.value);
  if (valid.length === 0) return null;

  const totalWeight = valid.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight <= 0) return null;

  const target = (percentile / 100) * totalWeight;
  let cumulative = 0;
  for (const point of valid) {
    cumulative += point.weight;
    if (cumulative >= target) return point.value;
  }
  return valid[valid.length - 1]?.value ?? null;
}

export function weightedMedian(points: readonly WeightedValue[]): number | null {
  return weightedPercentile(points, 50);
}

export function weightedMean(points: readonly WeightedValue[]): number | null {
  const totalWeight = points.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight <= 0) return null;
  const weightedSum = points.reduce((sum, p) => sum + p.value * p.weight, 0);
  return weightedSum / totalWeight;
}

export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Rounds to whole KES — prices are never shown to sub-shilling precision. */
export function roundKES(value: number): number {
  return Math.round(value);
}
