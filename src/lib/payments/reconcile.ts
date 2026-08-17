import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import MarketplaceListing from '@/lib/models/MarketplaceListing.model';
import PaymentEventLog from '@/lib/models/PaymentEventLog.model';
import { notify, notifyAdmins } from '@/lib/notifications/notify';
import { logger } from '@/lib/utils';
import { getActiveProviderName } from '@/lib/payments/active';
import { getPaymentProvider } from '@/lib/payments';
import type { PaymentQueryResult } from '@/lib/payments/types';
import {
  ListingStatus,
  NotificationType,
  OrderPaymentStatus,
  PaymentEventActor,
  PaymentEventType,
  STUCK_PAYMENT_TIMEOUT_MINUTES,
} from '@/types';

// ---------------------------------------------------------------------------
// Stuck-payment reconciliation.
//
// A payment whose callback never arrives leaves an order stranded in
// PENDING_PAYMENT with its stock reserved. Reconciliation closes that out.
//
// It used to close it out by ASSUMING the payment had failed: mark FAILED,
// return the produce, and tell the buyer "No money left your account." That
// assumption is not safe. An STK callback can go missing while the debit
// succeeded — the server may have been briefly unreachable, or Safaricom under
// load at month-end — and the buyer is then told their money is safe while it
// is gone, and the produce they paid for is put back on sale.
//
// So reconciliation now ASKS. `queryPaymentStatus` is the third leg of the STK
// lifecycle and exists for exactly this question. Four answers, four different
// truths:
//
//   SUCCESS  the debit was real and only the notification was lost — credit the
//            order through the ordinary callback path, as if it had arrived
//   FAILED   established failure — close it out and the old message is now true
//   PENDING  still in flight — conclude nothing, look again later
//   UNKNOWN  the provider cannot tell us — record UNRESOLVED, keep the stock
//            reserved, and put it in front of an administrator. Never say the
//            money is safe when we do not know that.
//
// Triggering — deliberately NOT cron-frequency-dependent. Vercel Hobby permits
// only daily cron invocations and only two cron jobs in total, so a sweep on a
// schedule alone would leave stock reserved for up to 24 hours. This mirrors
// the delivery model already used for simulated callbacks (see dispatcher.ts):
//   (a) the buyer's payment-status poll, scoped to their own order — the common
//       case, resolving within seconds of the timeout;
//   (b) the daily cron sweep, as the unscoped backstop for orders nobody is
//       watching.
// Both call this function; it is idempotent and safe to call repeatedly.
// ---------------------------------------------------------------------------

/**
 * How long a payment may sit unconfirmed before we go and ask about it.
 *
 * Defined in `@/types` and re-exported here, where it is used, because the
 * Payment Lab tells operators the same number and is a client component —
 * importing it from this module would drag mongoose and the DB singleton into
 * the browser bundle. Fifteen minutes was inherited and never justified; it was
 * safe only because the sweep assumed failure and so wanted a wide margin of
 * error. Now that the sweep asks the provider instead of guessing, the margin
 * is no longer doing any work. See the definition for the reasoning behind 5.
 */
export { STUCK_PAYMENT_TIMEOUT_MINUTES } from '@/types';

/** The fields the reconciliation handlers need off an order. */
interface StuckOrder {
  _id: mongoose.Types.ObjectId;
  orderReferenceId: string;
  listingId: mongoose.Types.ObjectId;
  quantityOrdered: number;
  cropName: string;
  buyerId: mongoose.Types.ObjectId;
  farmerId: mongoose.Types.ObjectId;
  totalAmountKES: number;
  mpesaCheckoutRequestId?: string | null;
}

/**
 * The debit was real; only the callback was lost. Replay it.
 *
 * Deliberately routed through processStkCallback rather than writing the PAID
 * transition here. That function is the single definition of what a successful
 * payment DOES — hold the funds, notify both parties, write the audit row — and
 * a recovered payment must land the same way as one that arrived on time, or
 * the two paths will drift and only one of them will be tested.
 */
