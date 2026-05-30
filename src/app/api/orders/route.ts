import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import MarketplaceListing from '@/lib/models/MarketplaceListing.model';
import { createOrderSchema } from '@/lib/validation/orderSchema';
import { generateOrderReferenceId } from '@/lib/foodhub/orderUtils';
import { initiateSTKPush } from '@/lib/integrations/darajaService';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import mongoose from 'mongoose';
import { Role, OrderPaymentStatus, OrderFulfillmentStatus, ListingStatus } from '@/types';

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
  mpesaCheckoutRequestId?: string;
  farmerId: { toString(): string };
  buyerId: { toString(): string };
  createdAt: Date;
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
          buyer: {
            firstName: buyer?.firstName ?? '—',
            lastName: buyer?.lastName ?? '',
          },
          canConfirmDispatch:
            order.paymentStatus === OrderPaymentStatus.PAID &&
            order.fulfillmentStatus === OrderFulfillmentStatus.AWAITING_PAYMENT,
          createdAt: order.createdAt.toISOString(),
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
    const session = await getServerSession(authOptions);
    requireRole(session, Role.BUYER);

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
      { new: true }
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
    });

    // Initiate Daraja STK Push — may throw AppError PAYMENT_STK_FAILED
    let mpesaCheckoutRequestId: string;
    try {
      const stkResult = await initiateSTKPush({
        amount: totalAmountKES,
        phone: buyerPhone,
        orderId: order.orderReferenceId,
        description: `UmojaHub ${listing.cropName}`,
      });
      mpesaCheckoutRequestId = stkResult.CheckoutRequestID;
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
        orderReferenceId,
        error: stkError,
      });
      throw stkError;
    }

    // Update order with checkout request ID
    await Order.findByIdAndUpdate(order._id, { mpesaCheckoutRequestId });

    logger.info('orders', 'Order created and STK Push initiated', {
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
