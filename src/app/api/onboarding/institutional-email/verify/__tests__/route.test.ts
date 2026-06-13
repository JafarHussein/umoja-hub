/**
 * @jest-environment node
 *
 * Tests for POST /api/onboarding/institutional-email/verify (student pin verify)
 * Covers: auth, pin format, role/stage guards, missing/expired/invalid pin, success.
 */

import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockRateLimit = jest.fn().mockResolvedValue({ allowed: true });
jest.mock('@/lib/rateLimit', () => ({ checkRateLimit: (...a: unknown[]) => mockRateLimit(...a) }));

const mockUserFindById = jest.fn();
const mockUserFindByIdAndUpdate = jest.fn().mockResolvedValue({});
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: (...a: unknown[]) => mockUserFindById(...a),
    findByIdAndUpdate: (...a: unknown[]) => mockUserFindByIdAndUpdate(...a),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

const SESSION = { user: { id: 'u1', role: 'STUDENT', firstName: 'Sam' } };
const PIN = '048213';
const PIN_HASH = bcrypt.hashSync(PIN, 10);

function postReq(pin: string) {
  return new NextRequest('http://localhost/api/onboarding/institutional-email/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
}

function userLean(value: unknown) {
  mockUserFindById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) });
}

const STUDENT_WITH_PIN = (overrides: Record<string, unknown> = {}) => ({
  role: 'STUDENT',
  onboardingStage: 'VERIFICATION_UPLOAD',
  studentData: {
    institutionalEmailPin: PIN_HASH,
    institutionalEmailPinExpiry: new Date(Date.now() + 10 * 60 * 1000),
    ...overrides,
  },
});

describe('POST /api/onboarding/institutional-email/verify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true });
  });

  it('returns 401 without a session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(postReq(PIN));
    expect(res.status).toBe(401);
  });

  it('returns 400 on a malformed pin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    const res = await POST(postReq('12'));
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    mockRateLimit.mockResolvedValue({ allowed: false });
    const res = await POST(postReq(PIN));
    expect(res.status).toBe(429);
  });

  it('returns 409 when no pin was issued', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: 'STUDENT', onboardingStage: 'VERIFICATION_UPLOAD', studentData: {} });
    const res = await POST(postReq(PIN));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('INSTITUTIONAL_PIN_MISSING');
  });

  it('returns 410 for an expired pin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean(STUDENT_WITH_PIN({ institutionalEmailPinExpiry: new Date(Date.now() - 1000) }));
    const res = await POST(postReq(PIN));
    expect(res.status).toBe(410);
  });

  it('returns 400 for an incorrect pin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean(STUDENT_WITH_PIN());
    const res = await POST(postReq('999999'));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('INSTITUTIONAL_PIN_INVALID');
  });

  it('verifies the pin and completes onboarding', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean(STUDENT_WITH_PIN());
    const res = await POST(postReq(PIN));
    expect(res.status).toBe(200);
    expect((await res.json()).data.onboardingStage).toBe('COMPLETED');
    const update = mockUserFindByIdAndUpdate.mock.calls[0][1];
    expect(update.$set['studentData.institutionalEmailVerified']).toBe(true);
    expect(update.$set.onboardingStage).toBe('COMPLETED');
    expect(update.$unset).toBeDefined();
  });
});
