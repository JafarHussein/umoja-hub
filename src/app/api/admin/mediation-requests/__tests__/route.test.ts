/**
 * @jest-environment node
 *
 * Tests for GET + PATCH /api/admin/mediation-requests
 * Covers: admin guard, status filter, transitions, resolution-note rule, audit.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockMRFind = jest.fn();
const mockMRFindOneAndUpdate = jest.fn();
const mockMRFindById = jest.fn();
const mockMRCount = jest.fn();
jest.mock('@/lib/models/MediationRequest.model', () => ({
  __esModule: true,
  default: {
    find: (...a: unknown[]) => mockMRFind(...a),
    findOneAndUpdate: (...a: unknown[]) => mockMRFindOneAndUpdate(...a),
    findById: (...a: unknown[]) => mockMRFindById(...a),
    countDocuments: (...a: unknown[]) => mockMRCount(...a),
  },
}));

const mockAuditCreate = jest.fn().mockResolvedValue({});
jest.mock('@/lib/models/AdminAuditLog.model', () => ({
  __esModule: true,
  default: { create: (...a: unknown[]) => mockAuditCreate(...a) },
}));

const mockUserFind = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { find: (...a: unknown[]) => mockUserFind(...a) },
}));

const mockOrderFind = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: { find: (...a: unknown[]) => mockOrderFind(...a) },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET, PATCH } from '../route';

const ADMIN_SESSION = { user: { id: 'admin-1', role: 'ADMIN', firstName: 'Admin' } };
const BUYER_SESSION = { user: { id: 'b1', role: 'BUYER', firstName: 'Bea' } };
const MR_ID = '507f1f77bcf86cd799439011';

function patchReq(body: unknown) {
  return new NextRequest('http://localhost/api/admin/mediation-requests', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/admin/mediation-requests', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-admin with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await GET(new NextRequest('http://localhost/api/admin/mediation-requests'));
    expect(res.status).toBe(403);
  });

  it('returns 400 on an invalid status filter', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    const res = await GET(new NextRequest('http://localhost/api/admin/mediation-requests?status=NOPE'));
    expect(res.status).toBe(400);
  });

  it('returns the queue enriched with both parties and the order ref', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockMRFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: 'mr-1', buyerId: 'b1', farmerId: 'f1', orderId: 'o1', status: 'OPEN' },
          ]),
        }),
      }),
    });
    mockUserFind.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: 'b1', firstName: 'Bea', lastName: 'B', phoneNumber: '0700' },
          { _id: 'f1', firstName: 'Kamau', lastName: 'N', phoneNumber: '0711' },
        ]),
      }),
    });
    mockOrderFind.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: 'o1', orderReferenceId: 'UMJ-1', cropName: 'Maize', totalAmountKES: 2000, fulfillmentStatus: 'IN_FULFILLMENT' },
        ]),
      }),
    });
    mockMRCount.mockResolvedValue(5);

    const res = await GET(new NextRequest('http://localhost/api/admin/mediation-requests'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data[0].buyer.firstName).toBe('Bea');
    expect(body.data[0].order.orderReferenceId).toBe('UMJ-1');
    expect(body.meta.queueSize).toBe(5);
  });
});

describe('PATCH /api/admin/mediation-requests', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-admin with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await PATCH(patchReq({ requestId: MR_ID, status: 'IN_REVIEW' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when RESOLVED is missing a resolution note', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    const res = await PATCH(patchReq({ requestId: MR_ID, status: 'RESOLVED' }));
    expect(res.status).toBe(400);
  });

  it('moves OPEN to IN_REVIEW and audit-logs it', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockMRFindOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: MR_ID, status: 'IN_REVIEW' }),
    });

    const res = await PATCH(patchReq({ requestId: MR_ID, status: 'IN_REVIEW' }));

    expect(res.status).toBe(200);
    expect(mockMRFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: MR_ID, status: { $in: ['OPEN'] } }),
      expect.anything(),
      { new: true }
    );
    expect(mockAuditCreate).toHaveBeenCalledWith(expect.objectContaining({ action: 'MEDIATION_IN_REVIEW' }));
  });

  it('returns 409 on an invalid transition', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockMRFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockMRFindById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ status: 'RESOLVED' }) }) });

    const res = await PATCH(patchReq({ requestId: MR_ID, status: 'IN_REVIEW' }));

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('MEDIATION_INVALID_STATUS_TRANSITION');
  });

  it('returns 404 when the request does not exist', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockMRFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockMRFindById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });

    const res = await PATCH(patchReq({ requestId: MR_ID, status: 'IN_REVIEW' }));

    expect(res.status).toBe(404);
  });
});
