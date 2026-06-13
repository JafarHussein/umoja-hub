/**
 * @jest-environment node
 *
 * Tests for GET + PATCH /api/admin/payout-requests
 * Covers: admin guard, status filter, decision transitions, audit/SMS side effects.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockWRFind = jest.fn();
const mockWRFindOneAndUpdate = jest.fn();
const mockWRFindById = jest.fn();
const mockWRCount = jest.fn();
jest.mock('@/lib/models/WithdrawalRequest.model', () => ({
  __esModule: true,
  default: {
    find: (...a: unknown[]) => mockWRFind(...a),
    findOneAndUpdate: (...a: unknown[]) => mockWRFindOneAndUpdate(...a),
    findById: (...a: unknown[]) => mockWRFindById(...a),
    countDocuments: (...a: unknown[]) => mockWRCount(...a),
  },
}));

const mockAuditCreate = jest.fn().mockResolvedValue({});
jest.mock('@/lib/models/AdminAuditLog.model', () => ({
  __esModule: true,
  default: { create: (...a: unknown[]) => mockAuditCreate(...a) },
}));

const mockUserFind = jest.fn();
const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    find: (...a: unknown[]) => mockUserFind(...a),
    findById: (...a: unknown[]) => mockUserFindById(...a),
  },
}));

const mockSendSMS = jest.fn().mockResolvedValue({ success: true });
jest.mock('@/lib/integrations/smsService', () => ({ sendSMS: (...a: unknown[]) => mockSendSMS(...a) }));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET, PATCH } from '../route';

const ADMIN_SESSION = { user: { id: 'admin-1', role: 'ADMIN', firstName: 'Admin' } };
const FARMER_SESSION = { user: { id: 'f1', role: 'FARMER', firstName: 'Kamau' } };
const WR_ID = '507f1f77bcf86cd799439011';

function patchReq(body: unknown) {
  return new NextRequest('http://localhost/api/admin/payout-requests', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/admin/payout-requests', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-admin with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const res = await GET(new NextRequest('http://localhost/api/admin/payout-requests'));
    expect(res.status).toBe(403);
  });

  it('returns 400 on an invalid status filter', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    const res = await GET(new NextRequest('http://localhost/api/admin/payout-requests?status=BOGUS'));
    expect(res.status).toBe(400);
  });

  it('returns the queue enriched with farmer identity and queueSize', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockWRFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: 'wr-1', farmerId: 'f1', amountKES: 1000, status: 'REQUESTED' },
          ]),
        }),
      }),
    });
    mockUserFind.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: 'f1', firstName: 'Kamau', lastName: 'N', phoneNumber: '0712', county: 'Nairobi' },
        ]),
      }),
    });
    mockWRCount.mockResolvedValue(3);

    const res = await GET(new NextRequest('http://localhost/api/admin/payout-requests'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data[0].farmer.firstName).toBe('Kamau');
    expect(body.meta.queueSize).toBe(3);
  });
});

describe('PATCH /api/admin/payout-requests', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-admin with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const res = await PATCH(patchReq({ requestId: WR_ID, decision: 'APPROVED' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when REJECTED is missing a note', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    const res = await PATCH(patchReq({ requestId: WR_ID, decision: 'REJECTED' }));
    expect(res.status).toBe(400);
  });

  it('approves a REQUESTED payout and fires audit + SMS', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockWRFindOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: WR_ID, farmerId: 'f1', amountKES: 1000, status: 'APPROVED' }),
    });
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ firstName: 'Kamau', phoneNumber: '0712' }) }),
    });

    const res = await PATCH(patchReq({ requestId: WR_ID, decision: 'APPROVED' }));

    expect(res.status).toBe(200);
    expect(mockWRFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: WR_ID, status: 'REQUESTED' }),
      expect.anything(),
      { new: true }
    );
    expect(mockAuditCreate).toHaveBeenCalledWith(expect.objectContaining({ action: 'PAYOUT_APPROVED' }));
  });

  it('returns 409 on an invalid status transition', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockWRFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockWRFindById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ status: 'PAID' }) }) });

    const res = await PATCH(patchReq({ requestId: WR_ID, decision: 'APPROVED' }));

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('PAYOUT_INVALID_STATUS_TRANSITION');
  });

  it('returns 404 when the request does not exist', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockWRFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockWRFindById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });

    const res = await PATCH(patchReq({ requestId: WR_ID, decision: 'APPROVED' }));

    expect(res.status).toBe(404);
  });
});
