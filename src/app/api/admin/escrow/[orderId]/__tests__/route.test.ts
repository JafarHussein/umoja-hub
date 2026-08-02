/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/escrow/[orderId] — direct settlement of held funds.
 * Covers: the admin guard, the mandatory reason, the held-state refusal, and
 * that a settlement is audit-logged against the acting admin.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockSettleEscrow = jest.fn();
jest.mock('@/lib/foodhub/escrowSettlement', () => ({
  settleEscrow: (...a: unknown[]) => mockSettleEscrow(...a),
}));

const mockAuditCreate = jest.fn();
jest.mock('@/lib/models/AdminAuditLog.model', () => ({
  __esModule: true,
  default: { create: (...a: unknown[]) => mockAuditCreate(...a) },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

const ORDER_ID = '507f1f77bcf86cd799439011';
const ADMIN_SESSION = { user: { id: 'admin-1', role: 'ADMIN', firstName: 'Admin' } };
const BUYER_SESSION = { user: { id: 'b1', role: 'BUYER', firstName: 'Bea' } };

const GOOD_REASON = 'Farmer confirmed by phone that they cannot fulfil this order.';

function req(body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/admin/escrow/${ORDER_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
function params(orderId = ORDER_ID) {
  return { params: Promise.resolve({ orderId }) };
}

describe('POST /api/admin/escrow/[orderId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuditCreate.mockResolvedValue({});
  });

  it('rejects a non-admin with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await POST(req({ outcome: 'RELEASE', reason: GOOD_REASON }), params());
    expect(res.status).toBe(403);
    expect(mockSettleEscrow).not.toHaveBeenCalled();
  });

  it('rejects a malformed order id with 400', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    const res = await POST(
      req({ outcome: 'RELEASE', reason: GOOD_REASON }),
      params('not-an-id')
    );
    expect(res.status).toBe(400);
  });

  it('rejects a settlement with no substantive reason', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    const res = await POST(req({ outcome: 'REFUND', reason: 'no' }), params());
    expect(res.status).toBe(400);
    expect(mockSettleEscrow).not.toHaveBeenCalled();
  });

  it('returns 409 when the funds are no longer held', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockSettleEscrow.mockResolvedValue({ applied: false, reason: 'NOT_HELD' });

    const res = await POST(req({ outcome: 'RELEASE', reason: GOOD_REASON }), params());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe('ESCROW_NOT_HELD');
    // Nothing moved, so nothing is recorded as having moved.
    expect(mockAuditCreate).not.toHaveBeenCalled();
  });

  it('releases held funds and records the decision against the admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockSettleEscrow.mockResolvedValue({
      applied: true,
      orderId: ORDER_ID,
      orderReferenceId: 'UMJ-2026-000123',
      amountKES: 2000,
      outcome: 'RELEASE',
    });

    const res = await POST(req({ outcome: 'RELEASE', reason: GOOD_REASON }), params());
    expect(res.status).toBe(200);

    expect(mockSettleEscrow).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: ORDER_ID,
        outcome: 'RELEASE',
        note: GOOD_REASON,
        adminId: 'admin-1',
        context: 'ADMIN_DIRECT',
      })
    );
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 'admin-1',
        action: 'ESCROW_RELEASED',
        targetType: 'Order',
        details: expect.objectContaining({ reason: GOOD_REASON, amountKES: 2000 }),
      })
    );
  });

  it('records a refund under its own audit action', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockSettleEscrow.mockResolvedValue({
      applied: true,
      orderId: ORDER_ID,
      orderReferenceId: 'UMJ-2026-000123',
      amountKES: 2000,
      outcome: 'REFUND',
    });

    const res = await POST(req({ outcome: 'REFUND', reason: GOOD_REASON }), params());
    expect(res.status).toBe(200);
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ESCROW_REFUND_ISSUED' })
    );
  });
});
