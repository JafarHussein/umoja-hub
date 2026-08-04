import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import MarketplaceListing from '@/lib/models/MarketplaceListing.model';
import { createOrderSchema } from '@/lib/validation/orderSchema';
import { generateOrderReferenceId } from '@/lib/foodhub/orderUtils';
import { getPaymentProvider, getActiveProviderName } from '@/lib/payments';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { checkRateLimit, peekRateLimit, recordRateLimitUse } from '@/lib/rateLimit';

// A buyer's hourly allowance, and the far looser guard on how hard they may
// knock. The window is shared so both reset together.
const ORDER_WINDOW_MS = 60 * 60 * 1000;
const ORDER_LIMIT_PER_WINDOW = 5;
const ORDER_ATTEMPT_LIMIT = 30;
import mongoose from 'mongoose';
import {
  Role,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  ListingStatus,
  UserStatus,
  PaymentEventType,
} from '@/types';

type ListingLean = {
  _id: mongoose.Types.ObjectId;
  listingStatus: string;
  cropName: string;
  farmerId: mongoose.Types.ObjectId;
  currentPricePerUnit: number;
  unit: string;
  quantityAvailable: number;
};

type OrderLean = {
  _id: { toString(): string };
  orderReferenceId: string;
  cropName: string;
  quantityOrdered: number;
  unit: string;
  totalAmountKES: number;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  fulfillmentType: string;
  buyerPhone: string;
  mpesaCheckoutRequestId?: string;
  farmerId: { toString(): string };
  buyerId: { toString(): string };
  createdAt: Date;
  paidAt?: Date | null;
  confirmedByFarmerAt?: Date | null;
  receivedByBuyerAt?: Date | null;
  fulfillmentStage?: string | null;
  stageHistory?: { stage: string; at: Date; note?: string }[];
};

type UserLean = {
  _id: { toString(): string };
  firstName?: string;
  lastName?: string;
};

