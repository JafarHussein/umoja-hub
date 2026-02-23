import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import User from '@/lib/models/User.model';
import { darajaCallbackSchema } from '@/lib/validation/orderSchema';
import { verifyDarajaSignature } from '@/lib/integrations/darajaService';
import { sendSMS } from '@/lib/integrations/smsService';
import { logger } from '@/lib/utils';
import { OrderPaymentStatus, OrderFulfillmentStatus } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/webhooks/daraja — M-Pesa STK Push callback from Safaricom
// Auth: Daraja signature verification (not session-based)
// CRITICAL: Always return HTTP 200 — Daraja retries indefinitely on non-200
// Idempotency: unique sparse index on mpesaTransactionId prevents duplicate writes
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Always return 200 to Safaricom, even on errors
  const ack = { ResultCode: 0, ResultDesc: 'Acknowledged' };

  try {
    const body: unknown = await req.json();

    // Step 1: Verify signature (always first)
    const isValid = verifyDarajaSignature(req.headers, body);
    if (!isValid) {
      logger.error('daraja', 'Invalid webhook signature', { body });
      // Return 200 with non-zero ResultCode — Daraja will stop retrying
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid signature' });
    }

    // Step 2: Validate payload schema
    const parsed = darajaCallbackSchema.safeParse(body);
    if (!parsed.success) {
      logger.error('daraja', 'Invalid webhook payload schema', {
        error: parsed.error.flatten(),
      });
      return NextResponse.json(ack); // Ack to prevent retries
    }

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = parsed.data.Body.stkCallback;

    await connectDB();

    // Step 3: Find order by checkout request ID
    const order = await Order.findOne({ mpesaCheckoutRequestId: CheckoutRequestID });
    if (!order) {
      logger.warn('daraja', 'No order found for CheckoutRequestID', { CheckoutRequestID });
      return NextResponse.json(ack);
    }

    // Step 4: Handle payment failure (ResultCode !== 0)
    if (ResultCode !== 0) {
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: OrderPaymentStatus.FAILED,
      });
      logger.info('daraja', 'Payment failed or cancelled', {
        CheckoutRequestID,
        ResultCode,
        orderId: String(order._id),
      });
      return NextResponse.json(ack);
    }

    // Step 5: Extract MpesaReceiptNumber from CallbackMetadata
    const receiptItem = CallbackMetadata?.Item.find((item) => item.Name === 'MpesaReceiptNumber');
    const MpesaReceiptNumber = receiptItem?.Value ? String(receiptItem.Value) : null;

    if (!MpesaReceiptNumber) {
      logger.error('daraja', 'MpesaReceiptNumber missing from successful callback', {
        CheckoutRequestID,
      });
      return NextResponse.json(ack);
    }

    // Step 6: Idempotency check — has this transaction been processed before?
    const existingOrder = await Order.findOne({ mpesaTransactionId: MpesaReceiptNumber });
    if (existingOrder) {
      logger.warn('daraja', 'Duplicate webhook received — already processed', {
        MpesaReceiptNumber,
      });
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Already processed' });
    }

    // Step 7: Update order — this is the only write
    await Order.findByIdAndUpdate(order._id, {
      paymentStatus: OrderPaymentStatus.PAID,
      fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
      mpesaTransactionId: MpesaReceiptNumber,
      paidAt: new Date(),
    });

    logger.info('daraja', 'Payment confirmed and order updated', {
      orderId: String(order._id),
      MpesaReceiptNumber,
      farmerId: String(order.farmerId),
    });

    // Step 8: Send SMS notifications (non-blocking side effects)
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
        logger.error('daraja', 'SMS notification failed after payment', {
          orderId: String(order._id),
          err,
        });
      }
    })().catch(() => {
      // Already logged above
    });

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    logger.error('daraja', 'Unexpected error in webhook handler', { error });
    // CRITICAL: Still return 200 to prevent Daraja retries
    return NextResponse.json(ack);
  }
}
