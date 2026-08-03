// ---------------------------------------------------------------------------
// Controlled price-series generation.
//
// The commerce phase already writes PriceHistory as a by-product of listings and
// completed orders, but that scatter has no deliberate direction. Price
// Intelligence is judged on whether it can show a *trend*, so the demo also lays
// down a few series with a known drift — a crop that is rising, one that is
// falling — for the counties the presentation visits.
//
// Kept as a separate pure module so it stays unit-testable: it touches no
// database and imports nothing at runtime (the mongoose reference is type-only
// and erased at compile time).
//
// D8: an earlier implementation hard-coded Jan–Feb 2024 timestamps. The engine
// weights points on a 21-day half-life inside a 90-day window, so every row fell
// outside it and a freshly built world rendered only empty states. Dates are now
// relative to the run.
// ---------------------------------------------------------------------------

import type { Types } from 'mongoose';
import { ListingUnit, PriceHistorySource } from '../../src/types';

/** A date `daysAgo` days before now. Relative to the run, never absolute (D8). */
export function docDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

export interface IPriceSeriesOptions {
  cropName: string;
  county: string;
  unit: ListingUnit;
  farmerId: Types.ObjectId;
  /** Price at the most recent point in the series. */
  endPrice: number;
  /** Percent change across the whole span; positive means rising. */
  driftPct: number;
  /** Number of observations. Must clear MIN_POINTS (3) after unit filtering. */
  points: number;
  /** Age in days of the oldest observation. */
  spanDays: number;
  /** Attached to the most recent ORDER_COMPLETED point, when supplied. */
  orderId?: Types.ObjectId;
}

/**
 * Builds a back-dated price series for one crop/county/unit.
 *
 * Sources alternate so the engine sees both aspirational asking prices and
 * settled sales — the split that drives its confidence score.
 */
export function priceSeries(options: IPriceSeriesOptions): Record<string, unknown>[] {
  const { cropName, county, unit, farmerId, endPrice, driftPct, points, spanDays } = options;
  const startPrice = endPrice / (1 + driftPct / 100);

  return Array.from({ length: points }, (_, i) => {
    const progress = points === 1 ? 1 : i / (points - 1);
    const daysAgo = Math.round(spanDays * (1 - progress));
    // Alternating jitter keeps the series from looking synthetic without
    // introducing outliers that would distort the weighted median.
    const jitter = i % 2 === 0 ? 1 : -1;
    const price = Math.round(startPrice + (endPrice - startPrice) * progress + jitter * endPrice * 0.01);
    const isSale = i % 2 === 1;

    return {
      cropName,
      county,
      pricePerUnit: price,
      unit,
      source: isSale ? PriceHistorySource.ORDER_COMPLETED : PriceHistorySource.LISTING_CREATED,
      farmerId,
      ...(isSale && i === points - 1 && options.orderId ? { orderId: options.orderId } : {}),
      recordedAt: docDate(daysAgo),
    };
  });
}
