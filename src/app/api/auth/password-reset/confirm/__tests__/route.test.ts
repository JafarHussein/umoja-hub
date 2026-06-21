/**
 * @jest-environment node
 *
 * Tests for POST /api/auth/password-reset/confirm (AUTH_ONBOARDING_FLOW_V2 §10).
 * Covers: validation, rate limiting, atomic single-use token claim, invalid /
 * expired token rejection, and password update + lockout clear on success.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockRateLimit = jest.fn().mockResolvedValue({ allowed: true });
jest.mock('@/lib/rateLimit', () => ({ checkRateLimit: (...a: unknown[]) => mockRateLimit(...a) }));

const mockTokenFindOneAndUpdate = jest.fn();
jest.mock('@/lib/models/PasswordResetToken.model', () => ({
  __esModule: true,
  default: { findOneAndUpdate: (...a: unknown[]) => mockTokenFindOneAndUpdate(...a) },
}));

const mockUserFindByIdAndUpdate = jest.fn().mockResolvedValue({});
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findByIdAndUpdate: (...a: unknown[]) => mockUserFindByIdAndUpdate(...a) },
}));

import { POST } from '../route';

function postReq(body: unknown) {
  return new NextRequest('http://localhost/api/auth/password-reset/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/password-reset/confirm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true });
    mockUserFindByIdAndUpdate.mockResolvedValue({});
  });

  it('returns 400 on a weak new password', async () => {
    const res = await POST(postReq({ token: 'abc', password: 'short' }));
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValue({ allowed: false });
    const res = await POST(postReq({ token: 'abc', password: 'Renewed2024' }));
    expect(res.status).toBe(429);
  });

  it('returns 400 RESET_TOKEN_INVALID for an invalid or expired token', async () => {
    mockTokenFindOneAndUpdate.mockResolvedValue(null);
    const res = await POST(postReq({ token: 'expired', password: 'Renewed2024' }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('RESET_TOKEN_INVALID');
    expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('updates the password and clears lockout on a valid token', async () => {
    mockTokenFindOneAndUpdate.mockResolvedValue({ userId: 'u1' });
    const res = await POST(postReq({ token: 'valid', password: 'Renewed2024' }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.reset).toBe(true);
    const update = mockUserFindByIdAndUpdate.mock.calls[0]?.[1] as { $set: Record<string, unknown> };
    expect(update.$set).toMatchObject({ failedLoginAttempts: 0, lockedUntil: null });
    expect(update.$set.hashedPassword).toEqual(expect.any(String));
  });
});
