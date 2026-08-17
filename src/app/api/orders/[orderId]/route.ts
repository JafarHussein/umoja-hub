import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError } from '@/lib/utils';
import { isSimulationActive } from '@/lib/payments';
import { paymentModeForOrder } from '@/lib/payments/demoMode';
import { OrderPaymentStatus, OrderFulfillmentStatus, Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/orders/[orderId] — one order, for the party to it.
//
// This did not exist, and the order detail screens compensated by fetching the
// *list* and picking their order out of it client-side. The list is paginated
// at 20, so any order past the first page was unreachable by direct link: a
// buyer with 27 orders opening a link to their 25th was told "We can't find
// that order — it may belong to a different account", about their own purchase.
// A link in an email to an older order did the same thing.
//
// Authorization matches the receipt route: the buyer or the farmer on the
// order, or any administrator. A stranger gets 404 rather than 403, so the
// endpoint does not confirm that an order id exists to someone with no
// business knowing.
// ---------------------------------------------------------------------------

interface IUserLean {
  _id: mongoose.Types.ObjectId;
  firstName?: string;
  lastName?: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }

    const { orderId } = await params;
    if (!mongoose.isValidObjectId(orderId)) {
      throw new AppError('This order does not exist.', 404, 'ORDER_NOT_FOUND');
    }

    await connectDB();
    const { default: Order } = await import('@/lib/models/Order.model');
    const order = await Order.findById(orderId).lean();
    if (!order) {
      throw new AppError('This order does not exist.', 404, 'ORDER_NOT_FOUND');
    }

    const { id: userId, role } = session.user;
    const isBuyer = String(order.buyerId) === userId;
    const isFarmer = String(order.farmerId) === userId;
    if (!isBuyer && !isFarmer && role !== Role.ADMIN) {
      // Deliberately the same answer a missing order gets.
      throw new AppError('This order does not exist.', 404, 'ORDER_NOT_FOUND');
    }

    const { default: User } = await import('@/lib/models/User.model');
    const { default: Rating } = await import('@/lib/models/Rating.model');

    const [farmer, buyer, rated] = await Promise.all([
      User.findById(order.farmerId).select('firstName lastName').lean() as Promise<IUserLean | null>,
      User.findById(order.buyerId).select('firstName lastName').lean() as Promise<IUserLean | null>,
      Rating.exists({ orderId: order._id }),
    ]);

    // One shape for both parties — the same fields the list returns for each
    // side, merged, so a screen can move to this endpoint without reshaping.
    return NextResponse.json({
      data: {
        _id: String(order._id),
        orderReferenceId: order.orderReferenceId,
        cropName: order.cropName,
        quantityOrdered: order.quantityOrdered,
        unit: order.unit,
        totalAmountKES: order.totalAmountKES,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        fulfillmentType: order.fulfillmentType,
        mpesaCheckoutRequestId: order.mpesaCheckoutRequestId ?? null,
        // The M-Pesa receipt code. Kenyan buyers verify a payment against the
        // Safaricom SMS on their handset, so an order claiming to be paid
        // without showing the code it was paid under is asking to be taken on
        // trust. The platform has always stored this; the order screen just
        // never showed it, sending the buyer to the receipt page to find it.
        mpesaTransactionId: order.mpesaTransactionId ?? null,
        // Whether that code came from the simulator. Decided on the server, as
        // the receipt already does — PAYMENT_PROVIDER is not readable in the
        // browser, and a receipt code shown without saying where it came from
        // is exactly the implication the simulation notice exists to prevent.
        isSimulated: isSimulationActive(),
        // Which leg this order actually used, derived once so every surface
        // describes the same payment the same way.
        paymentMode: paymentModeForOrder(order.mpesaTransactionId ?? null),
        mpesaMerchantRequestId: order.mpesaMerchantRequestId ?? null,
        buyerPhone: order.buyerPhone,
        farmer: { firstName: farmer?.firstName ?? '—', lastName: farmer?.lastName ?? '' },
        buyer: { firstName: buyer?.firstName ?? '—', lastName: buyer?.lastName ?? '' },
        hasRated: rated !== null,
        canConfirmDispatch:
          order.paymentStatus === OrderPaymentStatus.PAID &&
          order.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT &&
          !order.confirmedByFarmerAt,
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() ?? null,
        confirmedByFarmerAt: order.confirmedByFarmerAt?.toISOString() ?? null,
        receivedByBuyerAt: order.receivedByBuyerAt?.toISOString() ?? null,
        fulfillmentStage: order.fulfillmentStage ?? null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
