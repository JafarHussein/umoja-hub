import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import MarketplaceListing from '@/lib/models/MarketplaceListing.model';
import { paymentActionSchema } from '@/lib/validation/paymentActionSchema';
import { getPaymentProvider, getActiveProviderName, isSimulationActive } from '@/lib/payments';
import { checkRateLimit } from '@/lib/rateLimit';
import { AppError, handleApiError, logger } from '@/lib/utils';
import {
  ListingStatus,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  PaymentEventActor,
  PaymentEventType,
  Role,
} from '@/types';

// ---------------------------------------------------------------------------
// POST /api/orders/[orderId]/payment — buyer payment recovery.
// Auth: the BUYER who owns the order.
//
// RETRY  — a failed payment previously left the buyer with no way forward but
//          to place a whole new order. Retrying re-reserves the stock (the
//          failure path returned it to the marketplace) and opens a fresh
//          payment session against the same order, preserving its reference and
//          its audit trail.
// CANCEL — releases the stock held by an unpaid order straight away instead of
//          leaving it reserved until the reconciliation sweep.
//
// Both transitions are guarded on the order's current payment state, so a
// double-submit or an attempt to re-pay a settled order is a clean 409 rather
// than a second charge.
// ---------------------------------------------------------------------------

const RETRYABLE: string[] = [OrderPaymentStatus.FAILED];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }
    if (session.user.role !== Role.BUYER) {
      throw new AppError(
        'You do not have permission to perform this action.',
        403,
        'AUTH_FORBIDDEN'
      );
    }

    const { orderId } = await params;
    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    const body: unknown = await req.json();
    const parsed = paymentActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'The submitted data is invalid. Check the details and try again.',
          code: 'VALIDATION_FAILED',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { action } = parsed.data;

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('This order does not exist.', 404, 'ORDER_NOT_FOUND');
    }
    if (String(order.buyerId) !== session.user.id) {
      throw new AppError(
        'You do not have permission to perform this action.',
        403,
        'AUTH_FORBIDDEN'
      );
    }

    // Paying twice for the same order is the failure mode worth being loudest
    // about — refuse before touching stock or the provider.
    if (order.paymentStatus === OrderPaymentStatus.PAID) {
      throw new AppError(
        'This order is already paid. No further payment is needed.',
        409,
        'ORDER_ALREADY_PAID'
      );
    }
    if (order.paymentStatus === OrderPaymentStatus.REFUNDED) {
      throw new AppError(
        'This order was refunded and cannot be paid again. Place a new order instead.',
        409,
        'ORDER_REFUNDED'
      );
    }

    // ── CANCEL ───────────────────────────────────────────────────────────────
    if (action === 'CANCEL') {
      if (order.paymentStatus !== OrderPaymentStatus.PENDING_PAYMENT) {
        throw new AppError(
          'Only an order still awaiting payment can be cancelled.',
          409,
          'ORDER_NOT_CANCELLABLE'
        );
      }

      // Guarded transition — a callback landing at this instant wins and the
      // cancel becomes a clean no-op rather than voiding a real payment.
      const cancelled = await Order.findOneAndUpdate(
        { _id: order._id, paymentStatus: OrderPaymentStatus.PENDING_PAYMENT },
        { $set: { paymentStatus: OrderPaymentStatus.FAILED } },
        { new: true }
      ).lean();

      if (!cancelled) {
        throw new AppError(
          'This order is no longer awaiting payment. Refresh to see its current state.',
          409,
          'ORDER_NOT_CANCELLABLE'
        );
      }

      await MarketplaceListing.findByIdAndUpdate(order.listingId, {
        $inc: { quantityAvailable: order.quantityOrdered },
        listingStatus: ListingStatus.AVAILABLE,
      });

      // A cancel moves the order to FAILED and puts the produce back on sale,
      // and until now it did so leaving nothing in the payment trail. Replaying
      // the log therefore showed an order that failed with no event that failed
      // it — indistinguishable from a payment the network killed. A buyer
      // walking away is a different fact and belongs on the record as one.
      {
        const { default: PaymentEventLog } = await import('@/lib/models/PaymentEventLog.model');
        PaymentEventLog.create({
          provider: getActiveProviderName(),
          eventType: PaymentEventType.RECONCILED,
          orderId: order._id,
          buyerId: order.buyerId,
          farmerId: order.farmerId,
          amount: order.totalAmountKES,
          paymentReference: order.orderReferenceId,
          // An order can be cancelled before a payment session ever opened.
          ...(order.mpesaCheckoutRequestId
            ? { checkoutRequestId: order.mpesaCheckoutRequestId }
            : {}),
          actor: PaymentEventActor.BUYER,
          previousStatus: OrderPaymentStatus.PENDING_PAYMENT,
          newStatus: OrderPaymentStatus.FAILED,
          reason:
            'The buyer cancelled the order before paying. The produce was returned to the marketplace immediately rather than waiting for the reconciliation sweep.',
          correlationId: requestId,
          occurredAt: new Date(),
        }).catch(() => {});
      }

      logger.info('orders', 'Buyer cancelled an unpaid order', {
        requestId,
        orderId,
        buyerId: session.user.id,
      });

      return NextResponse.json({
        data: { orderId, paymentStatus: OrderPaymentStatus.FAILED, cancelled: true },
      });
    }

    // ── RETRY ────────────────────────────────────────────────────────────────
    if (!RETRYABLE.includes(order.paymentStatus)) {
      throw new AppError(
        'This order cannot be retried at this stage.',
        409,
        'ORDER_NOT_RETRYABLE'
      );
    }

    if (!(await checkRateLimit(`payment-retry:${session.user.id}`, 5, 60 * 60 * 1000)).allowed) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Try again in an hour.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    // The failure path returned this stock to the marketplace, so a retry must
    // win it back — the produce may well have sold in the meantime.
    const reserved = await MarketplaceListing.findOneAndUpdate(
      {
        _id: order.listingId,
        listingStatus: ListingStatus.AVAILABLE,
        quantityAvailable: { $gte: order.quantityOrdered },
      },
      [
        {
          $set: {
            quantityAvailable: {
              $subtract: ['$quantityAvailable', order.quantityOrdered],
            },
            listingStatus: {
              $cond: {
                if: {
                  $lte: [{ $subtract: ['$quantityAvailable', order.quantityOrdered] }, 0],
                },
                then: ListingStatus.SOLD_OUT,
                else: '$listingStatus',
              },
            },
          },
        },
      ],
      { new: true }
    );

    if (!reserved) {
      throw new AppError(
        'This produce is no longer available in the quantity you ordered.',
        409,
        'ORDER_INSUFFICIENT_STOCK'
      );
    }

    let checkoutRequestId: string;
    try {
      const initiation = await getPaymentProvider().initiatePayment({
        orderId: String(order._id),
        orderReferenceId: order.orderReferenceId,
        amount: order.totalAmountKES,
        phone: order.buyerPhone,
        description: `UmojaHub ${order.cropName}`,
        buyerId: String(order.buyerId),
        farmerId: String(order.farmerId),
      });
      checkoutRequestId = initiation.checkoutRequestId;
    } catch (stkError) {
      // Give the stock straight back — the buyer is no worse off than before.
      await MarketplaceListing.findByIdAndUpdate(order.listingId, {
        $inc: { quantityAvailable: order.quantityOrdered },
        listingStatus: ListingStatus.AVAILABLE,
      });
      logger.error('orders', 'Retry payment failed — reservation rolled back', {
        requestId,
        orderId,
        error: stkError,
      });
      throw stkError;
    }

    // Captured before the update below rather than assumed from RETRYABLE, so
    // the row keeps telling the truth if what may be retried ever widens.
    const statusBefore = String(order.paymentStatus);

    await Order.findByIdAndUpdate(order._id, {
      $set: {
        paymentStatus: OrderPaymentStatus.PENDING_PAYMENT,
        fulfillmentStatus: OrderFulfillmentStatus.AWAITING_PAYMENT,
        mpesaCheckoutRequestId: checkoutRequestId,
        // Restarts the stuck-payment clock. Without this the sweep would judge
        // the retry stale immediately, on the age of the original order.
        paymentRequestedAt: new Date(),
      },
    });

    // The retry joins the same order's trail rather than starting a new one.
    {
      const { default: PaymentEventLog } = await import('@/lib/models/PaymentEventLog.model');
      PaymentEventLog.create({
        provider: getActiveProviderName(),
        eventType: PaymentEventType.INITIATED,
        orderId: order._id,
        buyerId: order.buyerId,
        farmerId: order.farmerId,
        amount: order.totalAmountKES,
        paymentReference: order.orderReferenceId,
        checkoutRequestId,
        actor: PaymentEventActor.BUYER,
        previousStatus: statusBefore,
        newStatus: OrderPaymentStatus.PENDING_PAYMENT,
        reason: 'The buyer retried payment on this order. A new STK prompt was sent to their handset.',
        correlationId: requestId,
        occurredAt: new Date(),
      }).catch(() => {});
    }

    logger.info('orders', 'Buyer retried payment', {
      requestId,
      orderId,
      buyerId: session.user.id,
      checkoutRequestId,
    });

    return NextResponse.json({
      data: {
        orderId,
        paymentStatus: OrderPaymentStatus.PENDING_PAYMENT,
        checkoutRequestId,
        isSimulated: isSimulationActive(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
