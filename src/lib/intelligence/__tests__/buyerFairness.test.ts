/**
 * @jest-environment node
 *
 * Buyer fairness projection (D14/D15/D16). Covers the pure layer only — the
 * classification and the projection contract. No DB.
 *
 * The classification is pure and positional, which is what guarantees a farmer
 * and a buyer looking at the same listing see the same judgement.
 */

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

import { assessPrice, projectBuyerFairness } from '../buyerFairness';
import type { PriceRecommendation } from '../priceIntelligence';

describe('assessPrice', () => {
  const range = { low: 100, high: 200 };

  it('classifies a price inside the range as IN_RANGE, inclusive of both bounds', () => {
    expect(assessPrice(150, range)).toBe('IN_RANGE');
    expect(assessPrice(100, range)).toBe('IN_RANGE');
    expect(assessPrice(200, range)).toBe('IN_RANGE');
  });

  it('separates ABOVE from WELL_ABOVE at 15% over the high bound', () => {
    expect(assessPrice(201, range)).toBe('ABOVE');
    expect(assessPrice(230, range)).toBe('ABOVE'); // exactly +15% is not yet "well"
    expect(assessPrice(231, range)).toBe('WELL_ABOVE');
  });

  it('separates BELOW from WELL_BELOW at 15% under the low bound', () => {
    expect(assessPrice(99, range)).toBe('BELOW');
    expect(assessPrice(85, range)).toBe('BELOW'); // exactly -15% is not yet "well"
    expect(assessPrice(84, range)).toBe('WELL_BELOW');
  });

  it('returns null rather than a default band when there is no range', () => {
    // The engine returns a null range below MIN_POINTS. A missing verdict must
    // never fall back to IN_RANGE, which would read as an endorsement.
    expect(assessPrice(150, null)).toBeNull();
  });

  it('returns null for a non-positive or non-finite price', () => {
    expect(assessPrice(0, range)).toBeNull();
    expect(assessPrice(-50, range)).toBeNull();
    expect(assessPrice(Number.NaN, range)).toBeNull();
  });
});

describe('projectBuyerFairness', () => {
  function recommendation(overrides: Partial<PriceRecommendation> = {}): PriceRecommendation {
    return {
      crop: 'tomatoes',
      county: 'Kirinyaga',
      unit: 'KG',
      recommendedPricePerUnit: 150,
      range: { low: 100, high: 200 },
      regionalAveragePerUnit: 148,
      nationalAveragePerUnit: 155,
      expectedEarningsKES: null,
      confidence: 80,
      confidenceBand: 'HIGH',
      insight: 'irrelevant to the projection',
      basis: {
        dataPointCount: 24,
        completedSaleShare: 0.5,
        geoScope: 'COUNTY',
        windowDays: 90,
      },
      ...overrides,
    } as PriceRecommendation;
  }

  it('carries confidence and geographic scope through to the buyer', () => {
    // D15: a verdict from a thin national fallback must not be indistinguishable
    // from one backed by a well-evidenced county median.
    const projected = projectBuyerFairness(recommendation(), 150);

    expect(projected).toEqual({
      assessment: 'IN_RANGE',
      confidenceBand: 'HIGH',
      basis: 'COUNTY',
      windowDays: 90,
    });
  });

  it('reports a national fallback honestly', () => {
    const projected = projectBuyerFairness(
      recommendation({
        confidenceBand: 'LOW',
        basis: { dataPointCount: 3, completedSaleShare: 0, geoScope: 'NATIONAL', windowDays: 90 },
      }),
      150
    );

    expect(projected.basis).toBe('NATIONAL');
    expect(projected.confidenceBand).toBe('LOW');
  });

  it('never exposes the seller price, range, or any trust input', () => {
    // The buyer must not receive the seller's number or negotiating floor, and
    // `06` §3 forbids presenting trust as having moved this price.
    const projected = projectBuyerFairness(recommendation(), 250);

    expect(Object.keys(projected).sort()).toEqual([
      'assessment',
      'basis',
      'confidenceBand',
      'windowDays',
    ]);
    expect(projected.assessment).toBe('WELL_ABOVE');
  });

  it('yields an unjudgeable assessment when the engine had too little evidence', () => {
    const projected = projectBuyerFairness(
      recommendation({
        recommendedPricePerUnit: null,
        range: null,
        confidence: 0,
        confidenceBand: 'LOW',
        basis: { dataPointCount: 1, completedSaleShare: 0, geoScope: 'NATIONAL', windowDays: 90 },
      }),
      150
    );

    expect(projected.assessment).toBeNull();
  });
});