async function creditRecoveredPayment(
  order: StuckOrder,
  answer: Extract<PaymentQueryResult, { state: 'SUCCESS' }>,
  correlationId: string
): Promise<boolean> {
  const { processStkCallback } = await import('@/lib/payments/processCallback');

  logger.warn('payments', 'Recovered a paid order whose callback never arrived', {
    orderId: String(order._id),
    orderRef: order.orderReferenceId,
  });

  const result = await processStkCallback(
    {
      Body: {
        stkCallback: {
          MerchantRequestID: `recovered-${order.orderReferenceId}`,
          CheckoutRequestID: order.mpesaCheckoutRequestId ?? '',
          ResultCode: 0,
          ResultDesc: 'Recovered by reconciliation from the provider query.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: order.totalAmountKES },
              { Name: 'MpesaReceiptNumber', Value: answer.mpesaReceiptNumber ?? '' },
            ],
          },
        },
      },
    },
    { provider: getActiveProviderName(), requestId: correlationId }
  );

  return result.processed;
}

/**
 * We asked and could not find out. Say so, and hold everything still.
 *
 * The stock is deliberately NOT returned to the marketplace. If the buyer was
 * in fact debited, this produce is theirs, and selling it to someone else while
 * the question is open would turn an unknown into a second wrong.
 */
async function flagUnresolvedPayment(
  order: StuckOrder,
  correlationId: string
): Promise<boolean> {
  const closed = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: OrderPaymentStatus.PENDING_PAYMENT },
    { $set: { paymentStatus: OrderPaymentStatus.UNRESOLVED } },
    { new: true }
  ).lean();

  if (!closed) return false;

  try {
    await PaymentEventLog.create({
      provider: getActiveProviderName(),
      eventType: PaymentEventType.UNRESOLVED,
      orderId: order._id,
      buyerId: order.buyerId,
      farmerId: order.farmerId,
      amount: order.totalAmountKES,
      paymentReference: order.orderReferenceId,
      actor: PaymentEventActor.SYSTEM,
      previousStatus: OrderPaymentStatus.PENDING_PAYMENT,
      newStatus: OrderPaymentStatus.UNRESOLVED,
      reason:
        'No callback arrived within the timeout, and the provider could not say whether the buyer was charged. The produce stays reserved and an administrator must settle it by hand.',
      correlationId,
      occurredAt: new Date(),
    });
  } catch (err) {
    logger.error('payments', 'Failed to write UNRESOLVED event', {
      orderId: String(order._id),
      err,
    });
  }

  // No promise about where the money is, because we do not know.
  void notify({
    userId: String(order.buyerId),
    type: NotificationType.ORDER_UPDATE,
    title: 'We are checking your payment',
    body: `We did not get a confirmation from M-Pesa for order ${order.orderReferenceId} (${order.cropName}), so we are checking whether your payment went through. Please do not pay again yet. Check your M-Pesa messages — if KSh ${order.totalAmountKES.toLocaleString()} left your account, UmojaHub will complete this order. If it did not, we will close the order and release the produce.`,
    relatedEntity: { kind: 'Order', id: String(order._id) },
  });

  void notifyAdmins({
    type: NotificationType.ORDER_UPDATE,
    title: 'Payment could not be resolved',
    body: `Order ${order.orderReferenceId} (KSh ${order.totalAmountKES.toLocaleString()}) timed out and M-Pesa could not confirm whether the buyer was charged. The produce is still reserved. Check the M-Pesa statement and settle the order by hand.`,
    relatedEntity: { kind: 'Order', id: String(order._id) },
  });

  logger.warn('payments', 'Payment outcome unresolved — raised to admin', {
    orderId: String(order._id),
    orderRef: order.orderReferenceId,
  });

  return true;
}

/**
 * Reconcile timed-out payments. Scoped to one order (the lazy path) or swept in
 * a capped batch (the cron). Returns how many orders were reconciled.
 */
