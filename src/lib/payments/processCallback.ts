import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import User from '@/lib/models/User.model';
import PaymentEventLog from '@/lib/models/PaymentEventLog.model';
import { sendSMS } from '@/lib/integrations/smsService';
import { logger } from '@/lib/utils';
import { env } from '@/lib/env';
import type { DarajaCallbackInput } from '@/lib/validation/orderSchema';
import {
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  ListingStatus,
  PaymentEventType,
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
      `UmojaHub: Payment FAILED. Order ${order.orderReferenceId} (${order.cropName}, KES ${order.totalAmountKES}). Result code: ${ResultCode}.`
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
          `UmojaHub: New order confirmed! Order ${order.orderReferenceId} for ${order.cropName} has been paid. Please prepare for fulfillment.`
        );
      }
      if (buyer) {
        await sendSMS(
          buyer.phoneNumber,
          `UmojaHub: Payment confirmed! Your order ${order.orderReferenceId} (KES ${order.totalAmountKES}) has been received. The farmer will prepare your ${order.cropName}.`
        );
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
