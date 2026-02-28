/**
 * In-memory IP-based rate limiter for auth routes.
 * Specification: 10 requests per IP per minute → 429 SERVER_RATE_LIMITED
 *
 * NOTE: In-memory per serverless instance. Accurate in single-instance dev;
 * approximate (per-instance) in Vercel multi-instance production — this is
 * correct per spec which explicitly requires an in-memory implementation.
 */

import { NextRequest, NextResponse } from 'next/server';

interface IRateLimitRecord {
  count: number;
  resetAt: number; // Unix ms timestamp when window expires
}

const store = new Map<string, IRateLimitRecord>();

// Purge expired entries every 2 minutes to prevent unbounded memory growth.
// .unref() ensures the timer does not keep the Node.js process alive in tests.
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, record] of store.entries()) {
        if (now > record.resetAt + 60_000) {
          store.delete(key);
        }
      }
    },
    2 * 60 * 1000,
  ).unref();
}

/**
 * Extract the real client IP from request headers.
 * Vercel sets x-forwarded-for; local dev falls back to 127.0.0.1.
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? '127.0.0.1';
  return req.headers.get('x-real-ip') ?? '127.0.0.1';
}

/**
 * Apply rate limiting to a request.
 *
 * @param req   - Incoming NextRequest
 * @param limit - Max requests allowed per window (default: 10)
 * @param windowMs - Window duration in ms (default: 60 000 = 1 minute)
 * @returns NextResponse with 429 if limit exceeded, null if within limit
 */
export function applyRateLimit(
  req: NextRequest,
  limit = 10,
  windowMs = 60_000,
): NextResponse | null {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = store.get(ip);

  if (!record || now > record.resetAt) {
    // First request in window or window has expired — start fresh
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return null;
  }

  record.count += 1;

  if (record.count > limit) {
    const retryAfterSecs = Math.ceil((record.resetAt - now) / 1000);
    return NextResponse.json(
      {
        error: 'Too many requests. Please wait before trying again.',
        code: 'SERVER_RATE_LIMITED',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSecs) },
      },
    );
  }

  return null;
}

/** Exposed for unit testing only — resets the in-memory store. */
export function _resetStore(): void {
  store.clear();
}

/** Exposed for unit testing only — returns current count for an IP. */
export function _getCount(ip: string): number {
  return store.get(ip)?.count ?? 0;
}