// ---------------------------------------------------------------------------
// GET /api/orders — Authenticated user's orders (buyer or farmer view)
// Auth: BUYER | FARMER
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }

    const { role, id: userId } = session.user;

    if (role !== Role.BUYER && role !== Role.FARMER) {
      throw new AppError(
        'You do not have permission to perform this action.',
        403,
        'AUTH_FORBIDDEN'
      );
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);

    if (cursor && !mongoose.isValidObjectId(cursor)) {
      return NextResponse.json(
        { error: 'Invalid cursor value.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    const [{ default: User }, { default: Rating }] = await Promise.all([
      import('@/lib/models/User.model'),
      import('@/lib/models/Rating.model'),
    ]);

    if (role === Role.BUYER) {
      const buyerFilter: Record<string, unknown> = { buyerId: userId };
      if (cursor) buyerFilter['_id'] = { $lt: new mongoose.Types.ObjectId(cursor) };

      const rawOrders = (await Order.find(buyerFilter)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .lean()) as unknown as OrderLean[];

      const hasMore = rawOrders.length > limit;
      const orders = hasMore ? rawOrders.slice(0, limit) : rawOrders;
      const nextCursor = hasMore ? (orders.at(-1)?._id?.toString() ?? null) : null;

      const ratedIds = (await Rating.distinct('orderId', { buyerId: userId })) as unknown[];
      const ratedSet = new Set(ratedIds.map(String));

      const farmerIds = [...new Set(orders.map((o) => o.farmerId.toString()))];
      const farmers = (await User.find({ _id: { $in: farmerIds } })
        .select('firstName lastName')
        .lean()) as unknown as UserLean[];
      const farmerMap = new Map(farmers.map((f) => [f._id.toString(), f]));

      return NextResponse.json({
        orders: orders.map((order) => {
          const farmer = farmerMap.get(order.farmerId.toString());
          return {
            _id: order._id.toString(),
            orderReferenceId: order.orderReferenceId,
            cropName: order.cropName,
            quantityOrdered: order.quantityOrdered,
            unit: order.unit,
            totalAmountKES: order.totalAmountKES,
            paymentStatus: order.paymentStatus,
            fulfillmentStatus: order.fulfillmentStatus,
            mpesaCheckoutRequestId: order.mpesaCheckoutRequestId ?? null,
            farmer: {
              firstName: farmer?.firstName ?? '—',
              lastName: farmer?.lastName ?? '',
            },
            hasRated: ratedSet.has(order._id.toString()),
            createdAt: order.createdAt.toISOString(),
            paidAt: order.paidAt?.toISOString() ?? null,
            confirmedByFarmerAt: order.confirmedByFarmerAt?.toISOString() ?? null,
            receivedByBuyerAt: order.receivedByBuyerAt?.toISOString() ?? null,
            // Where the produce actually is — the buyer is watching this while
            // their money sits in escrow.
            fulfillmentStage: order.fulfillmentStage ?? null,
          };
        }),
        nextCursor,
      });
    }

    // FARMER role
    const farmerFilter: Record<string, unknown> = { farmerId: userId };
    if (cursor) farmerFilter['_id'] = { $lt: new mongoose.Types.ObjectId(cursor) };

    const rawFarmerOrders = (await Order.find(farmerFilter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean()) as unknown as OrderLean[];

    const farmerHasMore = rawFarmerOrders.length > limit;
    const farmerOrders = farmerHasMore ? rawFarmerOrders.slice(0, limit) : rawFarmerOrders;
    const farmerNextCursor = farmerHasMore ? (farmerOrders.at(-1)?._id?.toString() ?? null) : null;

    const buyerIds = [...new Set(farmerOrders.map((o) => o.buyerId.toString()))];
    const buyers = (await User.find({ _id: { $in: buyerIds } })
      .select('firstName lastName')
      .lean()) as unknown as UserLean[];
    const buyerMap = new Map(buyers.map((b) => [b._id.toString(), b]));

    return NextResponse.json({
      orders: farmerOrders.map((order) => {
        const buyer = buyerMap.get(order.buyerId.toString());
        return {
          _id: order._id.toString(),
          orderReferenceId: order.orderReferenceId,
          cropName: order.cropName,
          quantityOrdered: order.quantityOrdered,
          unit: order.unit,
          totalAmountKES: order.totalAmountKES,
          paymentStatus: order.paymentStatus,
          fulfillmentStatus: order.fulfillmentStatus,
          fulfillmentType: order.fulfillmentType,
          buyerPhone: order.buyerPhone,
          buyer: {
            firstName: buyer?.firstName ?? '—',
            lastName: buyer?.lastName ?? '',
          },
          // The Daraja webhook sets fulfillmentStatus to IN_FULFILLMENT at the moment of
          // payment, so an order never sits in PAID + AWAITING_PAYMENT. The farmer's
          // dispatch attestation is therefore gated on payment received and not yet
          // confirmed — confirmedByFarmerAt is what the reliability score measures.
          canConfirmDispatch:
            order.paymentStatus === OrderPaymentStatus.PAID &&
            order.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT &&
            !order.confirmedByFarmerAt,
          createdAt: order.createdAt.toISOString(),
          // The handover countdown is anchored to paidAt: confirming within 24 h of
          // payment is what farmerTrustCalculator counts as on-time.
          paidAt: order.paidAt?.toISOString() ?? null,
          confirmedByFarmerAt: order.confirmedByFarmerAt?.toISOString() ?? null,
          receivedByBuyerAt: order.receivedByBuyerAt?.toISOString() ?? null,
          fulfillmentStage: order.fulfillmentStage ?? null,
        };
      }),
      nextCursor: farmerNextCursor,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/orders — Buyer creates an order and initiates M-Pesa STK Push
// Auth: BUYER
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    requireRole(session, Role.BUYER);

    // Two limits, because two different things are being protected.
    //
    // The endpoint guard counts requests: every attempt costs database reads
    // whatever its outcome, so hammering has to be bounded. It is deliberately
    // generous — it exists to stop abuse, not to ration buying.
    //
    // The order cap counts orders, and is charged further down only once one
    // exists. One counter used to do both jobs, and it did the second one
    // wrongly: the message promised "maximum 5 orders per hour" while the code
    // counted requests, so five validation errors, five sold-out listings, or
    // five server faults of ours locked a buyer out for an hour having bought
    // nothing. A cap on outcomes must be spent on outcomes.
    const orderCapKey = `orders:${session!.user.id}`;

    if (
      !(await checkRateLimit(`orders:attempt:${session!.user.id}`, ORDER_ATTEMPT_LIMIT, ORDER_WINDOW_MS))
        .allowed
    ) {
      return NextResponse.json(
        {
          error: 'Too many attempts. Please wait a few minutes and try again.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      );
    }

    if (!(await peekRateLimit(orderCapKey, ORDER_LIMIT_PER_WINDOW)).allowed) {
      return NextResponse.json(
        {
          error: `You have placed the maximum of ${ORDER_LIMIT_PER_WINDOW} orders this hour. You can order again shortly.`,
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      );
    }

    const body: unknown = await req.json();
    const parsed = createOrderSchema.safeParse(body);

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

    const { listingId, quantityOrdered, fulfillmentType, buyerPhone } = parsed.data;

    await connectDB();

    // Enforce suspended buyer accounts — JWT is still valid but account may have been suspended
    const { default: User } = await import('@/lib/models/User.model');
    const buyer = await User.findById(session!.user.id).select('status').lean();
    if (buyer?.status !== UserStatus.ACTIVE) {
      throw new AppError('Your account has been suspended.', 403, 'ACCOUNT_SUSPENDED');
    }

    // Step 1: Readable validation — specific error messages before touching DB state
    const listing = (await MarketplaceListing.findById(listingId)
      .select('listingStatus cropName farmerId currentPricePerUnit unit quantityAvailable')
      .lean()) as ListingLean | null;

    if (!listing) {
      throw new AppError(
        'This listing does not exist or has been removed.',
        404,
        'FARMER_LISTING_NOT_FOUND'
      );
    }
    if (listing.listingStatus !== ListingStatus.AVAILABLE) {
      throw new AppError('This listing is no longer available.', 409, 'FARMER_LISTING_UNAVAILABLE');
    }
    if (quantityOrdered > listing.quantityAvailable) {
      throw new AppError(
        'The requested quantity is no longer available.',
        409,
        'ORDER_INSUFFICIENT_STOCK'
      );
    }

    // Step 2: Atomic reserve — prevents race condition where two concurrent buyers both
    // pass the check above before either write completes. The $gte filter doubles as a
    // compare-and-swap: if another request decremented stock between Step 1 and here,
    // findOneAndUpdate returns null and we surface a clean 409 instead of overselling.
    const reserved = await MarketplaceListing.findOneAndUpdate(
      {
        _id: listingId,
        listingStatus: ListingStatus.AVAILABLE,
        quantityAvailable: { $gte: quantityOrdered },
      },
      [
        {
          $set: {
            quantityAvailable: { $subtract: ['$quantityAvailable', quantityOrdered] },
            // Auto-transition to SOLD_OUT when stock reaches exactly zero
            listingStatus: {
              $cond: {
                if: { $lte: [{ $subtract: ['$quantityAvailable', quantityOrdered] }, 0] },
                then: ListingStatus.SOLD_OUT,
                else: '$listingStatus',
              },
            },
          },
        },
      ],
      // `updatePipeline` is required by Mongoose 9 before it will send an
      // aggregation-pipeline update. Without it the driver refuses the call and
      // the whole purchase path throws — which is exactly what it was doing.
      { new: true, updatePipeline: true }
    );

    if (!reserved) {
      // Race condition: another buyer claimed the last stock between Step 1 and Step 2
      throw new AppError(
        'The requested quantity is no longer available.',
        409,
        'ORDER_INSUFFICIENT_STOCK'
      );
    }

    const totalAmountKES = quantityOrdered * listing.currentPricePerUnit;
    const orderReferenceId = await generateOrderReferenceId();

    // Create order in PENDING_PAYMENT state before STK Push
    const order = await Order.create({
      orderReferenceId,
      listingId,
      farmerId: listing.farmerId,
      buyerId: session!.user.id,
      cropName: listing.cropName,
      quantityOrdered,
      unit: listing.unit,
      pricePerUnit: listing.currentPricePerUnit,
      totalAmountKES,
      fulfillmentType,
      buyerPhone,
      paymentStatus: OrderPaymentStatus.PENDING_PAYMENT,
      fulfillmentStatus: OrderFulfillmentStatus.AWAITING_PAYMENT,
      // Anchors the stuck-payment sweep to this payment session, not to the
      // order's age (a retry reopens the session on an older order).
      paymentRequestedAt: new Date(),
    });

    // The allowance is spent here, on the order, and nowhere else. Stock has
    // been reserved and the row exists, so this is the first moment a buyer has
    // actually consumed one of their five. Everything that can still fail below
    // — the STK push, the audit write — leaves the order standing, so it is
    // rightly charged even then.
    await recordRateLimitUse(orderCapKey, ORDER_WINDOW_MS);

    // Initiate payment via the active provider (simulation or Daraja). The
    // contract is identical: returns a checkout request id; the outcome arrives
    // later as a callback. May throw AppError PAYMENT_STK_FAILED.
    let mpesaCheckoutRequestId: string;
    try {
      const initiation = await getPaymentProvider().initiatePayment({
        orderId: String(order._id),
        orderReferenceId: order.orderReferenceId,
        amount: totalAmountKES,
        phone: buyerPhone,
        description: `UmojaHub ${listing.cropName}`,
        buyerId: String(session!.user.id),
        farmerId: String(listing.farmerId),
      });
      mpesaCheckoutRequestId = initiation.checkoutRequestId;
    } catch (stkError) {
      // Rollback: delete the order AND restore listing inventory atomically.
      // listingStatus is unconditionally restored to AVAILABLE because we only reach
      // this path when the listing was AVAILABLE at the time of reservation (Step 2 filter).
      await Promise.all([
        Order.findByIdAndDelete(order._id),
        MarketplaceListing.findByIdAndUpdate(listingId, {
          $inc: { quantityAvailable: quantityOrdered },
          listingStatus: ListingStatus.AVAILABLE,
        }),
      ]);
      logger.error('orders', 'STK Push failed — order and inventory rolled back', {
        requestId,
        orderReferenceId,
        error: stkError,
      });
      throw stkError;
    }

    // Update order with checkout request ID
    await Order.findByIdAndUpdate(order._id, { mpesaCheckoutRequestId });

    // Provider-agnostic audit trail (non-blocking).
    {
      const { default: PaymentEventLog } = await import('@/lib/models/PaymentEventLog.model');
      PaymentEventLog.create({
        provider: getActiveProviderName(),
        eventType: PaymentEventType.INITIATED,
        orderId: order._id,
        buyerId: session!.user.id,
        farmerId: listing.farmerId,
        amount: totalAmountKES,
        paymentReference: order.orderReferenceId,
        checkoutRequestId: mpesaCheckoutRequestId,
        occurredAt: new Date(),
      }).catch(() => {});
    }

    logger.info('orders', 'Order created and STK Push initiated', {
      requestId,
      orderReferenceId,
      buyerId: session!.user.id,
      farmerId: String(listing.farmerId),
      totalAmountKES,
    });

    return NextResponse.json(
      {
        data: {
          orderId: String(order._id),
          orderReferenceId: order.orderReferenceId,
          totalAmountKES,
          mpesaCheckoutRequestId,
          paymentStatus: OrderPaymentStatus.PENDING_PAYMENT,
          message:
            'Check your phone and enter your M-Pesa PIN to complete payment',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
