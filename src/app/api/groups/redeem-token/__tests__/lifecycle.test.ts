/**
 * @jest-environment node
 *
 * QA-02 state-machine test — group join token single-use + expiry.
 * Redeems a token once (success) then again (blocked); plus an expired token.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const token: { _id: string; token: string; groupId: string; redeemedBy: string | null; expiresAt: Date } = {
  _id: 'tok-1',
  token: 'ABCD2345',
  groupId: '507f1f77bcf86cd799439012',
  redeemedBy: null,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
};

jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: () => ({ select: () => ({ lean: () => Promise.resolve({ farmerData: { isVerified: true } }) }) }) },
}));

const findOneAndUpdateMock = jest.fn(() => ({
  lean: () => {
    if (token.redeemedBy === null) {
      token.redeemedBy = FARMER_ID;
      return Promise.resolve({ ...token });
    }
    return Promise.resolve(null);
  },
}));
jest.mock('@/lib/models/GroupJoinToken.model', () => ({
  __esModule: true,
  default: {
    findOne: () => ({ lean: () => Promise.resolve({ ...token }) }),
    findOneAndUpdate: (...a: unknown[]) => findOneAndUpdateMock(...(a as [])),
  },
}));

jest.mock('@/lib/models/FarmerGroup.model', () => ({
  __esModule: true,
  default: {
    findById: () => ({ lean: () => Promise.resolve({ status: 'ACTIVE', members: ['other'], memberCount: 1 }) }),
    findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439012', memberCount: 2 }),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

const FARMER_ID = '507f1f77bcf86cd799439011';
const FARMER_SESSION = { user: { id: FARMER_ID, role: 'FARMER', firstName: 'Kamau' } };

function redeem() {
  return POST(
    new NextRequest('http://localhost/api/groups/redeem-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'ABCD2345' }),
    })
  );
}

describe('group join token single-use lifecycle', () => {
  beforeEach(() => {
    token.redeemedBy = null;
    token.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
  });

  it('allows the first redemption then blocks the second', async () => {
    const first = await redeem();
    expect(first.status).toBe(200);
    expect(token.redeemedBy).toBe(FARMER_ID);

    const second = await redeem();
    expect(second.status).toBe(409);
    expect((await second.json()).code).toBe('TOKEN_ALREADY_REDEEMED');
  });

  it('rejects an expired token before any claim', async () => {
    token.expiresAt = new Date(Date.now() - 1000);
    const res = await redeem();
    expect(res.status).toBe(410);
    expect(token.redeemedBy).toBeNull();
  });
});
