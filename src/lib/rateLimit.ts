import { Redis } from '@upstash/redis';
import { logger } from '@/lib/utils';

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
// Upstash Redis client — initialised once if env vars are present.
// Falls back to in-memory when UPSTASH_REDIS_REST_URL / _TOKEN are not set
// (local dev) or on Redis errors (fail-open).
// ---------------------------------------------------------------------------

const redis =
  process.env['UPSTASH_REDIS_REST_URL'] && process.env['UPSTASH_REDIS_REST_TOKEN']
    ? new Redis({
        url: process.env['UPSTASH_REDIS_REST_URL'],
        token: process.env['UPSTASH_REDIS_REST_TOKEN'],
      })
    : null;

/**
 * Check and increment the rate limit for a given key.
 * Returns { allowed: true } when under the limit, { allowed: false } when over.
 * Fails open (allows request) on Redis errors.
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
