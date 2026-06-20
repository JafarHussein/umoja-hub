/**
 * @jest-environment node
 *
 * Tests for POST /api/auth/password-reset/request (AUTH_ONBOARDING_FLOW_V2 §10).
 * Covers: validation, rate limiting, anti-enumeration (identical response), and
 * token issue + email dispatch for a credentials-capable account.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockRateLimit = jest.fn().mockResolvedValue({ allowed: true });
jest.mock('@/lib/rateLimit', () => ({ checkRateLimit: (...a: unknown[]) => mockRateLimit(...a) }));

const mockSendReset = jest.fn().mockResolvedValue({ success: true });
jest.mock('@/lib/integrations/emailService', () => ({
  sendPasswordResetEmail: (...a: unknown[]) => mockSendReset(...a),
}));

jest.mock('@/lib/env', () => ({ env: () => 'http://localhost:3000' }));

const mockUserFindOne = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findOne: (...a: unknown[]) => mockUserFindOne(...a) },
}));

const mockTokenCreate = jest.fn().mockResolvedValue({});
jest.mock('@/lib/models/PasswordResetToken.model', () => ({
  __esModule: true,
  default: { create: (...a: unknown[]) => mockTokenCreate(...a) },
}));

import { POST } from '../route';

function postReq(body: unknown) {
  return new NextRequest('http://localhost/api/auth/password-reset/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function userLean(value: unknown) {
  mockUserFindOne.mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }),
  });
}

describe('POST /api/auth/password-reset/request', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true });
  });

  it('returns a generic 200 for a malformed email without touching the DB', async () => {
    const res = await POST(postReq({ email: 'nope' }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.sent).toBe(true);
    expect(mockUserFindOne).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValue({ allowed: false });
    const res = await POST(postReq({ email: 'jane@gmail.com' }));
    expect(res.status).toBe(429);
  });

  it('returns the generic 200 with no token for an unknown email (anti-enumeration)', async () => {
    userLean(null);
    const res = await POST(postReq({ email: 'ghost@gmail.com' }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.sent).toBe(true);
    expect(mockTokenCreate).not.toHaveBeenCalled();
    expect(mockSendReset).not.toHaveBeenCalled();
  });

  it('does not issue a token for an account without a password', async () => {
    userLean({ _id: 'u1', status: 'ACTIVE' });
    await POST(postReq({ email: 'oauthonly@gmail.com' }));
    expect(mockTokenCreate).not.toHaveBeenCalled();
    expect(mockSendReset).not.toHaveBeenCalled();
  });

  it('issues a token and emails the link for a credentials-capable active account', async () => {
    userLean({ _id: 'u1', status: 'ACTIVE', hashedPassword: 'hash' });
    const res = await POST(postReq({ email: 'jane@gmail.com' }));
    expect(res.status).toBe(200);
    expect(mockTokenCreate).toHaveBeenCalled();
    expect(mockSendReset).toHaveBeenCalledWith(
      'jane@gmail.com',
      expect.stringContaining('/auth/reset-password?token=')
    );
  });
});
