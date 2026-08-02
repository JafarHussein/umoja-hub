import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { mediationRequestSchema } from '@/lib/validation/mediationSchema';
import { AppError, handleApiError, logger } from '@/lib/utils';
import { notify, notifyAdmins } from '@/lib/notifications/notify';
import {
  Role,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  MediationRequestStatus,
  MediationInitiator,
  BUYER_MEDIATION_CATEGORIES,
  FARMER_MEDIATION_CATEGORIES,
  MEDIATION_ESCALATION_HOURS,
  FARMER_ESCALATION_HOURS,
  NotificationType,
} from '@/types';

// ---------------------------------------------------------------------------
// POST /api/orders/[orderId]/mediation — either party escalates an order to
// platform mediation. Decoupled from the order state machine: the order's
// fulfillment status is never mutated here (recorded Q7 decision).
//
// Both sides can now file, on different clocks and different grounds:
//   BUYER  — ≥48h after payment, when the produce has not arrived or is wrong.
//   FARMER — ≥7 days after confirming dispatch, when the buyer has the produce
//            but will not confirm receipt, so the escrow will not release.
//            Previously the farmer had no escalation path at all: their money
//            could sit held indefinitely behind a silent buyer.
//
// One OPEN escalation per order, whoever raised it.
// GET — latest mediation request for the order (buyer, farmer, or admin).
// ---------------------------------------------------------------------------

