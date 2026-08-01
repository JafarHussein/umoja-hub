/**
 * @jest-environment node
 *
 * Unit tests for the pure Price Intelligence helpers: regions, seasonality,
 * weighting statistics, trend classification, demand scoring, insight builder.
 */

import { regionOf, regionPeers, scopeOf } from '../regions';
import { getSeasonPhase, normalizeCrop } from '../seasonality';
import {
  recencyWeight,
  sourceWeight,
  trustWeight,
  geoWeight,
  pointWeight,
  weightedMedian,
  weightedPercentile,
  weightedMean,
  mean,
  roundKES,
} from '../weighting';
import { classifyTrend, changePct } from '../trend';
import type { TrendPoint } from '../trend';
import { scoreDemand } from '../demand';
import { buildInsight } from '../insight';
import { FarmerTrustTier, PriceHistorySource } from '@/types';

describe('regions', () => {
  it('maps counties to their region', () => {
    expect(regionOf('Kiambu')).toBe('Central');
    expect(regionOf('Kisumu')).toBe('Nyanza');
    expect(regionOf('Mombasa')).toBe('Coast');
    expect(regionOf("Murang'a")).toBe('Central');
  });

  it('returns null for an unknown county', () => {
    expect(regionOf('Atlantis')).toBeNull();
  });

  it('classifies scope relative to a target county', () => {
    expect(scopeOf('Kiambu', 'Kiambu')).toBe('COUNTY');
    expect(scopeOf('Kiambu', 'Nyeri')).toBe('REGION'); // both Central
    expect(scopeOf('Kiambu', 'Kisumu')).toBe('NATIONAL');
  });

  it('lists region peers including itself', () => {
    expect(regionPeers('Kiambu')).toContain('Nyeri');
    expect(regionPeers('Kiambu')).toContain('Kiambu');
  });
});

describe('seasonality', () => {
  it('normalises crop names', () => {
    expect(normalizeCrop('Kale (Sukuma Wiki)')).toBe('kale');
    expect(normalizeCrop('  Tomatoes ')).toBe('tomatoes');
  });

  it('returns the phase for a known crop/month', () => {
    // August (index 7) is maize harvest = PEAK_SUPPLY
    expect(getSeasonPhase('maize', new Date(2026, 7, 15))).toBe('PEAK_SUPPLY');
    // January (index 0) kale is LOW_SUPPLY
    expect(getSeasonPhase('kale (sukuma wiki)', new Date(2026, 0, 10))).toBe('LOW_SUPPLY');
  });

  it('returns UNKNOWN for an uncovered crop', () => {
    expect(getSeasonPhase('dragonfruit', new Date(2026, 5, 1))).toBe('UNKNOWN');
  });
});

describe('weighting — factors', () => {
  it('recency halves every half-life', () => {
    expect(recencyWeight(0)).toBe(1);
    expect(recencyWeight(21)).toBeCloseTo(0.5, 5);
    expect(recencyWeight(42)).toBeCloseTo(0.25, 5);
  });

  it('weights real sales above asking prices', () => {
    expect(sourceWeight(PriceHistorySource.ORDER_COMPLETED)).toBe(1.0);
    expect(sourceWeight(PriceHistorySource.LISTING_CREATED)).toBe(0.6);
  });

  it('weights trusted farmers above newcomers', () => {
    expect(trustWeight(FarmerTrustTier.PREMIUM)).toBeGreaterThan(trustWeight(FarmerTrustTier.NEW));
    expect(trustWeight(null)).toBe(trustWeight(FarmerTrustTier.NEW));
  });

  it('weights local data above distant data', () => {
    expect(geoWeight('COUNTY')).toBeGreaterThan(geoWeight('REGION'));
    expect(geoWeight('REGION')).toBeGreaterThan(geoWeight('NATIONAL'));
  });

  it('nearly discounts disputed points', () => {
    const base = pointWeight({
      ageDays: 0,
      source: PriceHistorySource.ORDER_COMPLETED,
      tier: FarmerTrustTier.ESTABLISHED,
      scope: 'COUNTY',
      isDisputed: false,
    });
    const disputed = pointWeight({
      ageDays: 0,
      source: PriceHistorySource.ORDER_COMPLETED,
      tier: FarmerTrustTier.ESTABLISHED,
      scope: 'COUNTY',
      isDisputed: true,
    });
    expect(disputed).toBeCloseTo(base * 0.25, 5);
  });
});

describe('weighting — statistics', () => {
  it('computes the weighted median (robust to an outlier)', () => {
    const points = [
      { value: 70, weight: 1 },
      { value: 72, weight: 1 },
      { value: 75, weight: 1 },
      { value: 7500, weight: 1 }, // fat-fingered outlier
    ];
    const m = weightedMedian(points);
    expect(m).not.toBeNull();
    expect(m as number).toBeLessThan(100); // outlier does not drag the median
  });

  it('computes percentiles for a range band', () => {
    const points = [10, 20, 30, 40].map((v) => ({ value: v, weight: 1 }));
    expect(weightedPercentile(points, 25)).toBe(10);
    expect(weightedPercentile(points, 75)).toBe(30);
  });

  it('weights the mean', () => {
    expect(weightedMean([{ value: 10, weight: 1 }, { value: 20, weight: 3 }])).toBe(17.5);
  });

  it('returns null with no positive weight', () => {
    expect(weightedMedian([{ value: 10, weight: 0 }])).toBeNull();
    expect(mean([])).toBeNull();
  });

  it('rounds to whole KES', () => {
    expect(roundKES(74.6)).toBe(75);
  });
});

