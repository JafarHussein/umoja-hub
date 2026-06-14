import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import { AppError, handleApiError } from '@/lib/utils';
import { isSimulationActive } from '@/lib/payments';
import { dispatchDuePayments } from '@/lib/payments/dispatcher';
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

    // Simulation mode: the buyer's poll is the primary delivery trigger for due
    // simulated callbacks. Deliver any that are due for this order, then re-read
    // the (possibly updated) status. Real Daraja delivers via the webhook, so
    // this is a no-op there.
    if (isSimulationActive()) {
      try {
        const delivered = await dispatchDuePayments({ orderId });
        if (delivered > 0) {
          const fresh = (await Order.findById(orderId)
            .select('paymentStatus fulfillmentStatus')
            .lean()) as unknown as Pick<
            OrderStatusLean,
            'paymentStatus' | 'fulfillmentStatus'
          > | null;
          if (fresh) {
            return NextResponse.json({
              paymentStatus: fresh.paymentStatus,
              fulfillmentStatus: fresh.fulfillmentStatus,
            });
          }
        }
      } catch {
        // Delivery is best-effort; fall through to the current status.
      }
    }

    return NextResponse.json({
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
