/**
 * @jest-environment node
 *
 * Tests for PATCH /api/admin/verify-buyer
 * Covers: admin guard, rejection-reason rule, pending requirement, approve/reject.
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

const mockAuditCreate = jest.fn().mockResolvedValue({});
jest.mock('@/lib/models/AdminAuditLog.model', () => ({
  __esModule: true,
  default: { create: (...a: unknown[]) => mockAuditCreate(...a) },
}));

const mockSendSMS = jest.fn().mockResolvedValue({ success: true });
jest.mock('@/lib/integrations/smsService', () => ({ sendSMS: (...a: unknown[]) => mockSendSMS(...a) }));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { PATCH } from '../route';

const ADMIN_SESSION = { user: { id: 'admin-1', role: 'ADMIN', firstName: 'Admin' } };
const BUYER_SESSION = { user: { id: 'b1', role: 'BUYER', firstName: 'Bea' } };
const BUYER_ID = '507f1f77bcf86cd799439011';

function patchReq(body: unknown) {
  return new NextRequest('http://localhost/api/admin/verify-buyer', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/admin/verify-buyer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-admin with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await PATCH(patchReq({ buyerId: BUYER_ID, decision: 'APPROVED' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when rejecting without a reason', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    const res = await PATCH(patchReq({ buyerId: BUYER_ID, decision: 'REJECTED' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when the buyer is missing or not a buyer', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockUserFindById.mockResolvedValue(null);
    const res = await PATCH(patchReq({ buyerId: BUYER_ID, decision: 'APPROVED' }));
    expect(res.status).toBe(404);
  });

  it('returns 409 when the buyer has no pending verification', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockUserFindById.mockResolvedValue({ role: 'BUYER', firstName: 'Bea', phoneNumber: '0700', buyerData: { verificationStatus: 'APPROVED' } });
    const res = await PATCH(patchReq({ buyerId: BUYER_ID, decision: 'APPROVED' }));
    expect(res.status).toBe(409);
  });

  it('approves a pending buyer and fires audit + SMS', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockUserFindById.mockResolvedValue({ role: 'BUYER', firstName: 'Bea', phoneNumber: '0700', buyerData: { verificationStatus: 'PENDING' } });
    const res = await PATCH(patchReq({ buyerId: BUYER_ID, decision: 'APPROVED' }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.verificationStatus).toBe('APPROVED');
    expect(mockAuditCreate).toHaveBeenCalledWith(expect.objectContaining({ action: 'BUYER_APPROVED' }));
    expect(mockSendSMS).toHaveBeenCalled();
  });
});