describe('trend', () => {
  const now = new Date('2026-06-22T00:00:00Z');
  function ago(days: number, price: number): TrendPoint {
    return { pricePerUnit: price, recordedAt: new Date(now.getTime() - days * 86400000) };
  }

  it('flags a rising market', () => {
    const points = [
      ago(2, 110),
      ago(4, 112),
      ago(10, 100),
      ago(12, 98),
    ];
    expect(changePct(points, now, 7)).toBeGreaterThan(5);
    const t = classifyTrend(points, now);
    expect(['RISING']).toContain(t.direction);
  });

  it('flags a falling market', () => {
    const points = [ago(2, 90), ago(4, 88), ago(10, 100), ago(12, 102)];
    const t = classifyTrend(points, now);
    expect(t.direction).toBe('FALLING');
  });

  it('returns STABLE with no data', () => {
    const t = classifyTrend([], now);
    expect(t.direction).toBe('STABLE');
    expect(t.changePct30d).toBeNull();
  });

  // D11 — the windows were plain means, so one stale asking price counted as
  // much as a settled sale when deciding the direction the farmer is shown.
  describe('D11 — weighted windows', () => {
    function weighted(days: number, price: number, weight: number): TrendPoint {
      return { pricePerUnit: price, recordedAt: new Date(now.getTime() - days * 86400000), weight };
    }

    it('treats an absent weight as 1, preserving the unweighted result', () => {
      const points = [ago(2, 110), ago(4, 112), ago(10, 100), ago(12, 98)];
      const withOnes = points.map((p) => ({ ...p, weight: 1 }));

      expect(changePct(withOnes, now, 7)).toBe(changePct(points, now, 7));
    });

    it('lets a heavily weighted observation dominate its window', () => {
      // Recent window: 200 at weight 10 against 100 at weight 1 — the weighted
      // mean is ~190, so this is a rise. The plain mean is 150, a smaller one.
      const points = [
        weighted(2, 200, 10),
        weighted(3, 100, 1),
        weighted(10, 100, 1),
        weighted(11, 100, 1),
      ];

      const pct = changePct(points, now, 7);
      expect(pct).not.toBeNull();
      expect(pct as number).toBeGreaterThan(80);
      expect(classifyTrend(points, now).direction).toBe('RISING');
    });

    it('can reverse the classification a plain mean would have given', () => {
      // Unweighted, the recent window averages 105 against 100 — a rise inside
      // the ±5% stable band. Weighting the low observation heavily makes the
      // recent window genuinely lower, which is a fall.
      const points = [
        weighted(2, 90, 20),
        weighted(3, 120, 1),
        weighted(10, 100, 1),
        weighted(11, 100, 1),
      ];

      expect(classifyTrend(points, now).direction).toBe('FALLING');
    });

    it('ignores zero-weight observations entirely', () => {
      const points = [
        weighted(2, 500, 0),
        weighted(3, 110, 1),
        weighted(10, 100, 1),
        weighted(11, 100, 1),
      ];

      expect(changePct(points, now, 7)).toBe(10);
    });
  });
});

describe('demand', () => {
  it('scores a hot market as HIGH or VERY_HIGH', () => {
    const r = scoreDemand({
      completedOrders30d: 20,
      activeListings: 2,
      totalQuantityOrdered: 80,
      totalQuantityListed: 100,
      avgViewCount: 200,
    });
    expect(['HIGH', 'VERY_HIGH']).toContain(r.level);
    expect(r.score).toBeGreaterThan(0.5);
  });

  it('scores an empty market as LOW', () => {
    const r = scoreDemand({
      completedOrders30d: 0,
      activeListings: 0,
      totalQuantityOrdered: 0,
      totalQuantityListed: 0,
      avgViewCount: 0,
    });
    expect(r.level).toBe('LOW');
  });
});

describe('insight', () => {
  it('returns an honest message when there is no recommendation', () => {
    const text = buildInsight({
      crop: 'kale',
      county: 'Lamu',
      unit: 'KG',
      recommended: null,
      range: null,
      demand: 'LOW',
      trend: { direction: 'STABLE', changePct7d: null, changePct30d: null, changePct90d: null },
      season: 'UNKNOWN',
      geoScope: 'NATIONAL',
    });
    expect(text).toMatch(/Not enough/i);
    expect(text).toContain('kale');
  });

  it('describes demand, trend and range when data exists', () => {
    const text = buildInsight({
      crop: 'tomatoes',
      county: 'Kiambu',
      unit: 'KG',
      recommended: 75,
      range: { low: 68, high: 82 },
      demand: 'HIGH',
      trend: { direction: 'RISING', changePct7d: 4, changePct30d: 12, changePct90d: 20 },
      season: 'IN_SEASON',
      geoScope: 'COUNTY',
    });
    expect(text).toContain('Tomatoes');
    expect(text).toContain('Kiambu');
    expect(text).toContain('KSh 68–82');
    expect(text).toMatch(/\+12%/);
  });
});
