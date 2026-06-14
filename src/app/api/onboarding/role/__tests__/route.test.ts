/**
 * @jest-environment node
 *
 * Tests for POST /api/onboarding/role (Stage 1)
 * Covers: auth, stage guard, provider->role enforcement, githubUsername preserve.
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

const SESSION = { user: { id: 'u1', role: null, firstName: 'Sam' } };

function postReq(body: unknown) {
  return new NextRequest('http://localhost/api/onboarding/role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function userLean(value: unknown) {
  mockUserFindById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) });
}

describe('POST /api/onboarding/role', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without a session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(postReq({ role: 'FARMER' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for a non-selectable role (ADMIN)', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    const res = await POST(postReq({ role: 'ADMIN' }));
    expect(res.status).toBe(400);
  });

  it('returns 409 when the stage is not ROLE_SELECTION', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ onboardingStage: 'IDENTITY_INPUT', oauthProvider: 'google' });
    const res = await POST(postReq({ role: 'FARMER' }));
    expect(res.status).toBe(409);
  });

  it('rejects a GitHub user choosing a non-STUDENT role', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ onboardingStage: 'ROLE_SELECTION', oauthProvider: 'github' });
    const res = await POST(postReq({ role: 'FARMER' }));
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('PROVIDER_ROLE_MISMATCH');
  });

  it('rejects a Google user choosing STUDENT', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ onboardingStage: 'ROLE_SELECTION', oauthProvider: 'google' });
    const res = await POST(postReq({ role: 'STUDENT' }));
    expect(res.status).toBe(403);
  });

  it('sets a Google FARMER and advances to IDENTITY_INPUT', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ onboardingStage: 'ROLE_SELECTION', oauthProvider: 'google' });
    const res = await POST(postReq({ role: 'FARMER' }));
    expect(res.status).toBe(200);
    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ $set: expect.objectContaining({ role: 'FARMER', onboardingStage: 'IDENTITY_INPUT' }) })
    );
  });

  it('preserves the OAuth githubUsername for a GitHub STUDENT', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION);
    userLean({ onboardingStage: 'ROLE_SELECTION', oauthProvider: 'github', studentData: { githubUsername: 'octocat' } });
    const res = await POST(postReq({ role: 'STUDENT' }));
    expect(res.status).toBe(200);
    const updateArg = mockUserFindByIdAndUpdate.mock.calls[0][1].$set;
    expect(updateArg.studentData.githubUsername).toBe('octocat');
  });
});
