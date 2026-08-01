import { Redis } from '@upstash/redis';
import { logger } from '@/lib/utils';

/**
 * Builds the Upstash client, or returns null when the caller should use its
 * in-memory fallback.
 *
 * Both callers (`cache.ts`, `rateLimit.ts`) already treat "no Redis" as a
 * supported mode — local dev runs that way, and every Redis error fails open.
 * A *malformed* URL was the one configuration that did not take that path:
 * `new Redis()` validates its URL and throws, and because both clients were
 * constructed at module scope, that throw happened while Next was collecting
 * page data. The result was a failed production build rather than a degraded
 * cache — `/api/admin/escrow` imports the rate limiter, so the whole deploy
 * died on it.
 *
 * Construction is therefore guarded, and a bad configuration is treated exactly
 * like a missing one: logged loudly, then fallen back on. Infrastructure that
 * the app is designed to run without must not be able to fail the build.
 */
export function createRedisClient(service: string): Redis | null {
  const url = process.env['UPSTASH_REDIS_REST_URL'];
  const token = process.env['UPSTASH_REDIS_REST_TOKEN'];
  if (!url || !token) return null;

  try {
    return new Redis({ url, token });
  } catch (err) {
    // Deliberately loud: the app keeps working, but a per-instance in-memory
    // fallback is not what production is meant to be running on. Rate limits
    // stop being global, so this needs to be visible rather than silent.
    logger.error(service, 'Invalid Upstash configuration — using in-memory fallback', { err });
    return null;
  }
}
