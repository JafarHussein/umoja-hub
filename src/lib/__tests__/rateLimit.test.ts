/**
 * @jest-environment node
 *
 * Exercises the in-memory path, which is what runs locally and whenever Upstash
 * is unreachable. `peek` and `record` are the pair that lets a limit count
 * outcomes rather than requests; the distinction is the whole point, so it is
 * pinned here rather than only at the one route that uses it today.
 */

jest.mock('@/lib/redisClient', () => ({ createRedisClient: () => null }));

import { checkRateLimit, peekRateLimit, recordRateLimitUse } from '../rateLimit';

const WINDOW = 60_000;
let n = 0;
const freshKey = (): string => `test-key-${Date.now()}-${(n += 1)}`;

describe('checkRateLimit — counts attempts', () => {
  it('allows up to the limit and then refuses', async () => {
    const key = freshKey();
    for (let i = 0; i < 3; i += 1) {
      expect((await checkRateLimit(key, 3, WINDOW)).allowed).toBe(true);
    }
    expect((await checkRateLimit(key, 3, WINDOW)).allowed).toBe(false);
  });

  it('counts every call, successful or not — which is why it suits a throttle', async () => {
    // A brute-force guard must spend on failures. That is correct here and
    // wrong for a business cap, which is what `peek`/`record` exist for.
    const key = freshKey();
    await checkRateLimit(key, 2, WINDOW);
    await checkRateLimit(key, 2, WINDOW);
    expect((await checkRateLimit(key, 2, WINDOW)).allowed).toBe(false);
  });
});

describe('peekRateLimit — reads without spending', () => {
  it('allows an untouched key', async () => {
    expect((await peekRateLimit(freshKey(), 5)).allowed).toBe(true);
  });

  it('does not consume the allowance, however often it is asked', async () => {
    const key = freshKey();
    for (let i = 0; i < 50; i += 1) {
      expect((await peekRateLimit(key, 1)).allowed).toBe(true);
    }
    // Fifty refusals to buy still leave the buyer their first purchase.
    await recordRateLimitUse(key, WINDOW);
    expect((await peekRateLimit(key, 1)).allowed).toBe(false);
  });

  it('refuses once the allowance is spent', async () => {
    const key = freshKey();
    await recordRateLimitUse(key, WINDOW);
    await recordRateLimitUse(key, WINDOW);
    expect((await peekRateLimit(key, 2)).allowed).toBe(false);
    expect((await peekRateLimit(key, 3)).allowed).toBe(true);
  });
});

describe('recordRateLimitUse — spends one unit', () => {
  it('accumulates across calls', async () => {
    const key = freshKey();
    expect((await peekRateLimit(key, 2)).allowed).toBe(true);
    await recordRateLimitUse(key, WINDOW);
    expect((await peekRateLimit(key, 2)).allowed).toBe(true);
    await recordRateLimitUse(key, WINDOW);
    expect((await peekRateLimit(key, 2)).allowed).toBe(false);
  });

  it('starts a fresh window once the old one has passed', async () => {
    const key = freshKey();
    await recordRateLimitUse(key, 1); // 1ms window
    await new Promise((r) => setTimeout(r, 5));
    expect((await peekRateLimit(key, 1)).allowed).toBe(true);
  });
});
