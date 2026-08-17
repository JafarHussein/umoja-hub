import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import { logger, AppError } from '@/lib/utils';
import {
  DEMO_BRIDGE_PROVIDER,
  isDemoBridgeAvailable,
  mintDemoReference,
} from '@/lib/payments/demoMode';
import { OrderPaymentStatus } from '@/types';

// ---------------------------------------------------------------------------
// The demonstration bridge.
//
// Why this exists, stated plainly because the whole defensibility of the
// demonstration rests on it:
//
// A real STK Push to the Daraja sandbox is genuine in every respect except one.
// Safaricom authenticates us, accepts the request, issues a real
// CheckoutRequestID, and POSTs a real callback to our endpoint from its own IP
// range. What it cannot do is produce a SUCCESSFUL payment: its test handset has
// nobody to enter a PIN, so the callback says `1037 · No response from user`,
// and a real Kenyan number is refused outright with `E3008` and never rings.
// Only production Go-Live against a registered paybill can end an STK Push in a
// debit, and that is an organisational gate, not a technical one.
//
// So the escrow workflow downstream of a confirmed payment cannot be reached
// through the sandbox at all. The choice is between not demonstrating it, and
// crossing the last inch under a clearly marked bridge. This is that bridge.
//
// What it is NOT:
//   - It does not fabricate a Safaricom response. Nothing here pretends to be
//     the provider: the event is recorded against `umojahub-demo-bridge`, never
//     against `daraja-sandbox`.
//   - It does not mint an M-Pesa receipt. The reference is `DEMO-…`, which
//     cannot be confused with a real ten-character code in the UI, the
//     database, or a screenshot.
//   - It is not automatic. An administrator invokes it deliberately, and the
//     reason recorded against it says why it was needed.
//   - It is unavailable outside the demonstration configuration, and refuses to
//     run under `daraja-production`, where a real payment can succeed on its own
//     and bridging would be falsifying a financial outcome.
//
// Everything after it is the real thing: the same `processStkCallback` the real
// webhook uses, the same escrow projection, the same audit trail, the same
// release rules.
// ---------------------------------------------------------------------------

export interface IDemoBridgeResult {
  orderId: string;
  orderReferenceId: string;
  reference: string;
  /** The genuine Safaricom checkout id this order's real STK Push produced. */
  checkoutRequestId: string | null;
}

/**
 * Confirm a payment that the Daraja sandbox cannot complete.
 *
 * Only ever acts on an order still awaiting payment, so it can neither
 * double-credit a settled order nor resurrect a failed one; the guard is the
 * same conditional update the callback processor uses.
 */
export async function confirmViaDemoBridge(
  orderId: string,
  adminId: string
): Promise<IDemoBridgeResult> {
  if (!isDemoBridgeAvailable()) {
    throw new AppError(
      'The demonstration bridge is only available with PAYMENT_MODE=REAL_STK_DEMO and the Daraja sandbox active.',
      409,
      'DEMO_BRIDGE_UNAVAILABLE'
    );
  }

  await connectDB();

  const order = await Order.findById(orderId)
    .select('orderReferenceId paymentStatus mpesaCheckoutRequestId totalAmountKES')
    .lean();

  if (!order) {
    throw new AppError('This order does not exist.', 404, 'ORDER_NOT_FOUND');
  }

  if (order.paymentStatus !== OrderPaymentStatus.PENDING_PAYMENT) {
    throw new AppError(
      `This order is ${order.paymentStatus}, not awaiting payment. The bridge only confirms a payment that is still open.`,
      409,
      'ORDER_NOT_AWAITING_PAYMENT'
    );
  }

  // A real STK Push must have happened first. Bridging an order that never
  // reached Safaricom would demonstrate nothing and would misrepresent the
  // audit trail, which is the artefact the whole exercise produces.
  if (!order.mpesaCheckoutRequestId) {
    throw new AppError(
      'This order has no Daraja checkout session. The bridge completes a real STK Push; it does not replace one.',
      409,
      'NO_PAYMENT_SESSION'
    );
  }

  const reference = mintDemoReference(order.orderReferenceId);

  const { processStkCallback } = await import('@/lib/payments/processCallback');

  logger.warn('payments', 'Demonstration bridge confirming a sandbox payment', {
    orderId,
    orderRef: order.orderReferenceId,
    adminId,
    checkoutRequestId: order.mpesaCheckoutRequestId,
  });

  // Routed through the ordinary callback processor, deliberately. A bridged
  // confirmation must land exactly as a real one does — same escrow hold, same
  // notifications, same replay guard, same audit rows — or the demonstration
  // would be exercising a second code path that production never uses.
  await processStkCallback(
    {
      Body: {
        stkCallback: {
          MerchantRequestID: `demo-bridge-${order.orderReferenceId}`,
          CheckoutRequestID: order.mpesaCheckoutRequestId,
          ResultCode: 0,
          ResultDesc:
            'Confirmed by the UmojaHub demonstration bridge. The Daraja sandbox cannot complete a payment: its test handset has no one to enter a PIN.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: order.totalAmountKES },
              { Name: 'MpesaReceiptNumber', Value: reference },
            ],
          },
        },
      },
    },
    { provider: DEMO_BRIDGE_PROVIDER, requestId: `demo-bridge-${crypto.randomUUID()}` }
  );

  return {
    orderId,
    orderReferenceId: order.orderReferenceId,
    reference,
    checkoutRequestId: order.mpesaCheckoutRequestId,
  };
}
