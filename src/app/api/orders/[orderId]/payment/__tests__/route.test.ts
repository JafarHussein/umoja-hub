/**
 * @jest-environment node
 *
 * Tests for POST /api/orders/[orderId]/payment — buyer retry and cancel.
 * Covers: owner-only access, the double-payment refusal, stock re-reservation
 * on retry, rollback when the provider fails, and cancel releasing stock.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockOrderFindById = jest.fn();
const mockOrderFindOneAndUpdate = jest.fn();
const mockOrderFindByIdAndUpdate = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: {
    findById: (...a: unknown[]) => mockOrderFindById(...a),
    findOneAndUpdate: (...a: unknown[]) => mockOrderFindOneAndUpdate(...a),
    findByIdAndUpdate: (...a: unknown[]) => mockOrderFindByIdAndUpdate(...a),
  },
}));

const mockListingFindOneAndUpdate = jest.fn();
const mockListingFindByIdAndUpdate = jest.fn();
jest.mock('@/lib/models/MarketplaceListing.model', () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: (...a: unknown[]) => mockListingFindOneAndUpdate(...a),
    findByIdAndUpdate: (...a: unknown[]) => mockListingFindByIdAndUpdate(...a),
  },
}));

const mockPaymentLogCreate = jest.fn();
jest.mock('@/lib/models/PaymentEventLog.model', () => ({
  __esModule: true,
  default: { create: (...a: unknown[]) => mockPaymentLogCreate(...a) },
}));

const mockInitiatePayment = jest.fn();
jest.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({ initiatePayment: (...a: unknown[]) => mockInitiatePayment(...a) }),
  getActiveProviderName: () => 'simulation',
  isSimulationActive: () => true,
}));

const mockCheckRateLimit = jest.fn();
jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: (...a: unknown[]) => mockCheckRateLimit(...a),
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

const ORDER_ID = '507f1f77bcf86cd799439011';
const BUYER_ID = '507f1f77bcf86cd799439012';
const FARMER_ID = '507f1f77bcf86cd799439013';
const LISTING_ID = '507f1f77bcf86cd799439014';

const BUYER_SESSION = { user: { id: BUYER_ID, role: 'BUYER', firstName: 'Kamau' } };
const OTHER_BUYER = { user: { id: FARMER_ID, role: 'BUYER', firstName: 'Nosy' } };

function baseOrder(overrides: Record<string, unknown> = {}) {
  return {
    _id: ORDER_ID,
    orderReferenceId: 'UMJ-2026-000123',
    buyerId: BUYER_ID,
    farmerId: FARMER_ID,
    listingId: LISTING_ID,
    cropName: 'Maize',
    quantityOrdered: 20,
    totalAmountKES: 2000,
    buyerPhone: '0712345678',
    paymentStatus: 'FAILED',
    ...overrides,
  };
}

function req(body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/orders/${ORDER_ID}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
function params(orderId = ORDER_ID) {
  return { params: Promise.resolve({ orderId }) };
}

describe('POST /api/orders/[orderId]/payment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockPaymentLogCreate.mockReturnValue({ catch: jest.fn() });
    mockOrderFindByIdAndUpdate.mockResolvedValue({});
    mockListingFindByIdAndUpdate.mockResolvedValue({});
  });

  it('rejects a buyer who does not own the order with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(OTHER_BUYER);
    mockOrderFindById.mockResolvedValue(baseOrder());
    const res = await POST(req({ action: 'RETRY' }), params());
    expect(res.status).toBe(403);
  });

  it('rejects an unknown action with 400', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await POST(req({ action: 'REFUND' }), params());
    expect(res.status).toBe(400);
  });

  it('refuses to re-pay an order that is already paid', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockOrderFindById.mockResolvedValue(baseOrder({ paymentStatus: 'PAID' }));

    const res = await POST(req({ action: 'RETRY' }), params());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe('ORDER_ALREADY_PAID');
    expect(mockInitiatePayment).not.toHaveBeenCalled();
  });

  it('refuses to re-pay a refunded order', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockOrderFindById.mockResolvedValue(baseOrder({ paymentStatus: 'REFUNDED' }));
    const res = await POST(req({ action: 'RETRY' }), params());
    expect((await res.json()).code).toBe('ORDER_REFUNDED');
  });

  it('refuses to retry an order still awaiting payment', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockOrderFindById.mockResolvedValue(baseOrder({ paymentStatus: 'PENDING_PAYMENT' }));
    const res = await POST(req({ action: 'RETRY' }), params());
    expect((await res.json()).code).toBe('ORDER_NOT_RETRYABLE');
  });

  it('retries a failed payment, re-reserving stock and opening a new session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockOrderFindById.mockResolvedValue(baseOrder());
    mockListingFindOneAndUpdate.mockResolvedValue({ _id: LISTING_ID, quantityAvailable: 30 });
    mockInitiatePayment.mockResolvedValue({
      checkoutRequestId: 'ws_CO_sim_retry',
      merchantRequestId: 'm-1',
      customerMessage: 'ok',
    });

    const res = await POST(req({ action: 'RETRY' }), params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.paymentStatus).toBe('PENDING_PAYMENT');
    expect(body.data.checkoutRequestId).toBe('ws_CO_sim_retry');
    // `updatePipeline: true` is load-bearing here for the same reason it is in
    // `POST /api/orders`: Mongoose 9 refuses an array update without it, so the
    // retry threw `Internal server error` for every buyer whose payment failed.
    // `toHaveBeenCalled()` alone could not see that — it asserted the call
    // happened, not that the driver would accept it.
    expect(mockListingFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: LISTING_ID,
        listingStatus: 'AVAILABLE',
        quantityAvailable: { $gte: 20 },
      }),
      expect.any(Array), // pipeline update
      { new: true, updatePipeline: true }
    );
    // The retry rejoins the same order's trail.
    expect(mockPaymentLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'INITIATED', orderId: ORDER_ID })
    );
    // The stuck-payment clock restarts, or the sweep would judge this retry
    // stale immediately on the age of the original order.
    const update = mockOrderFindByIdAndUpdate.mock.calls[0]?.[1] as {
      $set: Record<string, unknown>;
    };
    expect(update.$set['paymentRequestedAt']).toBeInstanceOf(Date);
  });

  it('refuses the retry when the produce has since sold out', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockOrderFindById.mockResolvedValue(baseOrder());
    mockListingFindOneAndUpdate.mockResolvedValue(null);

    const res = await POST(req({ action: 'RETRY' }), params());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe('ORDER_INSUFFICIENT_STOCK');
    expect(mockInitiatePayment).not.toHaveBeenCalled();
  });

  it('returns the reserved stock when the provider fails on retry', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockOrderFindById.mockResolvedValue(baseOrder());
    mockListingFindOneAndUpdate.mockResolvedValue({ _id: LISTING_ID });
    mockInitiatePayment.mockRejectedValue(new Error('STK failed'));

    await POST(req({ action: 'RETRY' }), params());

    expect(mockListingFindByIdAndUpdate).toHaveBeenCalledWith(
      LISTING_ID,
      expect.objectContaining({ $inc: { quantityAvailable: 20 } })
    );
  });

  it('enforces a retry rate limit', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockOrderFindById.mockResolvedValue(baseOrder());
    mockCheckRateLimit.mockResolvedValue({ allowed: false });

    const res = await POST(req({ action: 'RETRY' }), params());
    expect(res.status).toBe(429);
    expect(mockListingFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('cancels an unpaid order and returns the stock', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockOrderFindById.mockResolvedValue(baseOrder({ paymentStatus: 'PENDING_PAYMENT' }));
    mockOrderFindOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: ORDER_ID }),
    });

    const res = await POST(req({ action: 'CANCEL' }), params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.cancelled).toBe(true);
    expect(mockListingFindByIdAndUpdate).toHaveBeenCalledWith(
      LISTING_ID,
      expect.objectContaining({ $inc: { quantityAvailable: 20 } })
    );
  });

  it('loses the cancel race to a payment that lands first', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockOrderFindById.mockResolvedValue(baseOrder({ paymentStatus: 'PENDING_PAYMENT' }));
    mockOrderFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await POST(req({ action: 'CANCEL' }), params());

    expect(res.status).toBe(409);
    // Critically: stock is NOT returned, because the payment kept it.
    expect(mockListingFindByIdAndUpdate).not.toHaveBeenCalled();
  });
});
