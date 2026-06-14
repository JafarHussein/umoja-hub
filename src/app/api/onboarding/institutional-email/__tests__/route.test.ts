/**
 * @jest-environment node
 *
 * Tests for POST /api/onboarding/institutional-email (student pin issue)
 * Covers: auth, email/domain validation, rate limit, role/stage guards, dispatch.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockRateLimit = jest.fn().mockResolvedValue({ allowed: true });
jest.mock('@/lib/rateLimit', () => ({ checkRateLimit: (...a: unknown[]) => mockRateLimit(...a) }));

const mockSendPin = jest.fn().mockResolvedValue({ success: true });
jest.mock('@/lib/integrations/emailService', () => ({
  sendInstitutionalEmailPin: (...a: unknown[]) => mockSendPin(...a),
}));

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
const UNI_EMAIL = 'jane@uonbi.ac.ke';

function postReq(institutionalEmail: string) {
  return new NextRequest('http://localhost/api/onboarding/institutional-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ institutionalEmail }),
  });
}

function userLean(value: unknown) {
  mockUserFindById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) });
}

describe('POST /api/onboarding/institutional-email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true });
  });

  it('returns 401 without a session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(postReq(UNI_EMAIL));
    expect(res.status).toBe(401);
  });

  it('returns 400 on a malformed email', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    const res = await POST(postReq('not-an-email'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for a non-university domain', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    const res = await POST(postReq('jane@gmail.com'));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('INSTITUTIONAL_EMAIL_DOMAIN');
  });

  it('returns 429 when rate limited', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    mockRateLimit.mockResolvedValue({ allowed: false });
    const res = await POST(postReq(UNI_EMAIL));
    expect(res.status).toBe(429);
  });

  it('returns 409 for a non-student', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: 'FARMER', onboardingStage: 'VERIFICATION_UPLOAD' });
    const res = await POST(postReq(UNI_EMAIL));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('ONBOARDING_WRONG_ROLE');
  });

  it('returns 409 at the wrong stage', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: 'STUDENT', onboardingStage: 'IDENTITY_INPUT' });
    const res = await POST(postReq(UNI_EMAIL));
    expect(res.status).toBe(409);
  });

  it('issues a pin and dispatches the email', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: 'STUDENT', onboardingStage: 'VERIFICATION_UPLOAD' });
    const res = await POST(postReq(UNI_EMAIL));
    expect(res.status).toBe(200);
    expect((await res.json()).data.sent).toBe(true);
    expect(mockUserFindByIdAndUpdate).toHaveBeenCalled();
    expect(mockSendPin).toHaveBeenCalledWith(UNI_EMAIL, expect.stringMatching(/^\d{6}$/));
  });
});
