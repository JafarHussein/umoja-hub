/**
 * @jest-environment node
 *
 * D8 regression — seeded price data must land inside the engine's window.
 *
 * D8 was: the seed script hard-coded its PriceHistory timestamps to Jan–Feb
 * 2024. The engine's recommendation statistic uses a 90-day window, so every
 * seeded row fell outside it, `dataPointCount` was zero for every crop, and a
 * freshly seeded database rendered nothing but empty states — on the demo path,
 * which is the one people judge the platform by.
 *
 * The failure was silent in the ordinary way: no error, no test, and an empty
 * state that is also the correct rendering for a genuinely empty database.
 */

import { docDate, priceSeries } from '../seedPriceSeries';
import { RECO_WINDOW_DAYS } from '../../src/lib/intelligence/priceIntelligence';
import { MIN_POINTS } from '../../src/lib/intelligence/weighting';
import { ListingUnit, PriceHistorySource } from '../../src/types';
import type { Types } from 'mongoose';

const DAY_MS = 24 * 60 * 60 * 1000;

// The generator only ever reads this back out, so a plain sentinel is enough
// and keeps the mongoose driver out of the test.
const FARMER_ID = 'seed-farmer' as unknown as Types.ObjectId;

function series(overrides: Partial<Parameters<typeof priceSeries>[0]> = {}) {
  return priceSeries({
    cropName: 'Maize',
    county: 'Kiambu',
    unit: ListingUnit.KG,
    farmerId: FARMER_ID,
    endPrice: 50,
    driftPct: 10,
    points: 8,
    spanDays: 60,
    ...overrides,
  });
}

describe('D8 — docDate', () => {
  it('is relative to now, never an absolute calendar date', () => {
    const before = Date.now();
    const result = docDate(30).getTime();
    const after = Date.now();

    expect(result).toBeGreaterThanOrEqual(before - 31 * DAY_MS);
    expect(result).toBeLessThanOrEqual(after - 29 * DAY_MS);
  });

  it('returns today for zero days ago', () => {
    expect(Math.abs(docDate(0).getTime() - Date.now())).toBeLessThan(DAY_MS);
  });
});

describe('D8 — priceSeries', () => {
  it('places every observation inside the engine recommendation window', () => {
    // The defect, stated directly: with 2024 timestamps this was zero of eight.
    const cutoff = Date.now() - RECO_WINDOW_DAYS * DAY_MS;
    const points = series();

    expect(points).toHaveLength(8);
    for (const point of points) {
      expect((point['recordedAt'] as Date).getTime()).toBeGreaterThan(cutoff);
    }
  });

  it('keeps a full-span series inside the window at the default 60-day span', () => {
    const oldest = series({ spanDays: 60 })
      .map((p) => (p['recordedAt'] as Date).getTime())
      .sort((a, b) => a - b)[0] as number;

    expect(Date.now() - oldest).toBeLessThan(RECO_WINDOW_DAYS * DAY_MS);
  });

  it('generates enough points to clear MIN_POINTS after unit filtering', () => {
    // D1 filters by unit, so a seeded cell must clear MIN_POINTS within a single
    // unit — not across the KG and BAG rows combined.
    const kg = series({ unit: ListingUnit.KG });

    expect(kg.length).toBeGreaterThanOrEqual(MIN_POINTS);
    expect(new Set(kg.map((p) => p['unit']))).toEqual(new Set([ListingUnit.KG]));
  });

  it('mixes completed sales with asking prices so confidence is not degenerate', () => {
    // completedSaleShare drives the source factor in the confidence score; an
    // all-listing series would seed a platform that looks permanently unsure.
    const sources = series().map((p) => p['source']);

    expect(sources).toContain(PriceHistorySource.ORDER_COMPLETED);
    expect(sources).toContain(PriceHistorySource.LISTING_CREATED);
  });

  it('orders points from oldest to newest across the requested span', () => {
    const times = series({ points: 6, spanDays: 45 }).map((p) =>
      (p['recordedAt'] as Date).getTime()
    );

    for (let i = 1; i < times.length; i += 1) {
      expect(times[i] as number).toBeGreaterThanOrEqual(times[i - 1] as number);
    }
  });

  it('lands the newest point at the requested end price, within jitter', () => {
    const points = series({ endPrice: 50, points: 8, driftPct: 10 });
    const newest = points[points.length - 1]?.['pricePerUnit'] as number;

    // Jitter is ±1% of endPrice by construction.
    expect(Math.abs(newest - 50)).toBeLessThanOrEqual(1);
  });

  it('applies drift in the requested direction', () => {
    const rising = series({ driftPct: 20, points: 9, endPrice: 100 });
    const first = rising[0]?.['pricePerUnit'] as number;
    const last = rising[rising.length - 1]?.['pricePerUnit'] as number;

    expect(last).toBeGreaterThan(first);
  });

  it('attaches the order id only to the newest completed sale', () => {
    const orderId = 'seed-order' as unknown as Types.ObjectId;
    const points = series({ points: 8, orderId });
    const withOrder = points.filter((p) => p['orderId'] !== undefined);

    expect(withOrder).toHaveLength(1);
    expect(withOrder[0]?.['source']).toBe(PriceHistorySource.ORDER_COMPLETED);
    expect(withOrder[0]).toBe(points[points.length - 1]);
  });
});
