import { logger } from '@/lib/utils';
import { createRedisClient } from '@/lib/redisClient';

// ---------------------------------------------------------------------------
// In-memory fallback — used in local dev when Upstash env vars are not set,
// and as a safety net on Redis errors. Scoped to the function instance.
// ---------------------------------------------------------------------------

interface IRateLimitEntry {
  count: number;
  resetAt: number; // Unix ms
}

const memStore = new Map<string, IRateLimitEntry>();

function checkMemory(key: string, maxRequests: number, windowMs: number): { allowed: boolean } {
  const now = Date.now();
  const entry = memStore.get(key);

  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) return { allowed: false };

  entry.count++;
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Upstash Redis client — initialised once if env vars are present and valid.
// Falls back to in-memory when UPSTASH_REDIS_REST_URL / _TOKEN are not set
// (local dev), when they are malformed, or on Redis errors (fail-open).
// ---------------------------------------------------------------------------

const redis = createRedisClient('rateLimit');

/**
 * Check and increment the rate limit for a given key.
 * Returns { allowed: true } when under the limit, { allowed: false } when over.
 * Fails open (allows request) on Redis errors.
 *
 * Counts *attempts*. That is right for anything protecting a cost or a secret —
 * an AI call, a password reset, a pin check — where a failed try is exactly what
 * you want to count. It is wrong for a business cap like "five orders an hour",
 * which is a limit on outcomes; use `peekRateLimit` + `recordRateLimitUse` for
 * those, so a request that produced nothing does not spend the allowance.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean }> {
  if (!redis) {
    return checkMemory(key, maxRequests, windowMs);
  }

  try {
    const windowSec = Math.ceil(windowMs / 1000);
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSec);
    }
    return { allowed: count <= maxRequests };
  } catch (err) {
    logger.warn('rateLimit', 'Redis error — failing open', { key, err });
    return { allowed: true };
  }
}

/**
 * Is this key under its limit? Reads the counter without touching it.
 *
 * Pair with `recordRateLimitUse` when the thing being limited is an outcome
 * rather than a request. The two are not atomic together, so a burst of
 * simultaneous requests could let one extra through; for a per-user allowance
 * measured in single digits per hour that is a better trade than charging
 * someone for work the platform failed to do.
 */
export async function peekRateLimit(
  key: string,
  maxRequests: number
): Promise<{ allowed: boolean }> {
  if (!redis) {
    const entry = memStore.get(key);
    if (!entry || Date.now() > entry.resetAt) return { allowed: true };
    return { allowed: entry.count < maxRequests };
  }

  try {
    const raw = await redis.get<number | string | null>(key);
    const count = typeof raw === 'string' ? Number.parseInt(raw, 10) : (raw ?? 0);
    return { allowed: !Number.isFinite(count) || count < maxRequests };
  } catch (err) {
    logger.warn('rateLimit', 'Redis error — failing open', { key, err });
    return { allowed: true };
  }
}

/** Spend one unit of a key's allowance. Never throws; a lost count fails open. */
export async function recordRateLimitUse(key: string, windowMs: number): Promise<void> {
  if (!redis) {
    const now = Date.now();
    const entry = memStore.get(key);
    if (!entry || now > entry.resetAt) {
      memStore.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count++;
    }
    return;
  }

  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, Math.ceil(windowMs / 1000));
  } catch (err) {
    logger.warn('rateLimit', 'Redis error — use not recorded', { key, err });
  }
}
