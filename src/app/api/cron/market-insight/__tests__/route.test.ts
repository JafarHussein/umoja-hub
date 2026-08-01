/**
 * @jest-environment node
 *
 * D17 — the market-insight cron writes one MarketInsight record per crop,
 * county AND unit.
 *
 * Two failures are covered here, and the second is the one that is invisible by
 * inspection:
 *
 *  1. The aggregation grouped on crop + county only, so `lowestPrice` and
 *     `highestPrice` were a min and a max over a bimodal KG/BAG set — D1, in the
 *     cron layer, surviving the fix to the engine.
 *  2. The upsert filter omitted `unit`, so the KG and BAG aggregations for one
 *     crop, county and week resolved to the SAME document and overwrote each
 *     other. The collection would end up holding whichever unit the pipeline
 *     happened to emit last, with no error anywhere.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockAggregate = jest.fn();
jest.mock('@/lib/models/PriceHistory.model', () => ({
  __esModule: true,
  default: { aggregate: (...a: unknown[]) => mockAggregate(...a) },
}));

const mockUpdate = jest.fn();
jest.mock('@/lib/models/MarketInsight.model', () => ({
  __esModule: true,
  default: { findOneAndUpdate: (...a: unknown[]) => mockUpdate(...a) },
}));

import { POST } from '../route';

const SECRET = 'test-cron-secret';

function request(): NextRequest {
  return new NextRequest('http://localhost/api/cron/market-insight', {
    method: 'POST',
    headers: { authorization: `Bearer ${SECRET}` },
  });
}

/** One aggregation bucket as the pipeline emits it. */
function bucket(cropName: string, county: string, unit: string, price: number) {
  return {
    _id: { cropName, county, unit },
    averageListingPrice: price,
    averageTransactionPrice: price,
    lowestPrice: price,
    highestPrice: price,
    dataPointCount: 5,
  };
}

describe('D17 — market-insight cron', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env['CRON_SECRET'] = SECRET;
    mockAggregate.mockResolvedValue([]);
    mockUpdate.mockResolvedValue({});
  });

  it('rejects a request without the bearer secret', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/cron/market-insight', { method: 'POST' })
    );
    expect(res.status).toBe(401);
  });

  it('groups the aggregation by unit as well as crop and county', async () => {
    await POST(request());

    const pipeline = mockAggregate.mock.calls[0]?.[0] as Array<Record<string, unknown>>;
    const group = pipeline.find((stage) => '$group' in stage)?.['$group'] as {
      _id: Record<string, string>;
    };

    expect(group._id).toEqual(
      expect.objectContaining({ cropName: '$cropName', county: '$county', unit: '$unit' })
    );
  });

  it('keys the upsert on unit, so KG and BAG do not overwrite each other', async () => {
    // The exact scenario: maize in one county in one week, traded both per kg
    // (~40) and per 90 kg bag (~3,600).
    mockAggregate.mockResolvedValue([
      bucket('Maize', 'Nakuru', 'KG', 42),
      bucket('Maize', 'Nakuru', 'BAG', 3780),
    ]);

    await POST(request());

    expect(mockUpdate).toHaveBeenCalledTimes(2);
    const filters = mockUpdate.mock.calls.map((c) => c[0] as Record<string, unknown>);

    expect(filters[0]).toEqual(expect.objectContaining({ cropName: 'Maize', county: 'Nakuru', unit: 'KG' }));
    expect(filters[1]).toEqual(expect.objectContaining({ cropName: 'Maize', county: 'Nakuru', unit: 'BAG' }));

    // The filters must differ, or both writes land on one document.
    expect(filters[0]).not.toEqual(filters[1]);
  });

  it('stores the unit on the record itself', async () => {
    mockAggregate.mockResolvedValue([bucket('Tomatoes', 'Kirinyaga', 'KG', 77)]);

    await POST(request());

    const doc = mockUpdate.mock.calls[0]?.[1] as { unit: string; cropName: string };
    expect(doc.unit).toBe('KG');
    expect(doc.cropName).toBe('Tomatoes');
  });

  it('applies the per-kg benchmark only to the KG record', async () => {
    mockAggregate.mockResolvedValue([
      bucket('Maize', 'Nakuru', 'KG', 42),
      bucket('Maize', 'Nakuru', 'BAG', 3780),
    ]);

    await POST(request());

    const docs = mockUpdate.mock.calls.map(
      (c) => c[1] as { unit: string; pricing: { middlemanBenchmark: number | null; platformPremium: number | null } }
    );
    const kg = docs.find((d) => d.unit === 'KG');
    const bag = docs.find((d) => d.unit === 'BAG');

    // maize is 35 KES/kg in MIDDLEMAN_BENCHMARKS.
    expect(kg?.pricing.middlemanBenchmark).toBe(35);
    expect(kg?.pricing.platformPremium).toBe(20);

    // No bag-basis reference exists, and none is invented by conversion. The
    // old code wrote 35 here and computed a ~10,700% premium against it.
    expect(bag?.pricing.middlemanBenchmark).toBeNull();
    expect(bag?.pricing.platformPremium).toBeNull();
  });
});
