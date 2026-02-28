/**
 * @jest-environment node
 *
 * Rate limiting tests for POST /api/auth/register
 * Spec: 10 requests per IP per minute → 429 SERVER_RATE_LIMITED on the 11th
 */

import { NextRequest } from 'next/server';
import { _resetStore, applyRateLimit } from '@/lib/rateLimit';

// ---------------------------------------------------------------------------
// Unit tests for the rate limiter module itself
// ---------------------------------------------------------------------------

describe('applyRateLimit — unit tests', () => {
  const makeReq = (ip = '192.168.1.1') =>
    new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'x-forwarded-for': ip },
    });

  beforeEach(() => {
    _resetStore();
  });

  it('allows the first 10 requests from the same IP', () => {
    for (let i = 0; i < 10; i++) {
      const result = applyRateLimit(makeReq());
      expect(result).toBeNull();
    }
  });

  it('blocks the 11th request with 429 SERVER_RATE_LIMITED', () => {
    for (let i = 0; i < 10; i++) {
      applyRateLimit(makeReq());
    }
    const result = applyRateLimit(makeReq());
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });

  it('returns SERVER_RATE_LIMITED error code on 11th request', async () => {
    for (let i = 0; i < 10; i++) {
      applyRateLimit(makeReq());
    }
    const result = applyRateLimit(makeReq());
    const json = await result!.json() as { code: string };
    expect(json.code).toBe('SERVER_RATE_LIMITED');
  });

  it('sets Retry-After header on rate-limited response', () => {
    for (let i = 0; i < 11; i++) {
      applyRateLimit(makeReq());
    }
    const result = applyRateLimit(makeReq());
    expect(result!.headers.get('Retry-After')).not.toBeNull();
    const retryAfter = Number(result!.headers.get('Retry-After'));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it('tracks different IPs independently', () => {
    // Fill up IP A to 10 requests
    for (let i = 0; i < 10; i++) {
      applyRateLimit(makeReq('10.0.0.1'));
    }
    // IP B should still have a clean slate
    const resultB = applyRateLimit(makeReq('10.0.0.2'));
    expect(resultB).toBeNull();

    // IP A should be blocked
    const resultA = applyRateLimit(makeReq('10.0.0.1'));
    expect(resultA).not.toBeNull();
    expect(resultA!.status).toBe(429);
  });

  it('respects custom limit parameter', () => {
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      applyRateLimit(makeReq('172.16.0.1'), limit);
    }
    const result = applyRateLimit(makeReq('172.16.0.1'), limit);
    expect(result!.status).toBe(429);
  });

  it('resets counter after window expires', () => {
    // Use a very short window (1ms) to simulate expiry
    applyRateLimit(makeReq('10.0.1.1'), 1, 1); // limit=1, window=1ms
    applyRateLimit(makeReq('10.0.1.1'), 1, 1); // this exceeds limit

    // Wait for window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const result = applyRateLimit(makeReq('10.0.1.1'), 1, 1);
        // After window expired, should be allowed again (new window)
        expect(result).toBeNull();
        resolve();
      }, 10);
    });
  });
});

// ---------------------------------------------------------------------------
// Integration: rate limiter applied to the register route
// ---------------------------------------------------------------------------

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findOne: jest.fn().mockResolvedValue(null), create: jest.fn() },
}));

describe('POST /api/auth/register — rate limit integration', () => {
  jest.setTimeout(15_000);

  let POST: (req: NextRequest) => Promise<Response>;

  const makeRegisterReq = (ip = '203.0.113.1') =>
    new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify({
        email: 'farmer@gmail.com',
        password: 'Secure@2024!',
        firstName: 'Wanjiku',
        lastName: 'Kamau',
        phoneNumber: '+254712345678',
        role: 'FARMER',
        county: 'Kiambu',
      }),
    });

  beforeAll(async () => {
    ({ POST } = await import('../route'));
  });

  beforeEach(() => {
    _resetStore();
  });

  it('returns 429 on the 11th request from the same IP', async () => {
    // First 10: should not be rate-limited (may fail for other reasons, but not 429)
    for (let i = 0; i < 10; i++) {
      const res = await POST(makeRegisterReq('203.0.113.99'));
      expect(res.status).not.toBe(429);
    }

    // 11th: must be rate-limited
    const res = await POST(makeRegisterReq('203.0.113.99'));
    expect(res.status).toBe(429);
    const json = (await res.json()) as { code: string };
    expect(json.code).toBe('SERVER_RATE_LIMITED');
  });
});
