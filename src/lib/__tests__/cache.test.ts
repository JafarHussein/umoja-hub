/**
 * @jest-environment node
 *
 * D5 regression — the read-through cache.
 *
 * D5 was "no caching": every debounced keystroke in the listing form ran five
 * queries including a PriceHistory read capped at 3,000 rows, and
 * cooperativeInsights called the engine up to eight times in a row. The fix was
 * `cached()` with a 10-minute TTL inside composeRecommendation.
 *
 * The rule that matters most here is `shouldCache`. composeRecommendation passes
 * `shouldCache: (r) => r.confidence > 0`, because a zero-confidence result is
 * indistinguishable from one produced while the database was unreachable, and
 * pinning that for ten minutes would turn a blip into a ten-minute outage.
 *
 * These tests target the in-memory path. `.env.local` defines Upstash
 * credentials and next/jest loads it, so the module-level `redis` client would
 * otherwise be live and these tests would talk to the network — the env vars are
 * cleared before the module is first imported. The Redis branch is not covered
 * here; it is fail-open by construction and needs an integration harness.
 */

type CacheModule = typeof import('../cache');

let cached: CacheModule['cached'];
let cacheKey: CacheModule['cacheKey'];

beforeAll(async () => {
  delete process.env['UPSTASH_REDIS_REST_URL'];
  delete process.env['UPSTASH_REDIS_REST_TOKEN'];
  jest.resetModules();
  const mod = await import('../cache');
  cached = mod.cached;
  cacheKey = mod.cacheKey;
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** Stands in for the shape composeRecommendation caches. */
interface Reco {
  confidence: number;
}

/** Unique per test so the module-scoped store cannot leak between them. */
let keySeq = 0;
function freshKey(): string {
  keySeq += 1;
  return `test:d5:${keySeq}`;
}

describe('D5 — cached()', () => {
  it('computes on a miss and returns the computed value', async () => {
    const compute = jest.fn().mockResolvedValue({ value: 1 });

    const result = await cached(freshKey(), 600, compute);

    expect(result).toEqual({ value: 1 });
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('serves the second call from cache without recomputing', async () => {
    const key = freshKey();
    const compute = jest.fn().mockResolvedValue({ value: 1 });

    await cached(key, 600, compute);
    const second = await cached(key, 600, compute);

    // The whole point of D5: the listing form fires this on every keystroke.
    expect(second).toEqual({ value: 1 });
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('recomputes once the TTL has elapsed', async () => {
    const key = freshKey();
    const compute = jest.fn().mockResolvedValue({ value: 1 });
    const start = Date.now();
    const now = jest.spyOn(Date, 'now').mockReturnValue(start);

    await cached(key, 600, compute);
    now.mockReturnValue(start + 601_000);
    await cached(key, 600, compute);

    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('still serves from cache one second before the TTL elapses', async () => {
    const key = freshKey();
    const compute = jest.fn().mockResolvedValue({ value: 1 });
    const start = Date.now();
    const now = jest.spyOn(Date, 'now').mockReturnValue(start);

    await cached(key, 600, compute);
    now.mockReturnValue(start + 599_000);
    await cached(key, 600, compute);

    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('does not store a value rejected by shouldCache', async () => {
    // composeRecommendation's zero-confidence rule. A degraded result must never
    // be pinned, so every call recomputes until a real answer appears.
    const key = freshKey();
    const compute = jest.fn().mockResolvedValue({ confidence: 0 });

    await cached<Reco>(key, 600, compute, { shouldCache: (r) => r.confidence > 0 });
    await cached<Reco>(key, 600, compute, { shouldCache: (r) => r.confidence > 0 });

    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('stores a value accepted by shouldCache', async () => {
    const key = freshKey();
    const compute = jest.fn().mockResolvedValue({ confidence: 80 });

    await cached<Reco>(key, 600, compute, { shouldCache: (r) => r.confidence > 0 });
    await cached<Reco>(key, 600, compute, { shouldCache: (r) => r.confidence > 0 });

    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('returns the degraded value to the caller even when it is not stored', async () => {
    // Not caching it must not mean withholding it — the engine still has to
    // answer, with a null-price zero-confidence recommendation.
    const compute = jest.fn().mockResolvedValue({ confidence: 0 });

    const result = await cached<Reco>(freshKey(), 600, compute, {
      shouldCache: (r) => r.confidence > 0,
    });

    expect(result).toEqual({ confidence: 0 });
  });

  it('propagates a compute rejection and caches nothing', async () => {
    const key = freshKey();
    const compute = jest.fn().mockRejectedValue(new Error('db down'));

    await expect(cached(key, 600, compute)).rejects.toThrow('db down');

    // A thrown error must not poison the key for the rest of the TTL.
    compute.mockResolvedValue({ value: 'recovered' });
    await expect(cached(key, 600, compute)).resolves.toEqual({ value: 'recovered' });
  });

  it('keeps distinct keys independent', async () => {
    const a = jest.fn().mockResolvedValue('a');
    const b = jest.fn().mockResolvedValue('b');

    await expect(cached(freshKey(), 600, a)).resolves.toBe('a');
    await expect(cached(freshKey(), 600, b)).resolves.toBe('b');
  });
});

describe('D5 — cacheKey()', () => {
  it('normalizes case and surrounding whitespace so variants share an entry', () => {
    expect(cacheKey('price-reco', 'Maize', ' Kiambu ', 'KG')).toBe(
      cacheKey('price-reco', 'maize', 'kiambu', 'kg')
    );
  });

  it('keeps key shape constant when a part is null or undefined', () => {
    expect(cacheKey('price-reco', 'maize', null, 'kg')).toBe('price-reco:maize::kg');
    expect(cacheKey('price-reco', 'maize', undefined, 'kg')).toBe('price-reco:maize::kg');
  });

  it('does not collide across different crops in the same county', () => {
    expect(cacheKey('price-reco', 'maize', 'kiambu', 'kg')).not.toBe(
      cacheKey('price-reco', 'beans', 'kiambu', 'kg')
    );
  });
});
