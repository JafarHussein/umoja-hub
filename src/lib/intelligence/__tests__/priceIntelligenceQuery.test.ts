/**
 * @jest-environment node
 *
 * D1 regression at the query layer.
 *
 * The pure layer already has this covered (`priceIntelligence.test.ts` — a KG
 * request must ignore BAG points). But D1 did not live in the pure layer. It
 * lived in `computeRecommendation`, which queried PriceHistory on `cropName`
 * and `recordedAt` only and whose `.select()` omitted the `unit` column — so
 * `EnginePoint` carried no unit and the pure layer was *structurally incapable*
 * of filtering. A correct weighted median over a corrupt point set returned
 * 3,500 for a KG request.
 *
 * That function is still executed by no other test (61.89% statement coverage
 * on this module, with 298–458 uncovered). These tests assert the contract the
 * engine has with the database: the filter it sends, and the columns it asks
 * for.
 *
 * On mocking, per `12` §3.2: this is a spy on a boundary, not a stand-in for
 * behaviour. It asserts *what query is issued*, which is exactly where the
 * defect was, and deliberately claims nothing about what MongoDB would return
 * for it — that needs the integration harness and a real database.
 */

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

// Bypass the cache so every call recomputes and the query is observable. The
// cache itself is covered by src/lib/__tests__/cache.test.ts (D5), and the real
// module would otherwise reach Upstash using the credentials in .env.local.
jest.mock('@/lib/cache', () => ({
  cacheKey: (...parts: unknown[]) => parts.join(':'),
  cached: <T>(_key: string, _ttl: number, compute: () => Promise<T>) => compute(),
}));

interface Chain {
  select: jest.Mock;
  sort: jest.Mock;
  limit: jest.Mock;
  lean: jest.Mock;
}

/** A chainable Mongoose query stub whose terminal `.lean()` resolves to `rows`. */
function chainable(rows: unknown[]): Chain {
  const chain: Partial<Chain> = {};
  chain.select = jest.fn(() => chain as Chain);
  chain.sort = jest.fn(() => chain as Chain);
  chain.limit = jest.fn(() => chain as Chain);
  chain.lean = jest.fn(() => Promise.resolve(rows));
  return chain as Chain;
}

const priceHistoryFind = jest.fn();
const trustFind = jest.fn((..._args: unknown[]) => chainable([]));
const orderFind = jest.fn((..._args: unknown[]) => chainable([]));
const listingFind = jest.fn((..._args: unknown[]) => chainable([]));

jest.mock('@/lib/models/PriceHistory.model', () => ({
  __esModule: true,
  default: { find: (...args: unknown[]) => priceHistoryFind(...args) },
}));
jest.mock('@/lib/models/FarmerTrustScore.model', () => ({
  __esModule: true,
  default: { find: (...args: unknown[]) => trustFind(...args) },
}));
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: { find: (...args: unknown[]) => orderFind(...args) },
}));
jest.mock('@/lib/models/MarketplaceListing.model', () => ({
  __esModule: true,
  default: { find: (...args: unknown[]) => listingFind(...args) },
}));

import { composeRecommendation } from '../priceIntelligence';
import { PriceHistorySource } from '@/types';

interface PriceFilter {
  cropName: RegExp;
  unit: RegExp;
  recordedAt: { $gte: Date };
}

function row(pricePerUnit: number, unit: string, daysAgo = 3) {
  return {
    cropName: 'Maize',
    pricePerUnit,
    unit,
    county: 'Kiambu',
    source: PriceHistorySource.ORDER_COMPLETED,
    recordedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    farmerId: 'farmer-1',
    orderId: null,
  };
}

/** The chain returned by the most recent PriceHistory.find call. */
let lastChain: Chain;

beforeEach(() => {
  jest.clearAllMocks();
  priceHistoryFind.mockImplementation(() => {
    lastChain = chainable([]);
    return lastChain;
  });
});

function priceFilter(): PriceFilter {
  return priceHistoryFind.mock.calls[0]?.[0] as PriceFilter;
}