type Params = { params: Promise<{ orderId: string }> };

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }
    if (session.user.role !== Role.BUYER && session.user.role !== Role.FARMER) {
      throw new AppError('You do not have permission to perform this action.', 403, 'AUTH_FORBIDDEN');
    }

    const { orderId } = await params;
    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    const body: unknown = await req.json();
    const parsed = mediationRequestSchema.safeParse(body);

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

    await connectDB();

    const { default: Order } = await import('@/lib/models/Order.model');

    const order = await Order.findById(orderId)
      .select('buyerId farmerId paymentStatus fulfillmentStatus paidAt confirmedByFarmerAt orderReferenceId')
      .lean();

    if (!order) {
      throw new AppError('This order does not exist.', 404, 'ORDER_NOT_FOUND');
    }

    const isBuyer = String(order.buyerId) === session.user.id;
    const isFarmer = String(order.farmerId) === session.user.id;
    if (!isBuyer && !isFarmer) {
      throw new AppError('You do not have permission to perform this action.', 403, 'AUTH_FORBIDDEN');
    }

    const initiatedBy = isBuyer ? MediationInitiator.BUYER : MediationInitiator.FARMER;

    if (
      order.paymentStatus !== OrderPaymentStatus.PAID ||
      order.fulfillmentStatus !== OrderFulfillmentStatus.IN_FULFILLMENT
    ) {
      throw new AppError(
        'Mediation is only available for paid orders that are still in fulfillment.',
        409,
        'MEDIATION_INVALID_ORDER_STATE'
      );
    }

    // Each side may only raise the grounds that are theirs to raise.
    const allowedCategories = isBuyer ? BUYER_MEDIATION_CATEGORIES : FARMER_MEDIATION_CATEGORIES;
    if (!allowedCategories.includes(parsed.data.category)) {
      throw new AppError(
        'That is not a reason you can report on this order.',
        400,
        'MEDIATION_INVALID_CATEGORY'
      );
    }

    // Different clocks, because the two sides are waiting on different things:
    // the buyer on produce (from payment), the farmer on confirmation (from
    // their own dispatch).
    if (isBuyer) {
      const cutoff = new Date(Date.now() - MEDIATION_ESCALATION_HOURS * 60 * 60 * 1000);
      if (!order.paidAt || order.paidAt > cutoff) {
        throw new AppError(
          `Mediation opens ${MEDIATION_ESCALATION_HOURS} hours after payment. Give the farmer time to fulfil the order first.`,
          409,
          'MEDIATION_TOO_EARLY'
        );
      }
    } else {
      if (!order.confirmedByFarmerAt) {
        throw new AppError(
          'Confirm you have dispatched this order before asking us to review it.',
          409,
          'MEDIATION_TOO_EARLY'
        );
      }
      const cutoff = new Date(Date.now() - FARMER_ESCALATION_HOURS * 60 * 60 * 1000);
      if (order.confirmedByFarmerAt > cutoff) {
        throw new AppError(
          `You can ask us to review an unconfirmed order ${Math.round(FARMER_ESCALATION_HOURS / 24)} days after dispatch. Give the buyer time to receive and check the produce first.`,
          409,
          'MEDIATION_TOO_EARLY'
        );
      }
    }

    const { default: MediationRequest } = await import('@/lib/models/MediationRequest.model');

    const existingOpen = await MediationRequest.findOne({
      orderId,
      status: { $in: [MediationRequestStatus.OPEN, MediationRequestStatus.IN_REVIEW] },
    } as object)
      .select('_id status')
      .lean();

    if (existingOpen) {
      throw new AppError(
        'An escalation for this order is already with the mediation team.',
        409,
        'MEDIATION_ALREADY_OPEN'
      );
    }

    const now = new Date();
    const mediation = await MediationRequest.create({
      orderId,
      buyerId: order.buyerId,
      farmerId: order.farmerId,
      initiatedBy,
      category: parsed.data.category,
      description: parsed.data.description,
      status: MediationRequestStatus.OPEN,
      evidence: (parsed.data.evidence ?? []).map((e) => ({
        ...e,
        uploadedByRole: initiatedBy,
        uploadedAt: now,
      })),
    });

    logger.info('orders/mediation', 'Mediation request filed', {
      requestId,
      mediationRequestId: String(mediation._id),
      orderId,
      initiatedBy,
      actorId: session.user.id,
      category: parsed.data.category,
    });

    const respondentId = isBuyer ? String(order.farmerId) : String(order.buyerId);

    void notify({
      userId: session.user.id,
      type: NotificationType.ORDER_UPDATE,
      title: 'We received your report',
      body: 'Our team will review your report and the order. The payment stays protected in escrow until this is resolved.',
      relatedEntity: { kind: 'Order', id: orderId },
    });
    void notify({
      userId: respondentId,
      type: NotificationType.ORDER_UPDATE,
      title: 'An order has been escalated to mediation',
      body: `The ${isBuyer ? 'buyer' : 'farmer'} on order ${order.orderReferenceId} reported an issue and it is now with the UmojaHub mediation team. The funds remain held in escrow until it is resolved. Open the order to give your side of what happened.`,
      relatedEntity: { kind: 'Order', id: orderId },
    });
    void notifyAdmins({
      type: NotificationType.ORDER_UPDATE,
      title: 'New dispute filed',
      body: `The ${isBuyer ? 'buyer' : 'farmer'} escalated order ${order.orderReferenceId} to mediation (${parsed.data.category}). Open the mediation queue to review and resolve it.`,
      relatedEntity: { kind: 'Order', id: orderId },
    });

    return NextResponse.json({ data: mediation }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }

    const { orderId } = await params;
    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    await connectDB();

    const { default: Order } = await import('@/lib/models/Order.model');
    const order = await Order.findById(orderId).select('buyerId farmerId').lean();
    if (!order) {
      throw new AppError('This order does not exist.', 404, 'ORDER_NOT_FOUND');
    }

    const { id: userId, role } = session.user;
    const isParty =
      String(order.buyerId) === userId || String(order.farmerId) === userId;
    if (!isParty && role !== Role.ADMIN) {
      throw new AppError('You do not have permission to perform this action.', 403, 'AUTH_FORBIDDEN');
    }

    const { default: MediationRequest } = await import('@/lib/models/MediationRequest.model');
    const mediation = await MediationRequest.findOne({ orderId } as object)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: mediation ?? null });
  } catch (error) {
    return handleApiError(error);
  }
}
