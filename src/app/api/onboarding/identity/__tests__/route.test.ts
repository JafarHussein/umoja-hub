/**
 * @jest-environment node
 *
 * Tests for POST /api/onboarding/identity (Stage 2)
 * Covers: auth, stage guard, no-role guard, role-conditional validation, write.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

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

const SESSION = { user: { id: 'u1', role: 'FARMER', firstName: 'Sam' } };
const BASE = { lastName: 'Otieno', phoneNumber: '0712345678', county: 'Kisumu' };

function postReq(body: unknown) {
  return new NextRequest('http://localhost/api/onboarding/identity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function userLean(value: unknown) {
  mockUserFindById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) });
}

describe('POST /api/onboarding/identity', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without a session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(postReq(BASE));
    expect(res.status).toBe(401);
  });

  it('returns 409 when the stage is not IDENTITY_INPUT', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: 'FARMER', onboardingStage: 'ROLE_SELECTION' });
    const res = await POST(postReq(BASE));
    expect(res.status).toBe(409);
  });

  it('returns 409 when no role is set yet', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: null, onboardingStage: 'IDENTITY_INPUT' });
    const res = await POST(postReq(BASE));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('ONBOARDING_NO_ROLE');
  });

  it('returns 400 when a buyer omits the organisation name', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: 'BUYER', onboardingStage: 'IDENTITY_INPUT' });
    const res = await POST(postReq(BASE));
    expect(res.status).toBe(400);
  });

  it('writes farmer identity and advances to VERIFICATION_UPLOAD', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: 'FARMER', onboardingStage: 'IDENTITY_INPUT' });
    const res = await POST(postReq({ ...BASE, primaryLanguage: 'Kiswahili' }));
    expect(res.status).toBe(200);
    const set = mockUserFindByIdAndUpdate.mock.calls[0][1].$set;
    expect(set).toMatchObject({ lastName: 'Otieno', county: 'Kisumu', onboardingStage: 'VERIFICATION_UPLOAD' });
    expect(set['farmerData.primaryLanguage']).toBe('Kiswahili');
  });

  it('maps business buyer sub-document fields', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: 'BUYER', onboardingStage: 'IDENTITY_INPUT' });
    const res = await POST(
      postReq({
        ...BASE,
        buyerType: 'BUSINESS',
        organizationName: 'Mavuno Foods Ltd',
        businessRegistrationNumber: 'PVT-9',
      })
    );
    expect(res.status).toBe(200);
    const set = mockUserFindByIdAndUpdate.mock.calls[0][1].$set;
    expect(set['buyerData.buyerType']).toBe('BUSINESS');
    expect(set['buyerData.organizationName']).toBe('Mavuno Foods Ltd');
  });

  it('writes no business fields for an individual buyer', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: 'BUYER', onboardingStage: 'IDENTITY_INPUT' });
    const res = await POST(postReq({ ...BASE, buyerType: 'INDIVIDUAL' }));
    expect(res.status).toBe(200);
    const set = mockUserFindByIdAndUpdate.mock.calls[0][1].$set;
    expect(set['buyerData.buyerType']).toBe('INDIVIDUAL');
    // The fields an individual was never asked about must not be written at
    // all — this is where "NOT APPLICABLE" used to land.
    expect(set).not.toHaveProperty('buyerData.organizationName');
    expect(set).not.toHaveProperty('buyerData.businessRegistrationNumber');
  });

  it('rejects a placeholder organisation name', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: 'BUYER', onboardingStage: 'IDENTITY_INPUT' });
    const res = await POST(
      postReq({
        ...BASE,
        buyerType: 'BUSINESS',
        organizationName: 'NOT APPLICABLE',
        businessRegistrationNumber: 'NOT APPLICABLE',
      })
    );
    expect(res.status).toBe(400);
  });
});
