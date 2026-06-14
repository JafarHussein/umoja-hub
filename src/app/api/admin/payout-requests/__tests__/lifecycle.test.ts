/**
 * @jest-environment node
 *
 * QA-02 state-machine test — payout request lifecycle.
 * Drives a single request through REQUESTED -> APPROVED -> PAID against an
 * evolving status and asserts the status-guarded transitions reject skips/repeats.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const state = { status: 'REQUESTED' };

const findOneAndUpdateMock = jest.fn((filter: { status: string }, update: { $set: { status: string } }) => ({
  lean: () => {
    if (filter.status === state.status) {
      state.status = update.$set.status;
      return Promise.resolve({ _id: WR_ID, farmerId: 'f1', amountKES: 1000, status: state.status });
    }
    return Promise.resolve(null);
  },
}));
const findByIdMock = jest.fn(() => ({ select: () => ({ lean: () => Promise.resolve({ status: state.status }) }) }));

jest.mock('@/lib/models/WithdrawalRequest.model', () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: (...a: unknown[]) => findOneAndUpdateMock(...(a as [{ status: string }, { $set: { status: string } }])),
    findById: (...a: unknown[]) => findByIdMock(...(a as [])),
  },
}));

jest.mock('@/lib/models/AdminAuditLog.model', () => ({ __esModule: true, default: { create: jest.fn().mockResolvedValue({}) } }));
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: () => ({ select: () => ({ lean: () => Promise.resolve(null) }) }) },
}));
jest.mock('@/lib/integrations/smsService', () => ({ sendSMS: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { PATCH } from '../route';

const WR_ID = '507f1f77bcf86cd799439011';
const ADMIN_SESSION = { user: { id: 'admin-1', role: 'ADMIN', firstName: 'Admin' } };

function decide(decision: string, note?: string) {
  return PATCH(
    new NextRequest('http://localhost/api/admin/payout-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: WR_ID, decision, ...(note ? { note } : {}) }),
    })
  );
}

describe('payout request lifecycle', () => {
  beforeEach(() => {
    state.status = 'REQUESTED';
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
  });

  it('runs REQUESTED -> APPROVED -> PAID', async () => {
    expect((await decide('APPROVED')).status).toBe(200);
    expect(state.status).toBe('APPROVED');
    expect((await decide('PAID', 'MPESA-REF-1')).status).toBe(200);
    expect(state.status).toBe('PAID');
  });

  it('rejects PAID directly from REQUESTED (must be APPROVED first)', async () => {
    const res = await decide('PAID', 'MPESA-REF-1');
    expect(res.status).toBe(409);
    expect(state.status).toBe('REQUESTED');
  });

  it('rejects re-approving an already-PAID request', async () => {
    await decide('APPROVED');
    await decide('PAID', 'MPESA-REF-1');
    const res = await decide('APPROVED');
    expect(res.status).toBe(409);
  });
});
