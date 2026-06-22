/**
 * @jest-environment node
 *
 * Unit tests for the pure admin price-analytics assembler + statistics.
 */

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

import {
  assemblePriceAnalytics,
  coefficientOfVariation,
} from '../priceAnalytics';
import type { AnalyticsPricePoint, AnalyticsListing } from '../priceAnalytics';
import { PriceHistorySource } from '@/types';

const NOW = new Date('2026-06-22T00:00:00Z');
function daysAgo(d: number): Date {
  return new Date(NOW.getTime() - d * 86400000);
}
function pt(
  crop: string,
  county: string,
  pricePerUnit: number,
  opts: Partial<AnalyticsPricePoint> = {}
): AnalyticsPricePoint {
  return {
    crop,
    county,
    unit: 'KG',
    pricePerUnit,
    source: PriceHistorySource.ORDER_COMPLETED,
    recordedAt: daysAgo(5),
    ...opts,
  };
}

describe('coefficientOfVariation', () => {
  it('is zero for identical values', () => {
    expect(coefficientOfVariation([10, 10, 10])).toBe(0);
  });
  it('is null for fewer than two values', () => {
    expect(coefficientOfVariation([5])).toBeNull();
    expect(coefficientOfVariation([])).toBeNull();
  });
  it('grows with spread', () => {
    const tight = coefficientOfVariation([70, 72, 74]) as number;
    const wide = coefficientOfVariation([40, 70, 110]) as number;
    expect(wide).toBeGreaterThan(tight);
  });
});

describe('assemblePriceAnalytics', () => {
  const points: AnalyticsPricePoint[] = [
    // Tomatoes — Central region (Kiambu, recent completed sales) + an outlier
    pt('tomatoes', 'Kiambu', 70),
    pt('tomatoes', 'Kiambu', 72),
    pt('tomatoes', 'Kiambu', 74),
    pt('tomatoes', 'Kiambu', 300), // anomaly
    // Central (Nyeri)
    pt('tomatoes', 'Nyeri', 71),
    pt('tomatoes', 'Nyeri', 73),
    // Nyanza (Kisumu)
    pt('tomatoes', 'Kisumu', 80),
    pt('tomatoes', 'Kisumu', 82),
    pt('tomatoes', 'Kisumu', 84),
  ];

  const listings: AnalyticsListing[] = [
    { crop: 'tomatoes', county: 'Kiambu', farmerId: 'A', quantityAvailable: 200 },
    { crop: 'tomatoes', county: 'Kiambu', farmerId: 'A', quantityAvailable: 150 },
    { crop: 'tomatoes', county: 'Kiambu', farmerId: 'B', quantityAvailable: 100 },
  ];

  const result = assemblePriceAnalytics(points, listings, NOW);

  it('summarises each commodity', () => {
    const tomatoes = result.commodityOverview.find((c) => c.crop === 'tomatoes');
    expect(tomatoes).toBeDefined();
    expect(tomatoes?.unit).toBe('KG');
    expect(tomatoes?.medianPrice).not.toBeNull();
    expect(tomatoes?.dataPointCount).toBe(9);
    expect(tomatoes?.volatilityPct).not.toBeNull();
  });

  it('compares regions for a crop', () => {
    const tomatoes = result.regionalComparison.find((c) => c.crop === 'tomatoes');
    expect(tomatoes).toBeDefined();
    expect(tomatoes?.regions.length).toBeGreaterThanOrEqual(2);
  });

  it('flags the price outlier as an anomaly', () => {
    const flagged = result.anomalies.find((a) => a.pricePerUnit === 300);
    expect(flagged).toBeDefined();
    expect(flagged?.crop).toBe('tomatoes');
    expect(flagged?.deviationPct).toBeGreaterThan(100);
  });

  it('surfaces demand hotspots from completed-sale velocity', () => {
    const hot = result.demandHotspots.find((h) => h.crop === 'tomatoes' && h.county === 'Kiambu');
    expect(hot).toBeDefined();
    expect(hot?.completedSales30d).toBeGreaterThanOrEqual(2);
    expect(hot?.activeListings).toBe(3);
  });

  it('reports supply concentration', () => {
    const conc = result.supplyConcentration.find((c) => c.crop === 'tomatoes');
    expect(conc?.activeListings).toBe(3);
    expect(conc?.sellerCount).toBe(2);
    expect(conc?.topSellerSharePct).toBe(67); // farmer A holds 2 of 3
  });

  it('returns empty structures for empty input', () => {
    const empty = assemblePriceAnalytics([], [], NOW);
    expect(empty.commodityOverview).toEqual([]);
    expect(empty.demandHotspots).toEqual([]);
    expect(empty.anomalies).toEqual([]);
  });
});
