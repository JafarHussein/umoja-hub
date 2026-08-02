import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import { updateFulfillmentStageSchema } from '@/lib/validation/orderSchema';
import { notify } from '@/lib/notifications/notify';
import { AppError, handleApiError, logger } from '@/lib/utils';
import {
  FULFILLMENT_STAGE_LABEL,
  FULFILLMENT_STAGE_ORDER,
  FulfillmentStage,
  NotificationType,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  Role,
} from '@/types';

// ---------------------------------------------------------------------------
// PATCH /api/orders/[orderId]/stage — the farmer narrates fulfilment progress.
// Auth: the FARMER on the order.
//
// This is a descriptive axis only. It never touches paymentStatus or
// fulfillmentStatus, so escrow custody, the mediation gate, the trust score and
// the admin ledger are all untouched by a stage change — the order stays
// IN_FULFILLMENT (held) throughout. What it buys is a buyer who can see where
// their produce actually is while their money sits in escrow.
//
// Forward-only: a farmer may skip ahead (produce collected from the farm never
// sits READY) but never backwards. The buyer has already been told, and a
// reversal would make the recorded trail a lie.
// ---------------------------------------------------------------------------

const BUYER_MESSAGE: Record<FulfillmentStage, string> = {
  [FulfillmentStage.PREPARING]: 'is preparing your produce',
  [FulfillmentStage.READY]: 'has your order ready for collection',
  [FulfillmentStage.IN_TRANSIT]: 'has sent your order — it is on the way',
  [FulfillmentStage.DELIVERED]: 'has marked your order delivered',
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }
    if (session.user.role !== Role.FARMER) {
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
    const parsed = updateFulfillmentStageSchema.safeParse(body);
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

    const { stage, note } = parsed.data;

    await connectDB();

    const order = await Order.findById(orderId).lean();
    if (!order) {
      throw new AppError('This order does not exist.', 404, 'ORDER_NOT_FOUND');
    }
    if (String(order.farmerId) !== session.user.id) {
      throw new AppError(
        'You do not have permission to perform this action.',
        403,
        'AUTH_FORBIDDEN'
      );
    }

    // Progress is only meaningful while the platform holds the buyer's money
    // and the order is live.
    if (
      order.paymentStatus !== OrderPaymentStatus.PAID ||
      order.fulfillmentStatus !== OrderFulfillmentStatus.IN_FULFILLMENT
    ) {
      throw new AppError(
        'Fulfilment progress can only be updated on a paid order that is still in fulfilment.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const currentIndex = order.fulfillmentStage
      ? FULFILLMENT_STAGE_ORDER.indexOf(order.fulfillmentStage as FulfillmentStage)
      : -1;
    const nextIndex = FULFILLMENT_STAGE_ORDER.indexOf(stage);

    if (nextIndex <= currentIndex) {
      throw new AppError(
        'Fulfilment progress cannot be moved backwards. The buyer has already been told.',
        409,
        'ORDER_STAGE_NOT_FORWARD'
      );
    }

    const now = new Date();
    const updated = await Order.findOneAndUpdate(
      // Guard on the stage we read, so two concurrent updates cannot interleave.
      {
        _id: order._id,
        ...(order.fulfillmentStage
          ? { fulfillmentStage: order.fulfillmentStage }
          : { fulfillmentStage: { $exists: false } }),
      },
      {
        $set: { fulfillmentStage: stage },
        $push: { stageHistory: { stage, at: now, ...(note !== undefined && { note }) } },
      },
      { new: true }
    ).lean();

    if (!updated) {
      throw new AppError(
        'This order’s progress was updated elsewhere. Refresh and try again.',
        409,
        'ORDER_STAGE_CONFLICT'
      );
    }

    logger.info('orders', 'Fulfilment stage advanced', {
      requestId,
      orderId,
      farmerId: session.user.id,
      stage,
    });

    void notify({
      userId: String(order.buyerId),
      type: NotificationType.ORDER_UPDATE,
      title: FULFILLMENT_STAGE_LABEL[stage],
      body: `The farmer ${BUYER_MESSAGE[stage]} for order ${order.orderReferenceId} (${order.cropName}).${
        stage === FulfillmentStage.DELIVERED
          ? ' Once you have it, confirm receipt to release the payment held in escrow.'
          : ' Your payment stays protected in escrow until you confirm receipt.'
      }`,
      relatedEntity: { kind: 'Order', id: String(order._id) },
    });

    return NextResponse.json({
      data: { orderId, stage, at: now.toISOString() },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
