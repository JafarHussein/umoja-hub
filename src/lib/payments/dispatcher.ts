import mongoose from 'mongoose';
import SimulatedPayment, { type SimulatedPaymentDoc } from '@/lib/models/SimulatedPayment.model';
import PaymentEventLog from '@/lib/models/PaymentEventLog.model';
import { connectDB } from '@/lib/db';
import { logger } from '@/lib/utils';
import { processStkCallback } from '@/lib/payments/processCallback';
import { buildCallbackPayload } from '@/lib/payments/callbackPayload';
import { SimulatedOutcome, SimulatedPaymentStatus, PaymentEventType } from '@/types';

// ---------------------------------------------------------------------------
// Simulated-callback dispatcher.
//
// Serverless-native delivery with no background worker: scheduled simulated
// callbacks are delivered when (a) the buyer's payment-status poll runs, (b) the
// 15-min reconciliation cron sweeps, or (c) an admin triggers it from the
// Payment Lab — all three call dispatchDuePayments(). Each delivery builds a
// Daraja-shaped payload and feeds it through processStkCallback (the same path
// the real webhook uses). LOST callbacks are never delivered, leaving the order
// to be reconciled by the stuck-payment cron — exactly like a dropped callback.
// ---------------------------------------------------------------------------

const PROVIDER = 'simulation';

type SimDoc = mongoose.HydratedDocument<SimulatedPaymentDoc>;

/** Deliver one scheduled simulated payment through the shared processor. */
export async function deliverSimulatedPayment(sim: SimDoc): Promise<void> {
  // LOST: never delivered. Mark it so it stops being scanned and record the
  // event; the order stays PENDING_PAYMENT for the reconciliation cron.
  if (sim.outcome === SimulatedOutcome.LOST) {
    sim.status = SimulatedPaymentStatus.LOST;
    sim.deliveredAt = new Date();
    await sim.save();
    try {
      const event = new PaymentEventLog();
      event.set({
        provider: PROVIDER,
        eventType: PaymentEventType.LOST,
        orderId: sim.orderId,
        buyerId: sim.buyerId,
        farmerId: sim.farmerId,
        amount: sim.amount,
        checkoutRequestId: sim.checkoutRequestId,
        occurredAt: new Date(),
      });
      await event.save();
    } catch {
      // best-effort audit
    }
    logger.info('payments', 'Simulated callback dropped (LOST)', {
      checkoutRequestId: sim.checkoutRequestId,
    });
    return;
  }

  const payload = buildCallbackPayload({
    outcome: sim.outcome,
    checkoutRequestId: sim.checkoutRequestId,
    merchantRequestId: sim.merchantRequestId,
    amount: sim.amount,
    mpesaReceiptNumber: sim.mpesaReceiptNumber ?? null,
  });

  const start = Date.now();
  await processStkCallback(payload, { provider: PROVIDER });
  // Duplicate delivery — exercises the webhook's idempotency guard.
  if (sim.duplicate) {
    await processStkCallback(payload, { provider: PROVIDER });
  }

  sim.status = SimulatedPaymentStatus.DELIVERED;
  sim.deliveredAt = new Date();
  sim.deliveryAttempts = (sim.deliveryAttempts ?? 0) + (sim.duplicate ? 2 : 1);
  sim.resultCode = payload.Body.stkCallback.ResultCode;
  sim.processingTimeMs = Date.now() - start;
  await sim.save();
}

/**
 * Deliver all due simulated callbacks. Scoped to one order (poll-lazy path) or
 * swept in a capped batch (cron). Safe to call when not in simulation mode — it
 * simply finds nothing.
 */
export async function dispatchDuePayments(opts?: {
  orderId?: string;
  limit?: number;
}): Promise<number> {
  await connectDB();

  const filter: Record<string, unknown> = {
    status: SimulatedPaymentStatus.SCHEDULED,
    deliverAt: { $lte: new Date() },
  };
  if (opts?.orderId) filter['orderId'] = opts.orderId;

  const due = await SimulatedPayment.find(filter)
    .sort({ deliverAt: 1 })
    .limit(opts?.limit ?? 25);

  let delivered = 0;
  for (const sim of due) {
    try {
      await deliverSimulatedPayment(sim);
      delivered += 1;
    } catch (err) {
      logger.error('payments', 'Failed to deliver simulated callback', {
        checkoutRequestId: sim.checkoutRequestId,
        err,
      });
    }
  }
  return delivered;
}
