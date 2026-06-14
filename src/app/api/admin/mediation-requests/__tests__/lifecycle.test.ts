/**
 * @jest-environment node
 *
 * QA-02 state-machine test — mediation lifecycle.
 * Drives OPEN -> IN_REVIEW -> RESOLVED against an evolving status and asserts
 * the $in-guarded transitions reject moves out of a terminal state.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const state = { status: 'OPEN' };

const findOneAndUpdateMock = jest.fn((filter: { status: { $in: string[] } }, update: { $set: { status: string } }) => ({
  lean: () => {
    if (filter.status.$in.includes(state.status)) {
      state.status = update.$set.status;
      return Promise.resolve({ _id: MR_ID, status: state.status });
    }
    return Promise.resolve(null);
  },
}));
const findByIdMock = jest.fn(() => ({ select: () => ({ lean: () => Promise.resolve({ status: state.status }) }) }));

jest.mock('@/lib/models/MediationRequest.model', () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: (...a: unknown[]) => findOneAndUpdateMock(...(a as [{ status: { $in: string[] } }, { $set: { status: string } }])),
    findById: (...a: unknown[]) => findByIdMock(...(a as [])),
  },
}));

jest.mock('@/lib/models/AdminAuditLog.model', () => ({ __esModule: true, default: { create: jest.fn().mockResolvedValue({}) } }));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { PATCH } from '../route';

const MR_ID = '507f1f77bcf86cd799439011';
const ADMIN_SESSION = { user: { id: 'admin-1', role: 'ADMIN', firstName: 'Admin' } };

function move(status: string, resolutionNote?: string) {
  return PATCH(
    new NextRequest('http://localhost/api/admin/mediation-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: MR_ID, status, ...(resolutionNote ? { resolutionNote } : {}) }),
    })
  );
}

describe('mediation request lifecycle', () => {
  beforeEach(() => {
    state.status = 'OPEN';
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
  });

  it('runs OPEN -> IN_REVIEW -> RESOLVED', async () => {
    expect((await move('IN_REVIEW')).status).toBe(200);
    expect(state.status).toBe('IN_REVIEW');
    expect((await move('RESOLVED', 'Refund issued off-platform.')).status).toBe(200);
    expect(state.status).toBe('RESOLVED');
  });

  it('resolves directly from OPEN', async () => {
    expect((await move('RESOLVED', 'Closed after buyer confirmation.')).status).toBe(200);
    expect(state.status).toBe('RESOLVED');
  });

  it('rejects moving a RESOLVED request back to IN_REVIEW', async () => {
    await move('RESOLVED', 'Done.');
    const res = await move('IN_REVIEW');
    expect(res.status).toBe(409);
  });
});
