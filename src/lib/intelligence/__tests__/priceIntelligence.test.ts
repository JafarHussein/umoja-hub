/**
 * @jest-environment node
 *
 * Unit tests for the pure recommendation assembler (assembleRecommendation).
 * No DB — points and demand metrics are supplied directly.
 */

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

import { assembleRecommendation } from '../priceIntelligence';
import type { EnginePoint } from '../priceIntelligence';
import type { DemandInputs } from '../demand';
import { FarmerTrustTier, PriceHistorySource } from '@/types';

const NOW = new Date('2026-06-22T00:00:00Z');

function point(overrides: Partial<EnginePoint> & { pricePerUnit: number; county: string }): EnginePoint {
  return {
    unit: 'KG',
    source: PriceHistorySource.ORDER_COMPLETED,
    recordedAt: new Date(NOW.getTime() - 3 * 86400000),
    tier: FarmerTrustTier.TRUSTED,
    isDisputed: false,
    ...overrides,
  };
}

const ZERO_DEMAND: DemandInputs = {
  completedOrders30d: 0,
  activeListings: 0,
  totalQuantityOrdered: 0,
  totalQuantityListed: 0,
  avgViewCount: 0,
};

describe('assembleRecommendation', () => {
  it('recommends a county price from rich local data', () => {
    const points: EnginePoint[] = [70, 72, 74, 75, 76, 78, 80].map((p, i) =>
      point({
        pricePerUnit: p,
        county: 'Kiambu',
        recordedAt: new Date(NOW.getTime() - (i + 1) * 86400000),
      })
    );

    const rec = assembleRecommendation({
      crop: 'tomatoes',
      county: 'Kiambu',
      unit: 'KG',
      quantity: 200,
      points,
      demandInputs: {
        completedOrders30d: 12,
        activeListings: 3,
        totalQuantityOrdered: 60,
        totalQuantityListed: 100,
        avgViewCount: 90,
      },
      now: NOW,
    });

    expect(rec.basis.geoScope).toBe('COUNTY');
    expect(rec.recommendedPricePerUnit).not.toBeNull();
    expect(rec.recommendedPricePerUnit as number).toBeGreaterThanOrEqual(70);
    expect(rec.recommendedPricePerUnit as number).toBeLessThanOrEqual(80);
    expect(rec.range).not.toBeNull();
    expect((rec.range as { low: number }).low).toBeLessThanOrEqual(rec.recommendedPricePerUnit as number);
    expect(rec.expectedEarningsKES).toBe((rec.recommendedPricePerUnit as number) * 200);
    expect(rec.confidence).toBeGreaterThan(0);
    expect(rec.insight).toContain('Kiambu');
  });

  it('widens to the region when the county is sparse', () => {
    const points: EnginePoint[] = [
      point({ pricePerUnit: 70, county: 'Kiambu' }), // 1 county point
      point({ pricePerUnit: 72, county: 'Nyeri' }), // Central region
      point({ pricePerUnit: 74, county: 'Nyeri' }),
      point({ pricePerUnit: 76, county: "Murang'a" }),
    ];

    const rec = assembleRecommendation({
      crop: 'tomatoes',
      county: 'Kiambu',
      unit: 'KG',
      points,
      demandInputs: ZERO_DEMAND,
      now: NOW,
    });

    expect(rec.basis.geoScope).toBe('REGION');
    expect(rec.recommendedPricePerUnit).not.toBeNull();
    expect(rec.confidence).toBeLessThan(75); // region fallback caps confidence
  });

  it('returns a null price and honest insight when there is no data', () => {
    const rec = assembleRecommendation({
      crop: 'kale',
      county: 'Lamu',
      unit: 'KG',
      points: [],
      demandInputs: ZERO_DEMAND,
      now: NOW,
    });

    expect(rec.recommendedPricePerUnit).toBeNull();
    expect(rec.range).toBeNull();
    expect(rec.confidence).toBe(0);
    expect(rec.demand.level).toBe('LOW');
    expect(rec.insight).toMatch(/Not enough/i);
    expect(rec.basis.dataPointCount).toBe(0);
  });

  it('caps national-fallback confidence below ~60', () => {
    const points: EnginePoint[] = [60, 62, 64, 66, 68].map((p) =>
      point({ pricePerUnit: p, county: 'Kisumu' }) // all distant from target
    );

    const rec = assembleRecommendation({
      crop: 'maize',
      county: 'Mombasa',
      unit: 'KG',
      points,
      demandInputs: ZERO_DEMAND,
      now: NOW,
    });

    expect(rec.basis.geoScope).toBe('NATIONAL');
    expect(rec.confidence).toBeLessThanOrEqual(60);
  });

  // Regression: PriceHistory holds maize both per 90kg BAG (~KES 3,600) and per
  // KG (~KES 40). The engine used to query by cropName + date only and echo the
  // requested unit back without ever filtering on it, so both clusters entered
  // the same weighted median. Conversion is NOT the fix — a Kenyan "bag" has no
  // single legal weight (see src/lib/taxonomy/units.ts) — filtering is.
  it('never mixes units — a KG request ignores BAG points for the same crop', () => {
    const points: EnginePoint[] = [
      ...[38, 40, 42].map((p) => point({ pricePerUnit: p, county: 'Uasin Gishu', unit: 'KG' })),
      ...[3500, 3600, 3700, 3800].map((p) =>
        point({ pricePerUnit: p, county: 'Uasin Gishu', unit: 'BAG' })
      ),
    ];

    const rec = assembleRecommendation({
      crop: 'maize',
      county: 'Uasin Gishu',
      unit: 'KG',
      points,
      demandInputs: ZERO_DEMAND,
      now: NOW,
    });

    expect(rec.basis.dataPointCount).toBe(3);
    expect(rec.recommendedPricePerUnit as number).toBeLessThan(100);
    expect((rec.range as { low: number; high: number }).high).toBeLessThan(100);
    expect(rec.nationalAveragePerUnit as number).toBeLessThan(100);
  });

  it('never mixes units — a BAG request ignores KG points for the same crop', () => {
    const points: EnginePoint[] = [
      ...[38, 40, 42, 44].map((p) => point({ pricePerUnit: p, county: 'Uasin Gishu', unit: 'KG' })),
      ...[3500, 3600, 3700].map((p) =>
        point({ pricePerUnit: p, county: 'Uasin Gishu', unit: 'BAG' })
      ),
    ];

    const rec = assembleRecommendation({
      crop: 'maize',
      county: 'Uasin Gishu',
      unit: 'BAG',
      points,
      demandInputs: ZERO_DEMAND,
      now: NOW,
    });

    expect(rec.basis.dataPointCount).toBe(3);
    expect(rec.recommendedPricePerUnit as number).toBeGreaterThan(1000);
  });

  it('reports no recommendation when the requested unit has too few points', () => {
    const points: EnginePoint[] = [
      point({ pricePerUnit: 40, county: 'Uasin Gishu', unit: 'KG' }),
      ...[3500, 3600, 3700].map((p) =>
        point({ pricePerUnit: p, county: 'Uasin Gishu', unit: 'BAG' })
      ),
    ];

    const rec = assembleRecommendation({
      crop: 'maize',
      county: 'Uasin Gishu',
      unit: 'KG',
      points,
      demandInputs: ZERO_DEMAND,
      now: NOW,
    });

    // One KG point is below MIN_POINTS, and BAG points must not pad it out.
    expect(rec.recommendedPricePerUnit).toBeNull();
    expect(rec.confidence).toBe(0);
    expect(rec.insight).toMatch(/Not enough/i);
  });

  it('down-weights disputed points out of the headline', () => {
    const clean: EnginePoint[] = [74, 75, 76].map((p) => point({ pricePerUnit: p, county: 'Kiambu' }));
    const withDisputedOutlier: EnginePoint[] = [
      ...clean,
      point({ pricePerUnit: 200, county: 'Kiambu', isDisputed: true }),
    ];

    const rec = assembleRecommendation({
      crop: 'tomatoes',
      county: 'Kiambu',
      unit: 'KG',
      points: withDisputedOutlier,
      demandInputs: ZERO_DEMAND,
      now: NOW,
    });

    // The disputed 200 is nearly discounted, so the median stays near 75.
    expect(rec.recommendedPricePerUnit as number).toBeLessThan(100);
  });
});