export async function reconcileStuckPayments(opts?: {
  orderId?: string;
  limit?: number;
}): Promise<number> {
  await connectDB();

  const cutoff = new Date(Date.now() - STUCK_PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

  // The clock runs from the current payment session, not the order's creation —
  // a retry reopens the session on an order that may be days old. Orders
  // predating paymentRequestedAt fall back to createdAt.
  const staleFilter = {
    $or: [
      { paymentRequestedAt: { $lt: cutoff } },
      { paymentRequestedAt: { $exists: false }, createdAt: { $lt: cutoff } },
    ],
  };

  const filter: Record<string, unknown> = {
    paymentStatus: OrderPaymentStatus.PENDING_PAYMENT,
    ...staleFilter,
  };
  if (opts?.orderId) filter['_id'] = opts.orderId;

  const stuck = await Order.find(filter)
    .select(
      '_id orderReferenceId listingId quantityOrdered cropName buyerId farmerId totalAmountKES mpesaCheckoutRequestId'
    )
    .limit(opts?.limit ?? 20)
    .lean();

  let reconciled = 0;

  for (const order of stuck) {
    // One id per order reconciled, threading the query, whatever it concluded,
    // and — on the recovery path — the replayed callback and its escrow hold
    // into a single retrievable chain. Per order rather than per sweep: an
    // investigation is always about one payment, never about the batch that
    // happened to contain it.
    const correlationId = crypto.randomUUID();

    // Ask before concluding. Without a payment session there is nothing to ask
    // about, and an order that never reached the provider genuinely did not pay.
    const answer: PaymentQueryResult = order.mpesaCheckoutRequestId
      ? await getPaymentProvider().queryPaymentStatus(order.mpesaCheckoutRequestId)
      : { state: 'FAILED', resultCode: 0, resultDesc: 'No payment session was ever opened.' };

    // Still with the buyer. Leave it exactly as it is.
    if (answer.state === 'PENDING') continue;

    // The debit went through and only the notification was lost. Credit the
    // order through the ordinary callback path so it lands identically to one
    // that arrived on time — same idempotency, same escrow hold, same
    // notifications, same audit trail.
    if (answer.state === 'SUCCESS') {
      const recovered = await creditRecoveredPayment(order, answer, correlationId);
      if (recovered) reconciled += 1;
      continue;
    }

    // We asked and could not find out. This is the case that must never be
    // dressed up as a failure: the stock stays reserved, the buyer is told the
    // truth, and an administrator is asked to settle it by hand.
    if (answer.state === 'UNKNOWN') {
      const flagged = await flagUnresolvedPayment(order, correlationId);
      if (flagged) reconciled += 1;
      continue;
    }

    // Guarded transition — a callback landing at this instant wins, and the
    // reconciliation becomes a no-op rather than failing a real payment.
    const closed = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: OrderPaymentStatus.PENDING_PAYMENT },
      { $set: { paymentStatus: OrderPaymentStatus.FAILED } },
      { new: true }
    ).lean();

    if (!closed) continue;

    await MarketplaceListing.findByIdAndUpdate(order.listingId, {
      $inc: { quantityAvailable: order.quantityOrdered },
      listingStatus: ListingStatus.AVAILABLE,
    });

    // Until now this transition happened silently. RECONCILED exists precisely
    // for it, so the trail shows the platform closed the payment out rather
    // than the network reporting a failure.
    try {
      await PaymentEventLog.create({
        provider: getActiveProviderName(),
        eventType: PaymentEventType.RECONCILED,
        orderId: order._id,
        buyerId: order.buyerId,
        farmerId: order.farmerId,
        amount: order.totalAmountKES,
        paymentReference: order.orderReferenceId,
        actor: PaymentEventActor.SYSTEM,
        previousStatus: OrderPaymentStatus.PENDING_PAYMENT,
        newStatus: OrderPaymentStatus.FAILED,
        // The provider's own words for why, not our summary of them. This is
        // the row that justifies returning the produce to the marketplace.
        reason: `No callback arrived within the timeout. The provider confirmed the payment did not go through: ${answer.resultDesc}`,
        correlationId,
        occurredAt: new Date(),
      });
    } catch (err) {
      logger.error('payments', 'Failed to write RECONCILED event', {
        orderId: String(order._id),
        err,
      });
    }

    void notify({
      userId: String(order.buyerId),
      type: NotificationType.ORDER_UPDATE,
      title: 'Payment not completed',
      body: `We did not receive payment for order ${order.orderReferenceId} (${order.cropName}), so it has been closed and the produce returned to the marketplace. No money left your account — you can try paying again from the order.`,
      relatedEntity: { kind: 'Order', id: String(order._id) },
    });

    logger.info('payments', 'Reconciled stuck payment order', {
      orderId: String(order._id),
      orderRef: order.orderReferenceId,
      quantityRestored: order.quantityOrdered,
    });

    reconciled += 1;
  }

  return reconciled;
}