describe('D1 — the PriceHistory query filters units at the database', () => {
  it('constrains the query by unit', async () => {
    // The defect: this key did not exist. Every unit for the crop came back and
    // the 3,000-row cap was shared across all of them.
    await composeRecommendation({ crop: 'Maize', county: 'Kiambu', unit: 'KG' });

    expect(priceHistoryFind).toHaveBeenCalledTimes(1);
    expect(priceFilter()).toHaveProperty('unit');
    expect(priceFilter().unit).toBeInstanceOf(RegExp);
  });

  it('anchors the unit pattern so KG cannot match BAG or 90KG BAG', async () => {
    await composeRecommendation({ crop: 'Maize', county: 'Kiambu', unit: 'KG' });
    const { unit } = priceFilter();

    expect(unit.test('KG')).toBe(true);
    expect(unit.test('kg')).toBe(true); // schema stores a plain String

    expect(unit.test('BAG')).toBe(false);
    expect(unit.test('90KG BAG')).toBe(false);
    expect(unit.test('KGS')).toBe(false);
  });

  it('selects the unit column, without which the pure layer cannot filter', async () => {
    // The other half of D1: even a correct filter leaves the pure layer blind if
    // the projection drops the column, because EnginePoint.unit arrives
    // undefined and sameUnit() compares against nothing.
    await composeRecommendation({ crop: 'Maize', county: 'Kiambu', unit: 'KG' });

    const projection = lastChain.select.mock.calls[0]?.[0] as string;
    expect(projection).toContain('unit');
    expect(projection).toContain('pricePerUnit');
    expect(projection).toContain('county');
    expect(projection).toContain('recordedAt');
  });

  it('bounds the query by the trend lookback window', async () => {
    await composeRecommendation({ crop: 'Maize', county: 'Kiambu', unit: 'KG' });
    const { recordedAt } = priceFilter();

    expect(recordedAt.$gte).toBeInstanceOf(Date);
    expect(recordedAt.$gte.getTime()).toBeLessThan(Date.now());
  });

  it('resolves the crop through the taxonomy rather than exact equality', async () => {
    // D3: /api/prices and the alert cron used exact string equality, so an alert
    // on "Milk" saw none of the engine's "dairy" rows.
    await composeRecommendation({ crop: 'Maize', county: 'Kiambu', unit: 'KG' });

    expect(priceFilter().cropName).toBeInstanceOf(RegExp);
    expect(priceFilter().cropName.test('Maize')).toBe(true);
  });

  it('passes the requested unit through, not a hard-coded default', async () => {
    await composeRecommendation({ crop: 'Maize', county: 'Kiambu', unit: 'BAG' });
    const { unit } = priceFilter();

    expect(unit.test('BAG')).toBe(true);
    expect(unit.test('KG')).toBe(false);
  });
});

describe('D1 — the pure layer still filters what the database returns', () => {
  it('excludes BAG rows from a KG recommendation even if the query returned them', async () => {
    // Defence in depth. If the database filter regresses, the recommendation
    // must still not be a median across two orders of magnitude — the exact
    // failure that produced 3,500 for a KG request.
    priceHistoryFind.mockImplementation(() => {
      lastChain = chainable([
        row(40, 'KG', 1),
        row(42, 'KG', 4),
        row(44, 'KG', 8),
        row(38, 'KG', 12),
        row(3600, 'BAG', 2),
        row(3500, 'BAG', 6),
        row(3700, 'BAG', 10),
      ]);
      return lastChain;
    });

    const reco = await composeRecommendation({ crop: 'Maize', county: 'Kiambu', unit: 'KG' });

    expect(reco.recommendedPricePerUnit).not.toBeNull();
    expect(reco.recommendedPricePerUnit as number).toBeLessThan(100);
    expect(reco.basis.dataPointCount).toBe(4);
  });

  it('reports a BAG recommendation in BAG terms from the same mixed set', async () => {
    priceHistoryFind.mockImplementation(() => {
      lastChain = chainable([
        row(40, 'KG', 1),
        row(42, 'KG', 4),
        row(44, 'KG', 8),
        row(3600, 'BAG', 2),
        row(3500, 'BAG', 6),
        row(3700, 'BAG', 10),
      ]);
      return lastChain;
    });

    const reco = await composeRecommendation({ crop: 'Maize', county: 'Kiambu', unit: 'BAG' });

    expect(reco.recommendedPricePerUnit as number).toBeGreaterThan(1000);
    expect(reco.basis.dataPointCount).toBe(3);
  });
});
