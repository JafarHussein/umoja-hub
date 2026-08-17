import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import User from '@/lib/models/User.model';
import PaymentEventLog from '@/lib/models/PaymentEventLog.model';
import { sendSMS } from '@/lib/integrations/smsService';
import { notify } from '@/lib/notifications/notify';
import { logger } from '@/lib/utils';
import { env } from '@/lib/env';
import type { DarajaCallbackInput } from '@/lib/validation/orderSchema';
import {
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  ListingStatus,
  PaymentEventActor,
  PaymentEventType,
  NotificationType,
} from '@/types';

// Result codes Safaricom returns, in the words the audit should carry. A log
// that records only "FAILED, code 1032" makes the reader go and look 1032 up;
// one that says the buyer cancelled on their handset does not.
const FAILURE_REASON: Record<number, string> = {
  1: 'The buyer did not have enough money in their M-Pesa account.',
  1001: 'Another M-Pesa transaction was already in progress on the same line.',
  1025: 'M-Pesa could not process the request.',
  1032: 'The buyer cancelled the prompt on their handset.',
  1037: 'The buyer could not be reached and the prompt expired.',
};

// ---------------------------------------------------------------------------
// Shared STK-callback processor.
//
// This is the single source of truth for what a payment callback DOES to the
// system: find the order, branch on success/failure, enforce idempotency,
// transition order + inventory state, notify both parties, and append an audit
// event. Both the real Daraja webhook (`/api/webhooks/daraja`) and the payment
// simulator feed identical Daraja-shaped payloads through this function, so the
// order system can never tell which provider generated the event.
// ---------------------------------------------------------------------------

export interface ProcessCallbackOptions {
  /** Provider that produced this callback (for the audit trail). */
  provider: string;
  /** Correlates the event chain in logs. */
  requestId?: string;
}

export interface ProcessCallbackResult {
  /** The body to acknowledge with (Daraja-shaped). */
  ack: { ResultCode: number; ResultDesc: string };
  /** True when the order transitioned (paid or failed) on this call. */
  processed: boolean;
}

async function recordEvent(fields: {
  provider: string;
  eventType: PaymentEventType;
  orderId?: unknown;
  buyerId?: unknown;
  farmerId?: unknown;
  amount?: number;
  paymentReference?: string;
  checkoutRequestId?: string;
  resultCode?: number;
  processingTimeMs?: number;
  actor?: PaymentEventActor;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  correlationId?: string;
}): Promise<void> {
  try {
    const event = new PaymentEventLog();
    event.set({ ...fields, occurredAt: new Date() });
    await event.save();
  } catch (err) {
    logger.error('payments', 'Failed to write PaymentEventLog', { err });
  }
}

