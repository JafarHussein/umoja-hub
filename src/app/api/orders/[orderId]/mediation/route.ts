import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { mediationRequestSchema } from '@/lib/validation/mediationSchema';
import { AppError, handleApiError, logger } from '@/lib/utils';
import {
  Role,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  MediationRequestStatus,
  MEDIATION_ESCALATION_HOURS,
} from '@/types';

// ---------------------------------------------------------------------------
// POST /api/orders/[orderId]/mediation — Buyer escalates an order to
// platform mediation. Decoupled from the order state machine: the order's
// fulfillment status is never mutated here (recorded Q7 decision).
// Gates: BUYER owns the order; order is PAID + IN_FULFILLMENT and has been
// stuck there for ≥48h since payment; one OPEN escalation per order.
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
    if (session.user.role !== Role.BUYER) {
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
      .select('buyerId farmerId paymentStatus fulfillmentStatus paidAt')
      .lean();

    if (!order) {
      throw new AppError('This order does not exist.', 404, 'ORDER_NOT_FOUND');
    }

    if (String(order.buyerId) !== session.user.id) {
      throw new AppError('You do not have permission to perform this action.', 403, 'AUTH_FORBIDDEN');
    }

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

    const anchor = order.paidAt ?? null;
    const cutoff = new Date(Date.now() - MEDIATION_ESCALATION_HOURS * 60 * 60 * 1000);
    if (!anchor || anchor > cutoff) {
      throw new AppError(
        `Mediation opens ${MEDIATION_ESCALATION_HOURS} hours after payment. Give the farmer time to fulfil the order first.`,
        409,
        'MEDIATION_TOO_EARLY'
      );
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

    const mediation = await MediationRequest.create({
      orderId,
      buyerId: session.user.id,
      farmerId: order.farmerId,
      category: parsed.data.category,
      description: parsed.data.description,
      status: MediationRequestStatus.OPEN,
    });

    logger.info('orders/mediation', 'Mediation request filed', {
      requestId,
      mediationRequestId: String(mediation._id),
      orderId,
      buyerId: session.user.id,
      category: parsed.data.category,
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
