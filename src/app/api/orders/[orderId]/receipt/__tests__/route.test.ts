/**
 * @jest-environment node
 *
 * Tests for GET /api/orders/[orderId]/receipt.
 * Covers: party-only access, the unpaid-order refusal, and that the receipt
 * exposes the M-Pesa reference alongside a merged payment + escrow trail.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockOrderFindById = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: { findById: (...a: unknown[]) => mockOrderFindById(...a) },
}));

const mockUserFind = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { find: (...a: unknown[]) => mockUserFind(...a) },
}));

const mockPaymentFind = jest.fn();
jest.mock('@/lib/models/PaymentEventLog.model', () => ({
  __esModule: true,
  default: { find: (...a: unknown[]) => mockPaymentFind(...a) },
}));

const mockEscrowFind = jest.fn();
jest.mock('@/lib/models/EscrowEventLog.model', () => ({
  __esModule: true,
  default: { find: (...a: unknown[]) => mockEscrowFind(...a) },
}));

const mockMediationFindOne = jest.fn();
jest.mock('@/lib/models/MediationRequest.model', () => ({
  __esModule: true,
  default: { findOne: (...a: unknown[]) => mockMediationFindOne(...a) },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET } from '../route';

const ORDER_ID = '507f1f77bcf86cd799439011';
const BUYER_ID = '507f1f77bcf86cd799439012';
const FARMER_ID = '507f1f77bcf86cd799439013';
const OUTSIDER_ID = '507f1f77bcf86cd799439014';

const BUYER_SESSION = { user: { id: BUYER_ID, role: 'BUYER', firstName: 'Kamau' } };
const OUTSIDER_SESSION = { user: { id: OUTSIDER_ID, role: 'BUYER', firstName: 'Nosy' } };
const ADMIN_SESSION = { user: { id: 'admin-1', role: 'ADMIN', firstName: 'Admin' } };

const PAID_ORDER = {
  _id: ORDER_ID,
  orderReferenceId: 'UMJ-2026-000123',
  buyerId: BUYER_ID,
  farmerId: FARMER_ID,
  mpesaTransactionId: 'QGR1ABCD23',
  cropName: 'Maize',
  quantityOrdered: 20,
  unit: 'KG',
  pricePerUnit: 100,
  totalAmountKES: 2000,
  fulfillmentType: 'PICKUP',
  paymentStatus: 'PAID',
  fulfillmentStatus: 'IN_FULFILLMENT',
  buyerPhone: '0712345678',
  paidAt: new Date('2026-06-01T10:00:30Z'),
  confirmedByFarmerAt: null,
};

function req(): NextRequest {
  return new NextRequest(`http://localhost/api/orders/${ORDER_ID}/receipt`);
}
function params(orderId = ORDER_ID) {
  return { params: Promise.resolve({ orderId }) };
}
function leanOf(value: unknown) {
  return { lean: jest.fn().mockResolvedValue(value) };
}
function sortLean(value: unknown) {
  return { sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) };
}
function selectLean(value: unknown) {
  return { select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) };
}

function wireHappyPath(): void {
  mockOrderFindById.mockReturnValue(leanOf(PAID_ORDER));
  mockUserFind.mockReturnValue(
    selectLean([
      { _id: BUYER_ID, firstName: 'Kamau', lastName: 'Githinji' },
      { _id: FARMER_ID, firstName: 'Wanjiku', lastName: 'Kamau' },
    ])
  );
  mockPaymentFind.mockReturnValue(
    sortLean([
      {
        eventType: 'SUCCESS',
        occurredAt: new Date('2026-06-01T10:00:30Z'),
        amount: 2000,
        paymentReference: 'QGR1ABCD23',
        resultCode: 0,
      },
    ])
  );
  mockEscrowFind.mockReturnValue(
    sortLean([
      {
        eventType: 'HELD',
        occurredAt: new Date('2026-06-01T10:00:31Z'),
        amountKES: 2000,
        actorRole: 'SYSTEM',
      },
    ])
  );
  mockMediationFindOne.mockReturnValue(selectLean(null));
}

describe('GET /api/orders/[orderId]/receipt', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects an unauthenticated request with 401', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(req(), params());
    expect(res.status).toBe(401);
  });

  it('rejects a malformed order id with 400', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await GET(req(), params('not-an-id'));
    expect(res.status).toBe(400);
  });

  it('rejects a user who is neither party nor admin with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(OUTSIDER_SESSION);
    mockOrderFindById.mockReturnValue(leanOf(PAID_ORDER));
    const res = await GET(req(), params());
    expect(res.status).toBe(403);
  });

  it('refuses a receipt for an order that has not been paid', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockOrderFindById.mockReturnValue(
      leanOf({ ...PAID_ORDER, paymentStatus: 'PENDING_PAYMENT', mpesaTransactionId: null })
    );
    const res = await GET(req(), params());
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.code).toBe('RECEIPT_NOT_AVAILABLE');
  });

  it('returns the receipt with the M-Pesa reference and a merged trail', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    wireHappyPath();

    const res = await GET(req(), params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.receipt).toMatchObject({
      receiptNumber: 'QGR1ABCD23',
      orderReferenceId: 'UMJ-2026-000123',
      escrowReference: 'ESC-2026-000123',
      paymentMethod: 'M-PESA',
      totalAmountKES: 2000,
      escrowState: 'HELD',
    });
    expect(body.data.receipt.buyer.name).toBe('Kamau Githinji');
    expect(body.data.receipt.farmer.name).toBe('Wanjiku Kamau');
    // Payment event first, escrow milestone second — chronological.
    expect(body.data.events.map((e: { type: string }) => e.type)).toEqual(['SUCCESS', 'HELD']);
  });

  it('lets an admin read any order’s receipt', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    wireHappyPath();
    const res = await GET(req(), params());
    expect(res.status).toBe(200);
  });

  it('reports the escrow as under review when a mediation is open', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    wireHappyPath();
    mockMediationFindOne.mockReturnValue(selectLean({ _id: 'm1' }));

    const res = await GET(req(), params());
    const body = await res.json();
    expect(body.data.receipt.escrowState).toBe('HELD_UNDER_REVIEW');
  });
});