export async function processStkCallback(
  callback: DarajaCallbackInput,
  opts: ProcessCallbackOptions
): Promise<ProcessCallbackResult> {
  const ack = { ResultCode: 0, ResultDesc: 'Acknowledged' };
  const { provider, requestId } = opts;
  const { CheckoutRequestID, ResultCode, CallbackMetadata } = callback.Body.stkCallback;

  await connectDB();

  const order = await Order.findOne({ mpesaCheckoutRequestId: CheckoutRequestID });
  if (!order) {
    logger.warn('payments', 'No order found for CheckoutRequestID', {
      requestId,
      provider,
      CheckoutRequestID,
    });
    return { ack, processed: false };
  }

  const processingTimeMs = Date.now() - new Date(order.createdAt).getTime();

  // The status this callback found the order in. Read once, before anything is
  // written, so every event below records the transition it actually caused
  // rather than the state left behind by the event before it.
  const statusBefore = String(order.paymentStatus);

  await recordEvent({
    provider,
    eventType: PaymentEventType.CALLBACK_RECEIVED,
    orderId: order._id,
    buyerId: order.buyerId,
    farmerId: order.farmerId,
    amount: order.totalAmountKES,
    checkoutRequestId: CheckoutRequestID,
    resultCode: ResultCode,
    actor: PaymentEventActor.PROVIDER,
    // Arrival moves nothing on its own. The transition belongs to the SUCCESS
    // or FAILED row that follows, and saying so keeps this from reading like a
    // state change that was then contradicted.
    previousStatus: statusBefore,
    newStatus: statusBefore,
    reason: 'M-Pesa delivered a result for this payment session.',
    ...(requestId ? { correlationId: requestId } : {}),
  });

  // ── Failure path — restore inventory, alert admin ──────────────────────────
  if (ResultCode !== 0) {
    const { default: MarketplaceListing } = await import('@/lib/models/MarketplaceListing.model');
    await Promise.all([
      Order.findByIdAndUpdate(order._id, { paymentStatus: OrderPaymentStatus.FAILED }),
      MarketplaceListing.findByIdAndUpdate(order.listingId, {
        $inc: { quantityAvailable: order.quantityOrdered },
        listingStatus: ListingStatus.AVAILABLE,
      }),
    ]);

    logger.info('payments', 'Payment failed or cancelled — inventory restored', {
      requestId,
      provider,
      CheckoutRequestID,
      ResultCode,
      orderId: String(order._id),
      quantityRestored: order.quantityOrdered,
    });

    sendSMS(
      env('ADMIN_PHONE_NUMBER'),
      `UmojaHub: Payment FAILED. Order ${order.orderReferenceId} (${order.cropName}, KSh ${order.totalAmountKES}). Result code: ${ResultCode}.`
    ).catch(() => {});

    await recordEvent({
      provider,
      // 1037 is the Daraja "DS timeout / user cannot be reached" code.
      eventType: ResultCode === 1037 ? PaymentEventType.TIMEOUT : PaymentEventType.FAILED,
      orderId: order._id,
      buyerId: order.buyerId,
      farmerId: order.farmerId,
      amount: order.totalAmountKES,
      paymentReference: order.orderReferenceId,
      checkoutRequestId: CheckoutRequestID,
      resultCode: ResultCode,
      processingTimeMs,
      // The buyer when they cancelled it themselves; M-Pesa when the network
      // or the handset ended it. Both are failures and only one is a decision.
      actor: ResultCode === 1032 ? PaymentEventActor.BUYER : PaymentEventActor.PROVIDER,
      previousStatus: statusBefore,
      newStatus: OrderPaymentStatus.FAILED,
      reason:
        FAILURE_REASON[ResultCode] ??
        `M-Pesa rejected the payment with result code ${ResultCode}.`,
      ...(requestId ? { correlationId: requestId } : {}),
    });

    return { ack, processed: true };
  }

  // ── Success path ───────────────────────────────────────────────────────────
  const receiptItem = CallbackMetadata?.Item.find((item) => item.Name === 'MpesaReceiptNumber');
  const MpesaReceiptNumber = receiptItem?.Value ? String(receiptItem.Value) : null;

  if (!MpesaReceiptNumber) {
    logger.error('payments', 'MpesaReceiptNumber missing from successful callback', {
      requestId,
      provider,
      CheckoutRequestID,
    });
    return { ack, processed: false };
  }

  // Idempotency — duplicate callbacks (Daraja retries, or a simulated duplicate)
  // must not double-process. The unique sparse index on mpesaTransactionId is the
  // hard guard; this check makes it a clean no-op.
  const existingOrder = await Order.findOne({ mpesaTransactionId: MpesaReceiptNumber });
  if (existingOrder) {
    logger.warn('payments', 'Duplicate callback received — already processed', {
      requestId,
      provider,
      MpesaReceiptNumber,
    });
    await recordEvent({
      provider,
      eventType: PaymentEventType.DUPLICATE,
      orderId: order._id,
      buyerId: order.buyerId,
      farmerId: order.farmerId,
      amount: order.totalAmountKES,
      paymentReference: MpesaReceiptNumber,
      checkoutRequestId: CheckoutRequestID,
      resultCode: ResultCode,
      actor: PaymentEventActor.PROVIDER,
      // Nothing moved, and the row exists to prove that. A duplicate that left
      // no trace would be indistinguishable from one that was never sent.
      previousStatus: String(existingOrder.paymentStatus),
      newStatus: String(existingOrder.paymentStatus),
      reason: `Receipt ${MpesaReceiptNumber} was already recorded against this order. Ignored so the payment is not counted twice.`,
      ...(requestId ? { correlationId: requestId } : {}),
    });
    return { ack: { ResultCode: 0, ResultDesc: 'Already processed' }, processed: false };
  }

  await Order.findByIdAndUpdate(order._id, {
    paymentStatus: OrderPaymentStatus.PAID,
    fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
    mpesaTransactionId: MpesaReceiptNumber,
    paidAt: new Date(),
  });

  logger.info('payments', 'Payment confirmed and order updated', {
    requestId,
    provider,
    orderId: String(order._id),
    MpesaReceiptNumber,
    farmerId: String(order.farmerId),
  });

  await recordEvent({
    provider,
    eventType: PaymentEventType.SUCCESS,
    orderId: order._id,
    buyerId: order.buyerId,
    farmerId: order.farmerId,
    amount: order.totalAmountKES,
    paymentReference: MpesaReceiptNumber,
    checkoutRequestId: CheckoutRequestID,
    resultCode: ResultCode,
    processingTimeMs,
    // The buyer authorised it. M-Pesa carried the message, but the act that
    // moved the money was a PIN entered on a handset.
    actor: PaymentEventActor.BUYER,
    previousStatus: statusBefore,
    newStatus: OrderPaymentStatus.PAID,
    reason: `The buyer authorised the payment on their handset. M-Pesa receipt ${MpesaReceiptNumber}. The funds are now held in escrow.`,
    ...(requestId ? { correlationId: requestId } : {}),
  });

  // Funds are now held in escrow on the farmer's behalf — append the milestone.
  try {
    const { default: EscrowEventLog } = await import('@/lib/models/EscrowEventLog.model');
    const { EscrowEventType } = await import('@/types');
    await EscrowEventLog.create({
      eventType: EscrowEventType.HELD,
      orderId: order._id,
      buyerId: order.buyerId,
      farmerId: order.farmerId,
      amountKES: order.totalAmountKES,
      actorRole: 'SYSTEM',
      occurredAt: new Date(),
    });
  } catch (err) {
    logger.error('payments', 'Failed to write escrow HELD event', { requestId, provider, err });
  }

  // Notifications — identical to the production path (non-blocking).
  (async () => {
    try {
      const [farmer, buyer] = await Promise.all([
        User.findById(order.farmerId).select('firstName phoneNumber').lean(),
        User.findById(order.buyerId).select('firstName phoneNumber').lean(),
      ]);

      if (farmer) {
        await sendSMS(
          farmer.phoneNumber,
          `UmojaHub: New order confirmed! Order ${order.orderReferenceId} for ${order.cropName} is paid — the funds are held in escrow and released to you once the buyer confirms receipt. Please prepare for fulfillment.`
        );
        void notify({
          userId: order.farmerId,
          type: NotificationType.ESCROW_UPDATE,
          title: 'New order paid — funds held in escrow',
          body: `Order ${order.orderReferenceId} for ${order.cropName} is paid. The funds are held in escrow and released to you once the buyer confirms receipt.`,
          relatedEntity: { kind: 'Order', id: order._id },
        });
      }
      if (buyer) {
        // Deliberately NO SMS to the buyer here.
        //
        // They entered their M-Pesa PIN seconds ago and Safaricom has already
        // sent them a confirmation SMS carrying the authoritative receipt code.
        // A second SMS saying the same thing arrives moments later, costs the
        // platform money, and teaches people that UmojaHub's messages repeat
        // what they already know — which is how a channel stops being read.
        //
        // The escrow half IS ours to say, because Safaricom's message says
        // nothing about the money being held. But it is not urgent in the way
        // the farmer's is: the buyer has no action to take, was told at
        // checkout, and reads it in the app and by email. The farmer, by
        // contrast, is not party to the STK push at all and gets no Safaricom
        // SMS — theirs is the only immediate signal that money has arrived and
        // the dispatch clock has started, which is why it stays.
        void notify({
          userId: order.buyerId,
          type: NotificationType.ORDER_UPDATE,
          title: 'Payment confirmed — protected in escrow',
          body: `Your KSh ${order.totalAmountKES} for order ${order.orderReferenceId} is protected in escrow and released to the farmer only when you confirm you've received your ${order.cropName}.`,
          relatedEntity: { kind: 'Order', id: order._id },
        });
      }
    } catch (err) {
      logger.error('payments', 'SMS notification failed after payment', {
        requestId,
        provider,
        orderId: String(order._id),
        err,
      });
    }
  })().catch(() => {});

  return { ack: { ResultCode: 0, ResultDesc: 'Success' }, processed: true };
}
