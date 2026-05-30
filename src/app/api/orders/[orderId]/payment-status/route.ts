import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import { AppError, handleApiError } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/orders/[orderId]/payment-status — Poll payment + fulfillment status
// Auth: BUYER or FARMER who owns this order
// ---------------------------------------------------------------------------

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }

    const { orderId } = await params;

    type OrderStatusLean = {
      paymentStatus: string;
      fulfillmentStatus: string;
      buyerId: { toString(): string };
      farmerId: { toString(): string };
    };

    const order = (await Order.findById(orderId)
      .select('paymentStatus fulfillmentStatus buyerId farmerId')
      .lean()) as unknown as OrderStatusLean | null;

    if (!order) {
      throw new AppError('This order does not exist.', 404, 'ORDER_NOT_FOUND');
    }

    const { id: userId, role } = session.user;

    if (
      (role === Role.BUYER && order.buyerId.toString() !== userId) ||
      (role === Role.FARMER && order.farmerId.toString() !== userId)
    ) {
      throw new AppError(
        'You do not have permission to perform this action.',
        403,
        'AUTH_FORBIDDEN'
      );
    }

    return NextResponse.json({
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
