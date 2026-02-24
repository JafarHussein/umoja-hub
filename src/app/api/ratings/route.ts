import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import Rating from '@/lib/models/Rating.model';
import { recalculate } from '@/lib/trust/farmerTrustCalculator';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, OrderFulfillmentStatus } from '@/types';

const createRatingSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z.string().trim().max(500).optional(),
});

// ---------------------------------------------------------------------------
// POST /api/ratings — Buyer rates a farmer after order completion
// Auth: BUYER
// Side effects: triggers farmerTrustCalculator.recalculate(farmerId)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.BUYER);

    const body: unknown = await req.json();
    const parsed = createRatingSchema.safeParse(body);

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

    const { orderId, rating, comment } = parsed.data;

    await connectDB();

    // Validate order exists, belongs to buyer, and is COMPLETED
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('This order does not exist.', 404, 'ORDER_NOT_FOUND');
    }

    if (String(order.buyerId) !== session!.user.id) {
      throw new AppError(
        'You do not have permission to perform this action.',
        403,
        'AUTH_FORBIDDEN'
      );
    }

    if (order.fulfillmentStatus !== OrderFulfillmentStatus.COMPLETED) {
      throw new AppError(
        'You can only rate an order after it has been completed.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    // Create rating — orderId unique index prevents duplicate ratings
    const newRating = await Rating.create({
      orderId,
      farmerId: order.farmerId,
      buyerId: session!.user.id,
      rating,
      ...(comment && { comment }),
    });

    logger.info('ratings', 'Rating submitted', {
      orderId,
      farmerId: String(order.farmerId),
      rating,
    });

    // Trigger trust score recalculation (non-blocking)
    const farmerId = String(order.farmerId);
    recalculate(farmerId).catch((err: unknown) => {
      logger.error('ratings', 'Trust score recalculation failed after rating', {
        farmerId,
        err,
      });
    });

    // Calculate updated average for response
    const allRatings = await Rating.find({ farmerId: order.farmerId }).select('rating').lean();
    const averageUpdated =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
        : rating;

    return NextResponse.json(
      {
        data: {
          ratingId: String(newRating._id),
          averageUpdated: Math.round(averageUpdated * 10) / 10,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
