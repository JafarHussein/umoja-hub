/**
 * @jest-environment node
 *
 * Tests for POST /api/groups/redeem-token
 * Covers: farmer guard, FIX-06 verified gate, token states (missing/redeemed/
 * expired), membership rules, atomic single-use claim + roster write.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: (...a: unknown[]) => mockUserFindById(...a) },
}));

const mockTokenFindOne = jest.fn();
const mockTokenFindOneAndUpdate = jest.fn();
jest.mock('@/lib/models/GroupJoinToken.model', () => ({
  __esModule: true,
  default: {
    findOne: (...a: unknown[]) => mockTokenFindOne(...a),
    findOneAndUpdate: (...a: unknown[]) => mockTokenFindOneAndUpdate(...a),
  },
}));

const mockGroupFindById = jest.fn();
const mockGroupFindByIdAndUpdate = jest.fn();
jest.mock('@/lib/models/FarmerGroup.model', () => ({
  __esModule: true,
  default: {
    findById: (...a: unknown[]) => mockGroupFindById(...a),
    findByIdAndUpdate: (...a: unknown[]) => mockGroupFindByIdAndUpdate(...a),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

const FARMER_ID = '507f1f77bcf86cd799439011';
const GROUP_ID = '507f1f77bcf86cd799439012';
const FARMER_SESSION = { user: { id: FARMER_ID, role: 'FARMER', firstName: 'Kamau' } };
const BUYER_SESSION = { user: { id: 'b1', role: 'BUYER', firstName: 'Bea' } };

function postReq(token = 'ABCD2345') {
  return new NextRequest('http://localhost/api/groups/redeem-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}

function userVerified(isVerified: boolean) {
  mockUserFindById.mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ farmerData: { isVerified } }) }),
  });
}

function tokenDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'tok-1',
    token: 'ABCD2345',
    groupId: GROUP_ID,
    redeemedBy: null,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    ...overrides,
  };
}

describe('POST /api/groups/redeem-token', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-farmer with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await POST(postReq());
    expect(res.status).toBe(403);
  });

  it('rejects an unverified farmer with 403 FARMER_NOT_VERIFIED', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    userVerified(false);
    const res = await POST(postReq());
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('FARMER_NOT_VERIFIED');
  });

  it('returns 404 for an unknown token', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    userVerified(true);
    mockTokenFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const res = await POST(postReq());
    expect(res.status).toBe(404);
  });

  it('returns 409 for an already-redeemed token', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    userVerified(true);
    mockTokenFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(tokenDoc({ redeemedBy: 'someone' })) });
    const res = await POST(postReq());
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('TOKEN_ALREADY_REDEEMED');
  });

  it('returns 410 for an expired token', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    userVerified(true);
    mockTokenFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(tokenDoc({ expiresAt: new Date(Date.now() - 1000) })) });
    const res = await POST(postReq());
    expect(res.status).toBe(410);
    expect((await res.json()).code).toBe('TOKEN_EXPIRED');
  });

  it('returns 409 when the farmer is already a member', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    userVerified(true);
    mockTokenFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(tokenDoc()) });
    mockGroupFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ status: 'ACTIVE', members: [FARMER_ID], memberCount: 1 }) });
    const res = await POST(postReq());
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('ALREADY_MEMBER');
    expect(mockTokenFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('redeems the token and writes the roster on the happy path', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    userVerified(true);
    mockTokenFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(tokenDoc()) });
    mockGroupFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ status: 'ACTIVE', members: ['other'], memberCount: 1 }) });
    mockTokenFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'tok-1', redeemedBy: FARMER_ID }) });
    mockGroupFindByIdAndUpdate.mockResolvedValue({ _id: GROUP_ID, memberCount: 2 });

    const res = await POST(postReq());

    expect(res.status).toBe(200);
    expect(mockTokenFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'tok-1', redeemedBy: null }),
      expect.anything(),
      { new: true }
    );
    expect(mockGroupFindByIdAndUpdate).toHaveBeenCalledWith(
      GROUP_ID,
      expect.objectContaining({ $addToSet: expect.anything(), $inc: { memberCount: 1 } }),
      { new: true }
    );
  });

  it('returns 409 when the atomic claim loses the race', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    userVerified(true);
    mockTokenFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(tokenDoc()) });
    mockGroupFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ status: 'ACTIVE', members: ['other'], memberCount: 1 }) });
    mockTokenFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await POST(postReq());

    expect(res.status).toBe(409);
    expect(mockGroupFindByIdAndUpdate).not.toHaveBeenCalled();
  });
});
