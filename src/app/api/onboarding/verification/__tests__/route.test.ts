/**
 * @jest-environment node
 *
 * Tests for POST /api/onboarding/verification (Stage 3: farmer/buyer/lecturer)
 * Covers: auth, stage guard, role routing, PENDING write, COMPLETED transition.
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
const CLOUDINARY = 'https://res.cloudinary.com/umojahub/doc.jpg';

function postReq(body: unknown) {
  return new NextRequest('http://localhost/api/onboarding/verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function userLean(value: unknown) {
  mockUserFindById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) });
}

const FARMER_BODY = { documentType: 'NATIONAL_ID', documentNumber: '12345678', documentImageUrl: CLOUDINARY };

describe('POST /api/onboarding/verification', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without a session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(postReq(FARMER_BODY));
    expect(res.status).toBe(401);
  });

  it('returns 409 when the stage is not VERIFICATION_UPLOAD', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: 'FARMER', onboardingStage: 'IDENTITY_INPUT' });
    const res = await POST(postReq(FARMER_BODY));
    expect(res.status).toBe(409);
  });

  it('returns 409 for a student (wrong role for this route)', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: 'STUDENT', onboardingStage: 'VERIFICATION_UPLOAD' });
    const res = await POST(postReq(FARMER_BODY));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('ONBOARDING_WRONG_ROLE');
  });

  it('returns 400 on an invalid farmer document', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: 'FARMER', onboardingStage: 'VERIFICATION_UPLOAD' });
    const res = await POST(postReq({ ...FARMER_BODY, documentImageUrl: 'https://evil.com/x.jpg' }));
    expect(res.status).toBe(400);
  });

  it('records the farmer document as PENDING and completes onboarding', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ role: 'FARMER', onboardingStage: 'VERIFICATION_UPLOAD' });
    const res = await POST(postReq(FARMER_BODY));
    expect(res.status).toBe(200);
    expect((await res.json()).data.onboardingStage).toBe('COMPLETED');
    const set = mockUserFindByIdAndUpdate.mock.calls[0][1].$set;
    expect(set['farmerData.verificationStatus']).toBe('PENDING');
    expect(set.onboardingStage).toBe('COMPLETED');
  });

  it('records the buyer certificate as PENDING', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', role: 'BUYER' } });
    userLean({ role: 'BUYER', onboardingStage: 'VERIFICATION_UPLOAD' });
    const res = await POST(postReq({ taxComplianceCertificate: CLOUDINARY }));
    expect(res.status).toBe(200);
    const set = mockUserFindByIdAndUpdate.mock.calls[0][1].$set;
    expect(set['buyerData.verificationStatus']).toBe('PENDING');
  });
});
