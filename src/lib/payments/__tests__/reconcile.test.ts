/**
 * @jest-environment node
 *
 * reconcileStuckPayments — closing out payments whose callback never arrived.
 * Covers: the payment-session clock (a retry must not be judged stale on the
 * original order's age), the guarded transition, inventory restore, and the
 * RECONCILED audit event that this path previously never wrote.
 */

const mockOrderFind = jest.fn();
const mockOrderFindOneAndUpdate = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: {
    find: (...a: unknown[]) => mockOrderFind(...a),
    findOneAndUpdate: (...a: unknown[]) => mockOrderFindOneAndUpdate(...a),
  },
}));

const mockListingFindByIdAndUpdate = jest.fn();
jest.mock('@/lib/models/MarketplaceListing.model', () => ({
  __esModule: true,
  default: { findByIdAndUpdate: (...a: unknown[]) => mockListingFindByIdAndUpdate(...a) },
}));

const mockPaymentLogCreate = jest.fn();
jest.mock('@/lib/models/PaymentEventLog.model', () => ({
  __esModule: true,
  default: { create: (...a: unknown[]) => mockPaymentLogCreate(...a) },
}));

const mockNotify = jest.fn();
jest.mock('@/lib/notifications/notify', () => ({
  notify: (...a: unknown[]) => mockNotify(...a),
}));

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

import { reconcileStuckPayments, STUCK_PAYMENT_TIMEOUT_MINUTES } from '../reconcile';

const ORDER_ID = '507f1f77bcf86cd799439011';
const LISTING_ID = '507f1f77bcf86cd799439014';

function stuckOrder() {
  return {
    _id: ORDER_ID,
    orderReferenceId: 'UMJ-2026-000123',
    listingId: LISTING_ID,
    quantityOrdered: 20,
    cropName: 'Maize',
    buyerId: 'b1',
    farmerId: 'f1',
    totalAmountKES: 2000,
  };
}

function wireFind(orders: unknown[]): void {
  mockOrderFind.mockReturnValue({
    select: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(orders) }),
    }),
  });
}

describe('reconcileStuckPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListingFindByIdAndUpdate.mockResolvedValue({});
    mockPaymentLogCreate.mockResolvedValue({});
  });

  it('anchors staleness on the payment session, not the order age', async () => {
    wireFind([]);
    await reconcileStuckPayments();

    const filter = mockOrderFind.mock.calls[0]?.[0] as {
      paymentStatus: string;
      $or: Record<string, unknown>[];
    };

    expect(filter.paymentStatus).toBe('PENDING_PAYMENT');
    // A retried order carries a fresh paymentRequestedAt, so it is only stale
    // once THAT clock passes the timeout.
    expect(filter.$or?.[0]).toHaveProperty('paymentRequestedAt');
    // Orders predating the field still fall back to createdAt.
    expect(filter.$or?.[1]).toMatchObject({ paymentRequestedAt: { $exists: false } });
  });

  it('uses the documented timeout window', async () => {
    wireFind([]);
    const before = Date.now();
    await reconcileStuckPayments();

    const filter = mockOrderFind.mock.calls[0]?.[0] as {
      $or: { paymentRequestedAt?: { $lt: Date } }[];
    };
    const cutoff = filter.$or?.[0]?.paymentRequestedAt?.$lt as Date;
    const expected = before - STUCK_PAYMENT_TIMEOUT_MINUTES * 60 * 1000;

    expect(Math.abs(cutoff.getTime() - expected)).toBeLessThan(5_000);
  });

  it('closes the payment, restores stock, audits and notifies the buyer', async () => {
    wireFind([stuckOrder()]);
    mockOrderFindOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: ORDER_ID }),
    });

    const count = await reconcileStuckPayments();

    expect(count).toBe(1);
    expect(mockOrderFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: ORDER_ID, paymentStatus: 'PENDING_PAYMENT' },
      { $set: { paymentStatus: 'FAILED' } },
      { new: true }
    );
    expect(mockListingFindByIdAndUpdate).toHaveBeenCalledWith(
      LISTING_ID,
      expect.objectContaining({ $inc: { quantityAvailable: 20 } })
    );
    expect(mockPaymentLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'RECONCILED', orderId: ORDER_ID })
    );
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'b1', title: 'Payment not completed' })
    );
  });

  it('yields to a payment that lands during the sweep', async () => {
    wireFind([stuckOrder()]);
    // The guarded update matches nothing — the callback already moved it.
    mockOrderFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const count = await reconcileStuckPayments();

    expect(count).toBe(0);
    // Critically: stock is NOT returned and no failure is recorded.
    expect(mockListingFindByIdAndUpdate).not.toHaveBeenCalled();
    expect(mockPaymentLogCreate).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('scopes to a single order on the lazy path', async () => {
    wireFind([]);
    await reconcileStuckPayments({ orderId: ORDER_ID });

    expect(mockOrderFind.mock.calls[0]?.[0]).toMatchObject({ _id: ORDER_ID });
  });

  it('reports zero when nothing is stuck', async () => {
    wireFind([]);
    expect(await reconcileStuckPayments()).toBe(0);
  });
});
