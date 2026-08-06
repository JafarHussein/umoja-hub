/**
 * @jest-environment node
 *
 * Tests for PATCH /api/orders/[orderId]/status — the buyer's confirmation of
 * receipt, which is what releases the escrow to the farmer.
 *
 * The load-bearing property is the mediation gate. Filing an escalation
 * deliberately leaves the order in IN_FULFILLMENT, so a status check alone
 * cannot tell a contested order from a quiet one.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockOrderFindById = jest.fn();
const mockOrderFindByIdAndUpdate = jest.fn().mockResolvedValue({});
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: {
    findById: (...a: unknown[]) => mockOrderFindById(...a),
    findByIdAndUpdate: (...a: unknown[]) => mockOrderFindByIdAndUpdate(...a),
  },
}));

const mockMediationExists = jest.fn();
jest.mock('@/lib/models/MediationRequest.model', () => ({
  __esModule: true,
  default: { exists: (...a: unknown[]) => mockMediationExists(...a) },
}));

jest.mock('@/lib/models/MarketplaceListing.model', () => ({
  __esModule: true,
  default: { findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) },
}));
jest.mock('@/lib/models/PriceHistory.model', () => ({
  __esModule: true,
  default: { create: jest.fn().mockResolvedValue({}) },
}));
jest.mock('@/lib/models/PriceAlert.model', () => ({
  __esModule: true,
  default: { find: jest.fn().mockResolvedValue([]), findByIdAndUpdate: jest.fn() },
}));
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) },
}));
jest.mock('@/lib/models/EscrowEventLog.model', () => ({
  __esModule: true,
  default: { create: jest.fn().mockResolvedValue({}) },
}));

jest.mock('@/lib/trust/farmerTrustCalculator', () => ({ recalculate: jest.fn() }));
jest.mock('@/lib/integrations/smsService', () => ({ sendSMS: jest.fn() }));
jest.mock('@/lib/notifications/notify', () => ({ notify: jest.fn() }));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { PATCH } from '../route';

const ORDER_ID = '507f1f77bcf86cd799439011';
const BUYER_ID = '507f1f77bcf86cd799439012';
const FARMER_ID = '507f1f77bcf86cd799439013';

const BUYER_SESSION = { user: { id: BUYER_ID, role: 'BUYER', firstName: 'Kamau' } };

function order(overrides: Record<string, unknown> = {}) {
  return {
    _id: ORDER_ID,
    orderReferenceId: 'UMJ-2026-000123',
    cropName: 'Maize',
    buyerId: BUYER_ID,
    farmerId: FARMER_ID,
    totalAmountKES: 2000,
    listingId: 'l1',
    pricePerUnit: 100,
    unit: 'KG',
    paymentStatus: 'PAID',
    fulfillmentStatus: 'IN_FULFILLMENT',
    ...overrides,
  };
}

function req(body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/orders/${ORDER_ID}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ orderId: ORDER_ID });

describe('buyer confirms receipt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderFindByIdAndUpdate.mockResolvedValue({});
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
  });

  it('releases the escrow when nothing is contested', async () => {
    mockOrderFindById.mockResolvedValue(order());
    mockMediationExists.mockResolvedValue(null);

    const res = await PATCH(req({ fulfillmentStatus: 'RECEIVED' }), { params });

    expect(res.status).toBe(200);
    const [, update] = mockOrderFindByIdAndUpdate.mock.calls[0];
    expect(update).toMatchObject({ fulfillmentStatus: 'COMPLETED' });
  });

  it('refuses while a mediation is open, and does not touch the order', async () => {
    // The order is still IN_FULFILLMENT during a dispute, so the status check
    // above passes. Without this gate a buyer could pay the farmer out in the
    // middle of the review that was deciding whether they should be — and
    // strand the case, because settleEscrow only settles funds still held.
    mockOrderFindById.mockResolvedValue(order());
    mockMediationExists.mockResolvedValue({ _id: 'm1' });

    const res = await PATCH(req({ fulfillmentStatus: 'RECEIVED' }), { params });

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: 'ORDER_UNDER_MEDIATION' });
    expect(mockOrderFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('refuses while a mediation is merely IN_REVIEW, not only OPEN', async () => {
    mockOrderFindById.mockResolvedValue(order());
    mockMediationExists.mockResolvedValue({ _id: 'm1' });

    await PATCH(req({ fulfillmentStatus: 'RECEIVED' }), { params });

    const [filter] = mockMediationExists.mock.calls[0];
    expect(filter.status.$in).toEqual(expect.arrayContaining(['OPEN', 'IN_REVIEW']));
  });

  it('will not let someone else confirm receipt on a buyer’s behalf', async () => {
    mockOrderFindById.mockResolvedValue(order({ buyerId: 'someone-else' }));

    const res = await PATCH(req({ fulfillmentStatus: 'RECEIVED' }), { params });

    expect(res.status).toBe(403);
    expect(mockOrderFindByIdAndUpdate).not.toHaveBeenCalled();
  });
});
