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
const mockNotifyAdmins = jest.fn();
jest.mock('@/lib/notifications/notify', () => ({
  notify: (...a: unknown[]) => mockNotify(...a),
  notifyAdmins: (...a: unknown[]) => mockNotifyAdmins(...a),
}));

// The provider is what reconciliation now ASKS before concluding anything.
const mockQueryPaymentStatus = jest.fn();
jest.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({ queryPaymentStatus: mockQueryPaymentStatus }),
}));

const mockProcessStkCallback = jest.fn();
jest.mock('@/lib/payments/processCallback', () => ({
  processStkCallback: (...a: unknown[]) => mockProcessStkCallback(...a),
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
    // The row has to carry its own causation and its own transition. An audit
    // that records only "RECONCILED" leaves a reader unable to tell a payment
    // the network killed from one the platform closed out on nobody's
    // instruction — which is the distinction the whole state exists to draw.
    expect(mockPaymentLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'RECONCILED',
        orderId: ORDER_ID,
        actor: 'SYSTEM',
        previousStatus: 'PENDING_PAYMENT',
        newStatus: 'FAILED',
        reason: expect.stringContaining('No callback arrived'),
        correlationId: expect.any(String),
      })
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

// ---------------------------------------------------------------------------
// Asking the provider before concluding.
//
// This sweep used to assume that a payment whose callback never arrived had
// failed, and told the buyer "No money left your account" on that assumption.
// A lost callback can sit on top of a real debit, so the assumption was
// sometimes a false statement about someone's money. These cover the four
// answers the provider can give.
// ---------------------------------------------------------------------------

/** A stuck order that DID open a payment session, so the provider is consulted. */
function stuckOrderWithSession() {
  return { ...stuckOrder(), mpesaCheckoutRequestId: 'ws_CO_sim_abc123' };
}

describe('reconcileStuckPayments — asking before concluding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListingFindByIdAndUpdate.mockResolvedValue({});
    mockPaymentLogCreate.mockResolvedValue({});
  });

  it('credits an order the buyer actually paid for, instead of failing it', async () => {
    // The limbo payment: debited, callback lost. Failing this order would take
    // the buyer's money AND put their produce back on sale.
    wireFind([stuckOrderWithSession()]);
    mockQueryPaymentStatus.mockResolvedValue({
      state: 'SUCCESS',
      resultCode: 0,
      mpesaReceiptNumber: 'QGR1ABCD23',
    });
    mockProcessStkCallback.mockResolvedValue({ processed: true, ack: {} });

    const count = await reconcileStuckPayments();

    expect(count).toBe(1);
    // Routed through the ordinary callback path so a recovered payment lands
    // exactly like one that arrived on time.
    expect(mockProcessStkCallback).toHaveBeenCalled();
    const [payload] = mockProcessStkCallback.mock.calls[0] as [
      { Body: { stkCallback: { ResultCode: number } } },
    ];
    expect(payload.Body.stkCallback.ResultCode).toBe(0);
    // It must NOT have been failed or had its stock returned.
    expect(mockOrderFindOneAndUpdate).not.toHaveBeenCalled();
    expect(mockListingFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('records an unknown outcome as unresolved, and keeps the produce reserved', async () => {
    wireFind([stuckOrderWithSession()]);
    mockQueryPaymentStatus.mockResolvedValue({ state: 'UNKNOWN' });
    mockOrderFindOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: ORDER_ID }),
    });

    const count = await reconcileStuckPayments();

    expect(count).toBe(1);
    expect(mockOrderFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: ORDER_ID, paymentStatus: 'PENDING_PAYMENT' },
      { $set: { paymentStatus: 'UNRESOLVED' } },
      { new: true }
    );
    // If the buyer WAS debited, this produce is theirs. Selling it to someone
    // else while the question is open turns one unknown into a second wrong.
    expect(mockListingFindByIdAndUpdate).not.toHaveBeenCalled();
    expect(mockPaymentLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'UNRESOLVED',
        actor: 'SYSTEM',
        previousStatus: 'PENDING_PAYMENT',
        newStatus: 'UNRESOLVED',
        // The reason must not claim the payment failed — that is the one
        // sentence this state exists to avoid writing.
        reason: expect.stringContaining('could not say whether the buyer was charged'),
      })
    );
    // An administrator has to settle it by hand.
    expect(mockNotifyAdmins).toHaveBeenCalled();
  });

  it('never tells a buyer their money is safe when the outcome is unknown', async () => {
    wireFind([stuckOrderWithSession()]);
    mockQueryPaymentStatus.mockResolvedValue({ state: 'UNKNOWN' });
    mockOrderFindOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: ORDER_ID }),
    });

    await reconcileStuckPayments();

    const [msg] = mockNotify.mock.calls[0] as [{ title: string; body: string }];
    expect(msg.title).toBe('We are checking your payment');
    expect(msg.body).not.toMatch(/no money left your account/i);
    expect(msg.body).toMatch(/check your M-Pesa messages/i);
  });

  it('leaves a payment still in flight completely alone', async () => {
    wireFind([stuckOrderWithSession()]);
    mockQueryPaymentStatus.mockResolvedValue({ state: 'PENDING' });

    const count = await reconcileStuckPayments();

    expect(count).toBe(0);
    expect(mockOrderFindOneAndUpdate).not.toHaveBeenCalled();
    expect(mockListingFindByIdAndUpdate).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('closes out an established failure, where the old message is now true', async () => {
    wireFind([stuckOrderWithSession()]);
    mockQueryPaymentStatus.mockResolvedValue({
      state: 'FAILED',
      resultCode: 1032,
      resultDesc: 'Request cancelled by user.',
    });
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
    expect(mockListingFindByIdAndUpdate).toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Payment not completed' })
    );
  });

  it('does not interrogate a provider about an order that never opened a session', async () => {
    wireFind([stuckOrder()]);
    mockOrderFindOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: ORDER_ID }),
    });

    await reconcileStuckPayments();

    expect(mockQueryPaymentStatus).not.toHaveBeenCalled();
  });
});
