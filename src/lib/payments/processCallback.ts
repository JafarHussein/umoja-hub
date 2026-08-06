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
  PaymentEventType,
  NotificationType,
} from '@/types';

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

  await recordEvent({
    provider,
    eventType: PaymentEventType.CALLBACK_RECEIVED,
    orderId: order._id,
    buyerId: order.buyerId,
    farmerId: order.farmerId,
    amount: order.totalAmountKES,
    checkoutRequestId: CheckoutRequestID,
    resultCode: ResultCode,
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
