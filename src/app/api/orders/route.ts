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
import { Role, OrderPaymentStatus, OrderFulfillmentStatus, ListingStatus } from '@/types';

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

    // Validate listing exists and is available
    const listing = await MarketplaceListing.findById(listingId);
    if (!listing) {
      throw new AppError(
        'This listing does not exist or has been removed.',
        404,
        'FARMER_LISTING_NOT_FOUND'
      );
    }

    if (listing.listingStatus !== ListingStatus.AVAILABLE) {
      throw new AppError(
        'This listing is no longer available.',
        409,
        'FARMER_LISTING_UNAVAILABLE'
      );
    }

    // Check available stock
    if (quantityOrdered > listing.quantityAvailable) {
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
      // Clean up the order if STK Push fails
      await Order.findByIdAndDelete(order._id);
      logger.error('orders', 'STK Push failed, order rolled back', {
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
