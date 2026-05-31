/**
 * In-memory rate limiter. Scoped to the serverless function instance — each
 * cold-start begins with a fresh counter. This is sufficient for brute-force
 * protection at MVP scale; replace with a distributed store (Redis / Upstash)
 * before multi-region deployment.
 */

interface IRateLimitEntry {
  count: number;
  resetAt: number; // Unix ms
}

const store = new Map<string, IRateLimitEntry>();

/**
 * Check and increment the rate limit for a given key.
 * Returns { allowed: true } when under the limit, { allowed: false } when over.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false };
  }

  entry.count++;
  return { allowed: true };
}