/**
 * D12 — the anti-feedback rule (`06` §3).
 *
 * Without it, a farmer types a price, saves, reopens the form, and the
 * recommendation has drifted toward whatever they typed: their own asking price
 * became evidence for the advice given back to them. Their completed sales are
 * deliberately kept, because those are settled facts rather than aspirations.
 */
describe('assembleRecommendation — excludeFarmerId', () => {
  const OWNER = 'farmer-owner';

  function ownListing(price: number, daysAgo: number): EnginePoint {
    return point({
      pricePerUnit: price,
      county: 'Kiambu',
      source: PriceHistorySource.LISTING_CREATED,
      farmerId: OWNER,
      recordedAt: new Date(NOW.getTime() - daysAgo * 86400000),
    });
  }

  function marketSale(price: number, daysAgo: number): EnginePoint {
    return point({
      pricePerUnit: price,
      county: 'Kiambu',
      source: PriceHistorySource.ORDER_COMPLETED,
      farmerId: 'someone-else',
      recordedAt: new Date(NOW.getTime() - daysAgo * 86400000),
    });
  }

  const base = { crop: 'tomatoes', county: 'Kiambu', unit: 'KG', demandInputs: ZERO_DEMAND, now: NOW };

  it('drops the requesting farmer’s own asking prices', () => {
    const points = [
      marketSale(70, 1),
      marketSale(72, 3),
      marketSale(74, 5),
      ownListing(500, 2),
      ownListing(520, 4),
    ];

    const withOwn = assembleRecommendation({ ...base, points });
    const withoutOwn = assembleRecommendation({ ...base, points, excludeFarmerId: OWNER });

    expect(withOwn.basis.dataPointCount).toBe(5);
    expect(withoutOwn.basis.dataPointCount).toBe(3);
    expect(withoutOwn.recommendedPricePerUnit as number).toBeLessThan(100);
  });

  it('keeps the same farmer’s completed sales — those are settled facts', () => {
    const points = [
      point({
        pricePerUnit: 70,
        county: 'Kiambu',
        source: PriceHistorySource.ORDER_COMPLETED,
        farmerId: OWNER,
      }),
      marketSale(72, 3),
      marketSale(74, 5),
      ownListing(500, 2),
    ];

    const rec = assembleRecommendation({ ...base, points, excludeFarmerId: OWNER });

    expect(rec.basis.dataPointCount).toBe(3);
    expect(rec.recommendedPricePerUnit as number).toBeLessThan(100);
  });

  it('leaves other farmers’ listings untouched', () => {
    const points = [
      marketSale(70, 1),
      marketSale(72, 3),
      point({
        pricePerUnit: 74,
        county: 'Kiambu',
        source: PriceHistorySource.LISTING_CREATED,
        farmerId: 'another-farmer',
      }),
      ownListing(500, 2),
    ];

    const rec = assembleRecommendation({ ...base, points, excludeFarmerId: OWNER });

    expect(rec.basis.dataPointCount).toBe(3);
  });

  it('is a no-op when the farmer has no listings of their own', () => {
    const points = [marketSale(70, 1), marketSale(72, 3), marketSale(74, 5)];

    const withFilter = assembleRecommendation({ ...base, points, excludeFarmerId: OWNER });
    const without = assembleRecommendation({ ...base, points });

    expect(withFilter.recommendedPricePerUnit).toBe(without.recommendedPricePerUnit);
    expect(withFilter.basis.dataPointCount).toBe(without.basis.dataPointCount);
  });

  it('does not drop points that carry no farmerId at all', () => {
    const points = [
      point({ pricePerUnit: 70, county: 'Kiambu', source: PriceHistorySource.LISTING_CREATED }),
      marketSale(72, 3),
      marketSale(74, 5),
    ];

    const rec = assembleRecommendation({ ...base, points, excludeFarmerId: OWNER });

    expect(rec.basis.dataPointCount).toBe(3);
  });

  it('also removes them from the trend, not just the median', () => {
    // Own listings climb steeply in the recent window; market sales are flat.
    const points = [
      marketSale(100, 2),
      marketSale(100, 4),
      marketSale(100, 10),
      marketSale(100, 12),
      ownListing(400, 1),
      ownListing(420, 3),
    ];

    const withoutOwn = assembleRecommendation({ ...base, points, excludeFarmerId: OWNER });

    expect(withoutOwn.trend.direction).toBe('STABLE');
  });
});
