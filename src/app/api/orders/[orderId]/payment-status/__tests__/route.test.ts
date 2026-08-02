/**
 * @jest-environment node
 *
 * Tests for GET /api/orders/[orderId]/payment-status.
 * Covers: party-only access, the lazy stuck-payment reconciliation that makes
 * the daily cron a backstop rather than the primary trigger, and the
 * isSimulated flag the waiting screen relies on for honest copy.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockOrderFindById = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: { findById: (...a: unknown[]) => mockOrderFindById(...a) },
}));

const mockReconcile = jest.fn();
jest.mock('@/lib/payments/reconcile', () => ({
  reconcileStuckPayments: (...a: unknown[]) => mockReconcile(...a),
}));

const mockDispatch = jest.fn();
jest.mock('@/lib/payments/dispatcher', () => ({
  dispatchDuePayments: (...a: unknown[]) => mockDispatch(...a),
}));

const mockIsSimulationActive = jest.fn();
jest.mock('@/lib/payments', () => ({
  isSimulationActive: () => mockIsSimulationActive(),
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET } from '../route';

const ORDER_ID = '507f1f77bcf86cd799439011';
const BUYER_ID = '507f1f77bcf86cd799439012';
const FARMER_ID = '507f1f77bcf86cd799439013';

const BUYER_SESSION = { user: { id: BUYER_ID, role: 'BUYER', firstName: 'Kamau' } };
const OTHER_BUYER = { user: { id: 'someone-else', role: 'BUYER', firstName: 'Nosy' } };

function selectLean(value: unknown) {
  return { select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) };
}
function order(overrides: Record<string, unknown> = {}) {
  return {
    paymentStatus: 'PENDING_PAYMENT',
    fulfillmentStatus: 'AWAITING_PAYMENT',
    buyerId: { toString: () => BUYER_ID },
    farmerId: { toString: () => FARMER_ID },
    ...overrides,
  };
}
function req() {
  return new NextRequest(`http://localhost/api/orders/${ORDER_ID}/payment-status`);
}
function params(orderId = ORDER_ID) {
  return { params: Promise.resolve({ orderId }) };
}

describe('GET /api/orders/[orderId]/payment-status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReconcile.mockResolvedValue(0);
    mockDispatch.mockResolvedValue(0);
    mockIsSimulationActive.mockReturnValue(true);
  });

  it('rejects an unauthenticated request with 401', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(req(), params());
    expect(res.status).toBe(401);
  });

  it('rejects a buyer who does not own the order with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(OTHER_BUYER);
    mockOrderFindById.mockReturnValue(selectLean(order()));
    const res = await GET(req(), params());
    expect(res.status).toBe(403);
  });

  it('reconciles this order lazily rather than waiting for the daily cron', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockOrderFindById.mockReturnValue(selectLean(order()));
    mockReconcile.mockResolvedValue(1);

    const res = await GET(req(), params());
    const body = await res.json();

    expect(mockReconcile).toHaveBeenCalledWith({ orderId: ORDER_ID });
    expect(body.paymentStatus).toBe('FAILED');
    // Once closed out there is nothing left to deliver for this order.
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('does not attempt reconciliation once the order has left PENDING_PAYMENT', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockOrderFindById.mockReturnValue(
      selectLean(order({ paymentStatus: 'PAID', fulfillmentStatus: 'IN_FULFILLMENT' }))
    );

    await GET(req(), params());
    expect(mockReconcile).not.toHaveBeenCalled();
  });

  it('falls through to the simulated delivery sweep when nothing was stuck', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockOrderFindById
      .mockReturnValueOnce(selectLean(order()))
      .mockReturnValueOnce(
        selectLean({ paymentStatus: 'PAID', fulfillmentStatus: 'IN_FULFILLMENT' })
      );
    mockDispatch.mockResolvedValue(1);

    const res = await GET(req(), params());
    const body = await res.json();

    expect(mockDispatch).toHaveBeenCalledWith({ orderId: ORDER_ID });
    expect(body.paymentStatus).toBe('PAID');
    expect(body.isSimulated).toBe(true);
  });

  it('reports the provider so the waiting screen can tell the truth', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockIsSimulationActive.mockReturnValue(false);
    mockOrderFindById.mockReturnValue(
      selectLean(order({ paymentStatus: 'PAID', fulfillmentStatus: 'IN_FULFILLMENT' }))
    );

    const body = await (await GET(req(), params())).json();
    expect(body.isSimulated).toBe(false);
  });
});
