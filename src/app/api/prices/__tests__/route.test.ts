/**
 * @jest-environment node
 *
 * D13 — GET /api/prices.
 *
 * This endpoint carried defect D1 long after the engine was fixed: it computed
 * `averagePrice`, `lowestPrice` and `highestPrice` over every row for a crop
 * with no unit filter, so a min and a max were routinely drawn from different
 * units (maize trades at ~KES 40/KG and ~KES 3,600/BAG). The resolution was
 * deletion rather than a second copy of the unit logic — one place decides what
 * a crop is worth, and it is the recommendation engine.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockPriceFind = jest.fn();
jest.mock('@/lib/models/PriceHistory.model', () => ({
  __esModule: true,
  default: { find: (...a: unknown[]) => mockPriceFind(...a) },
}));

const mockInsightFind = jest.fn();
jest.mock('@/lib/models/MarketInsight.model', () => ({
  __esModule: true,
  default: { find: (...a: unknown[]) => mockInsightFind(...a) },
}));

const mockCompose = jest.fn();
jest.mock('@/lib/intelligence/priceIntelligence', () => ({
  composeRecommendation: (...a: unknown[]) => mockCompose(...a),
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET } from '../route';

const FARMER_SESSION = { user: { id: 'farmer-001', role: 'FARMER' } };

/** Mongoose chain stub — the route calls sort/select/limit then awaits. */
function chain(rows: unknown[]) {
  const c: Record<string, unknown> = {};
  c['sort'] = () => c;
  c['select'] = () => c;
  c['limit'] = () => c;
  c['lean'] = () => Promise.resolve(rows);
  return c;
}

function request(query: string) {
  return new NextRequest(`http://localhost/api/prices?${query}`);
}

const KG_ROWS = [
  { cropName: 'Maize', pricePerUnit: 40, unit: 'KG', source: 'ORDER_COMPLETED', recordedAt: new Date() },
  { cropName: 'Maize', pricePerUnit: 42, unit: 'KG', source: 'ORDER_COMPLETED', recordedAt: new Date() },
];

describe('GET /api/prices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockPriceFind.mockReturnValue(chain(KG_ROWS));
    mockInsightFind.mockReturnValue(chain([]));
    mockCompose.mockResolvedValue({ recommendedPricePerUnit: 41 });
  });

  describe('the unit is required', () => {
    it('rejects a request with no unit', async () => {
      const res = await GET(request('cropName=Maize&county=Kiambu'));
      expect(res.status).toBe(400);
      expect(((await res.json()) as { code: string }).code).toBe('VALIDATION_FAILED');
    });

    it('rejects a unit outside the taxonomy', async () => {
      const res = await GET(request('cropName=Maize&county=Kiambu&unit=SACKS'));
      expect(res.status).toBe(400);
    });

    it('accepts a lowercase unit, since PriceHistory.unit is a plain String', async () => {
      const res = await GET(request('cropName=Maize&county=Kiambu&unit=kg'));
      expect(res.status).toBe(200);
    });

    it('still requires cropName and county', async () => {
      const res = await GET(request('unit=KG'));
      expect(res.status).toBe(400);
    });
  });

  it('filters the series to the requested unit at the database', async () => {
    await GET(request('cropName=Maize&county=Kiambu&unit=KG'));

    const filter = mockPriceFind.mock.calls[0]?.[0] as { unit: RegExp };
    expect(filter.unit).toBeInstanceOf(RegExp);
    expect(filter.unit.test('kg')).toBe(true);
    expect(filter.unit.test('BAG')).toBe(false);
  });

  it('no longer returns a central price or a min/max', async () => {
    const res = await GET(request('cropName=Maize&county=Kiambu&unit=KG'));
    const body = (await res.json()) as { data: { stats: Record<string, unknown> } };

    expect(body.data.stats).not.toHaveProperty('averagePrice');
    expect(body.data.stats).not.toHaveProperty('lowestPrice');
    expect(body.data.stats).not.toHaveProperty('highestPrice');
    expect(body.data.stats.dataPointCount).toBe(2);
  });

  it('measures the platform premium against the engine, not its own mean', async () => {
    mockInsightFind.mockReturnValue(
      chain([{ cropName: 'Maize', pricing: { middlemanBenchmark: 30 }, weekOf: new Date() }])
    );

    const res = await GET(request('cropName=Maize&county=Kiambu&unit=KG'));
    const body = (await res.json()) as { data: { stats: { platformPremium: number | null } } };

    expect(mockCompose).toHaveBeenCalledWith(
      expect.objectContaining({ crop: 'Maize', county: 'Kiambu', unit: 'KG' })
    );
    // 41 (engine) vs 30 (benchmark) — not the 41 the old row mean happened to be.
    expect(body.data.stats.platformPremium).not.toBeNull();
  });

  it('reports no premium when the engine has no price to offer', async () => {
    mockCompose.mockResolvedValue({ recommendedPricePerUnit: null });
    mockInsightFind.mockReturnValue(
      chain([{ cropName: 'Maize', pricing: { middlemanBenchmark: 30 }, weekOf: new Date() }])
    );

    const res = await GET(request('cropName=Maize&county=Kiambu&unit=KG'));
    const body = (await res.json()) as { data: { stats: { platformPremium: number | null } } };

    expect(body.data.stats.platformPremium).toBeNull();
  });

  it('resolves the MarketInsight lookup through the taxonomy, not exact equality', async () => {
    await GET(request('cropName=maize&county=Kiambu&unit=KG'));

    const filter = mockInsightFind.mock.calls[0]?.[0] as { cropName: unknown };
    // D3 survived here as a raw string; it is now the same pattern the history
    // query uses, so a crop cannot match its history and miss its benchmark.
    expect(filter.cropName).toBeInstanceOf(RegExp);
  });

  // ── D17 — the benchmark must be quoted in the unit that was asked for ──────

  it('D17 — filters the MarketInsight lookup by unit', async () => {
    // Before this filter existed the route returned the newest record for the
    // crop whatever basis it was written on, so a KG request could be answered
    // with a 90 kg BAG benchmark of 3,400 and `platformPremium` would divide a
    // per-kg median by a per-bag figure.
    await GET(request('cropName=maize&county=Kiambu&unit=KG'));

    const filter = mockInsightFind.mock.calls[0]?.[0] as { unit: RegExp };
    expect(filter.unit).toBeInstanceOf(RegExp);
    expect(filter.unit.test('kg')).toBe(true);
    expect(filter.unit.test('BAG')).toBe(false);
  });

  it('D17 — a BAG request asks for the BAG record, not the crop\'s newest', async () => {
    await GET(request('cropName=maize&county=Kiambu&unit=BAG'));

    const filter = mockInsightFind.mock.calls[0]?.[0] as { unit: RegExp };
    expect(filter.unit.test('BAG')).toBe(true);
    expect(filter.unit.test('KG')).toBe(false);
  });

  it('D17 — shows no benchmark when no record exists on the requested basis', async () => {
    // Records written before `unit` existed do not match the filter. Failing
    // closed is correct: no benchmark until the cron rewrites them, rather than
    // a confident figure on an unknown basis.
    mockInsightFind.mockReturnValue(chain([]));

    const res = await GET(request('cropName=Maize&county=Kiambu&unit=KG'));
    const body = (await res.json()) as {
      data: { stats: { middlemanBenchmark: number | null; platformPremium: number | null } };
    };

    expect(body.data.stats.middlemanBenchmark).toBeNull();
    expect(body.data.stats.platformPremium).toBeNull();
  });
});
