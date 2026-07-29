// ---------------------------------------------------------------------------
// Small read-through cache for expensive, idempotent reads.
//
// Mirrors the discipline already established in src/lib/rateLimit.ts: one
// Upstash client when the env vars are present, an instance-scoped in-memory
// map otherwise (local dev), and FAIL-OPEN on every Redis error — a cache
// problem must never turn into a request failure.
//
// Written for the Price Intelligence recommendation path, where each debounced
// keystroke in the listing form previously ran five queries including a
// PriceHistory read capped at 3,000 rows. The inputs (crop, county, unit,
// quantity) change slowly and the output tolerates being a few minutes stale,
// so a short TTL removes almost all of that load.
// ---------------------------------------------------------------------------

import { Redis } from '@upstash/redis';
import { logger } from '@/lib/utils';

interface MemoryEntry {
  value: unknown;
  expiresAt: number;
}

const memStore = new Map<string, MemoryEntry>();

/** Bounded so a long-lived instance cannot grow the map without limit. */
const MAX_MEMORY_ENTRIES = 500;

function readMemory<T>(key: string): T | null {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memStore.delete(key);
    return null;
  }
  return entry.value as T;
}

function writeMemory(key: string, value: unknown, ttlSeconds: number): void {
  if (memStore.size >= MAX_MEMORY_ENTRIES) {
    // Evict the oldest insertion; Map preserves insertion order.
    const oldest = memStore.keys().next();
    if (!oldest.done) memStore.delete(oldest.value);
  }
  memStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

const redis =
  process.env['UPSTASH_REDIS_REST_URL'] && process.env['UPSTASH_REDIS_REST_TOKEN']
    ? new Redis({
        url: process.env['UPSTASH_REDIS_REST_URL'],
        token: process.env['UPSTASH_REDIS_REST_TOKEN'],
      })
    : null;

export interface CacheOptions<T> {
  /**
   * Decides whether a freshly computed value is worth storing. Use it to keep
   * degraded results out of the cache — an empty answer produced during a
   * database outage should not be pinned for the whole TTL. Defaults to
   * caching everything.
   */
  shouldCache?: (value: T) => boolean;
}

/**
 * Returns the cached value for `key`, or computes it with `compute`, stores it
 * for `ttlSeconds` and returns that.
 *
 * `compute` is always awaited on a miss and its errors propagate to the caller —
 * only cache failures are swallowed. A rejected `compute` is never cached.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
  options: CacheOptions<T> = {}
): Promise<T> {
  const storable = (value: T): boolean => options.shouldCache?.(value) !== false;

  if (!redis) {
    const hit = readMemory<T>(key);
    if (hit !== null) return hit;
    const value = await compute();
    if (storable(value)) writeMemory(key, value, ttlSeconds);
    return value;
  }

  try {
    const hit = await redis.get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
  } catch (err) {
    logger.warn('cache', 'Redis read failed — recomputing', { key, err });
  }

  const value = await compute();

  if (storable(value)) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
    } catch (err) {
      logger.warn('cache', 'Redis write failed — value still returned', { key, err });
    }
  }

  return value;
}

/**
 * Builds a stable cache key. Parts are lowercased and trimmed so that "Kiambu"
 * and " kiambu " share an entry; null and undefined collapse to an empty
 * segment so key shape stays constant.
 */
export function cacheKey(namespace: string, ...parts: (string | number | null | undefined)[]): string {
  const normalized = parts.map((part) =>
    part === null || part === undefined ? '' : String(part).trim().toLowerCase()
  );
  return [namespace, ...normalized].join(':');
}
