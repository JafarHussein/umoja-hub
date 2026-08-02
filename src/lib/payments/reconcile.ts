import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import MarketplaceListing from '@/lib/models/MarketplaceListing.model';
import PaymentEventLog from '@/lib/models/PaymentEventLog.model';
import { notify } from '@/lib/notifications/notify';
import { logger } from '@/lib/utils';
import { getActiveProviderName } from '@/lib/payments/active';
import {
  ListingStatus,
  NotificationType,
  OrderPaymentStatus,
  PaymentEventType,
} from '@/types';

// ---------------------------------------------------------------------------
// Stuck-payment reconciliation.
//
// A payment whose callback never arrives leaves an order stranded in
// PENDING_PAYMENT with its stock reserved. Reconciliation is what closes that
// out: mark the payment FAILED, return the produce to the marketplace, record
// the fact, and tell the buyer so they can retry.
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

/** How long a payment may sit unconfirmed before it is considered timed out. */
export const STUCK_PAYMENT_TIMEOUT_MINUTES = 15;

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
    .select('_id orderReferenceId listingId quantityOrdered cropName buyerId farmerId totalAmountKES')
    .limit(opts?.limit ?? 20)
    .lean();

  let reconciled = 0;

  for (const order of stuck) {
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
