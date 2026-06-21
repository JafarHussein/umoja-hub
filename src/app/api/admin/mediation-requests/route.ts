import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import MediationRequest from '@/lib/models/MediationRequest.model';
import AdminAuditLog from '@/lib/models/AdminAuditLog.model';
import { adminMediationDecisionSchema } from '@/lib/validation/mediationSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { sendSMS } from '@/lib/integrations/smsService';
import {
  Role,
  MediationRequestStatus,
  MediationOutcome,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  ListingStatus,
  EscrowEventType,
} from '@/types';

// ---------------------------------------------------------------------------
// GET   /api/admin/mediation-requests — Paginated escalation queue
//        (default OPEN), enriched with buyer/farmer identity and order ref.
// PATCH /api/admin/mediation-requests — Transition a request:
//        OPEN → IN_REVIEW, OPEN|IN_REVIEW → RESOLVED (resolution note
//        required). Resolutions never touch the Order document.
// Auth: ADMIN.
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status') ?? MediationRequestStatus.OPEN;
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);

    if (
      !Object.values(MediationRequestStatus).includes(statusParam as MediationRequestStatus)
    ) {
      return NextResponse.json(
        { error: 'Invalid status filter.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    const filter: Record<string, unknown> = { status: statusParam };
    if (cursor) {
      if (!mongoose.isValidObjectId(cursor)) {
        return NextResponse.json(
          { error: 'Invalid cursor value.', code: 'VALIDATION_FAILED' },
          { status: 400 }
        );
      }
      filter['_id'] = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    await connectDB();

    const requests = await MediationRequest.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = requests.length > limit;
    const page = hasMore ? requests.slice(0, limit) : requests;
    const nextCursor = hasMore ? (page.at(-1)?._id?.toString() ?? null) : null;

    // Enrich with both parties and the human-readable order reference.
    const [{ default: User }, { default: Order }] = await Promise.all([
      import('@/lib/models/User.model'),
      import('@/lib/models/Order.model'),
    ]);

    const userIds = [
      ...new Set(page.flatMap((r) => [String(r.buyerId), String(r.farmerId)])),
    ];
    const orderIds = [...new Set(page.map((r) => String(r.orderId)))];

    const [users, orders] = await Promise.all([
      User.find({ _id: { $in: userIds } })
        .select('firstName lastName phoneNumber')
        .lean(),
      Order.find({ _id: { $in: orderIds } })
        .select('orderReferenceId cropName totalAmountKES fulfillmentStatus')
        .lean(),
    ]);

    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const orderMap = new Map(orders.map((o) => [String(o._id), o]));

    const data = page.map((r) => {
      const buyer = userMap.get(String(r.buyerId));
      const farmer = userMap.get(String(r.farmerId));
      const order = orderMap.get(String(r.orderId));
      return {
        ...r,
        buyer: buyer
          ? { firstName: buyer.firstName, lastName: buyer.lastName, phoneNumber: buyer.phoneNumber }
          : null,
        farmer: farmer
          ? { firstName: farmer.firstName, lastName: farmer.lastName, phoneNumber: farmer.phoneNumber }
          : null,
        order: order
          ? {
              orderReferenceId: order.orderReferenceId,
              cropName: order.cropName,
              totalAmountKES: order.totalAmountKES,
              fulfillmentStatus: order.fulfillmentStatus,
            }
          : null,
      };
    });

    const queueSize = await MediationRequest.countDocuments({
      status: MediationRequestStatus.OPEN,
    });

    return NextResponse.json({ data, nextCursor, meta: { queueSize } });
  } catch (error) {
    return handleApiError(error);
  }
}

type MediationDecision = 'IN_REVIEW' | 'RESOLVED';

// Allowed current statuses per target transition.
const TRANSITION_FROM: Record<MediationDecision, MediationRequestStatus[]> = {
  IN_REVIEW: [MediationRequestStatus.OPEN],
  RESOLVED: [MediationRequestStatus.OPEN, MediationRequestStatus.IN_REVIEW],
};

const AUDIT_ACTION: Record<MediationDecision, string> = {
  IN_REVIEW: 'MEDIATION_IN_REVIEW',
  RESOLVED: 'MEDIATION_RESOLVED',
};

type MediationLean = {
  _id: unknown;
  orderId: unknown;
  buyerId: unknown;
  farmerId: unknown;
  status: string;
};

// Apply the admin's escrow decision to the held funds. Atomic + status-guarded:
// only a PAID order still IN_FULFILLMENT (held in escrow) can be released or
// refunded, so a double-submit or a race is a clean no-op. REFUND returns funds
// to the buyer (REFUNDED/DISPUTED + inventory restored); RELEASE completes the
// order so the funds become the farmer's. Every move appends an EscrowEventLog.
async function applyEscrowOutcome(
  mediation: MediationLean,
  outcome: MediationOutcome,
  note: string | undefined,
  adminId: string,
  requestId: string
): Promise<void> {
  const [{ default: Order }, { default: EscrowEventLog }] = await Promise.all([
    import('@/lib/models/Order.model'),
    import('@/lib/models/EscrowEventLog.model'),
  ]);

  const heldGuard = {
    _id: mediation.orderId,
    paymentStatus: OrderPaymentStatus.PAID,
    fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
  } as object;

  if (outcome === MediationOutcome.REFUND) {
    const order = await Order.findOneAndUpdate(
      heldGuard,
      {
        $set: {
          paymentStatus: OrderPaymentStatus.REFUNDED,
          fulfillmentStatus: OrderFulfillmentStatus.DISPUTED,
          disputeFlaggedAt: new Date(),
          ...(note !== undefined && { disputeReason: note }),
        },
      },
      { new: true }
    ).lean();

    if (!order) {
      logger.warn('admin/mediation-requests', 'Refund skipped — order not in a held state', {
        requestId,
        orderId: String(mediation.orderId),
      });
      return;
    }

    // Return the produce to the marketplace, mirroring the failed-payment path.
    const { default: MarketplaceListing } = await import('@/lib/models/MarketplaceListing.model');
    await MarketplaceListing.findByIdAndUpdate(order.listingId, {
      $inc: { quantityAvailable: order.quantityOrdered },
      listingStatus: ListingStatus.AVAILABLE,
    });

    await EscrowEventLog.create({
      eventType: EscrowEventType.REFUND_ISSUED,
      orderId: order._id,
      buyerId: order.buyerId,
      farmerId: order.farmerId,
      amountKES: order.totalAmountKES,
      actorId: adminId,
      actorRole: Role.ADMIN,
      ...(note !== undefined && { note }),
      occurredAt: new Date(),
    });

    // Notify the buyer their held funds were returned (non-blocking).
    (async () => {
      const { default: User } = await import('@/lib/models/User.model');
      const buyer = await User.findById(order.buyerId).select('phoneNumber').lean();
      if (buyer?.phoneNumber) {
        await sendSMS(
          buyer.phoneNumber,
          `UmojaHub: Following mediation, your KES ${order.totalAmountKES.toLocaleString()} for order ${order.orderReferenceId} has been refunded from escrow.`
        );
      }
    })().catch(() => {});

    logger.info('admin/mediation-requests', 'Escrow refunded to buyer', {
      requestId,
      orderId: String(order._id),
      amountKES: order.totalAmountKES,
      adminId,
    });
    return;
  }

  if (outcome === MediationOutcome.RELEASE) {
    const order = await Order.findOneAndUpdate(
      heldGuard,
      { $set: { fulfillmentStatus: OrderFulfillmentStatus.COMPLETED } },
      { new: true }
    ).lean();

    if (!order) {
      logger.warn('admin/mediation-requests', 'Release skipped — order not in a held state', {
        requestId,
        orderId: String(mediation.orderId),
      });
      return;
    }

    await EscrowEventLog.create({
      eventType: EscrowEventType.RELEASED,
      orderId: order._id,
      buyerId: order.buyerId,
      farmerId: order.farmerId,
      amountKES: order.totalAmountKES,
      actorId: adminId,
      actorRole: Role.ADMIN,
      ...(note !== undefined && { note }),
      occurredAt: new Date(),
    });

    // Notify the farmer their held funds were released (non-blocking).
    (async () => {
      const { default: User } = await import('@/lib/models/User.model');
      const farmer = await User.findById(order.farmerId).select('phoneNumber').lean();
      if (farmer?.phoneNumber) {
        await sendSMS(
          farmer.phoneNumber,
          `UmojaHub: Following mediation, KES ${order.totalAmountKES.toLocaleString()} for order ${order.orderReferenceId} has been released from escrow and is available to request as a payout.`
        );
      }
    })().catch(() => {});

    logger.info('admin/mediation-requests', 'Escrow released to farmer', {
      requestId,
      orderId: String(order._id),
      amountKES: order.totalAmountKES,
      adminId,
    });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const body: unknown = await req.json();
    const parsed = adminMediationDecisionSchema.safeParse(body);

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

    const { requestId: mediationId, status, resolutionNote, outcome } = parsed.data;

    if (!mongoose.isValidObjectId(mediationId)) {
      return NextResponse.json(
        { error: 'Invalid request ID.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    await connectDB();

    const updated = (await MediationRequest.findOneAndUpdate(
      { _id: mediationId, status: { $in: TRANSITION_FROM[status] } } as object,
      {
        $set: {
          status,
          ...(status === 'RESOLVED' && {
            resolvedBy: session!.user.id,
            resolvedAt: new Date(),
          }),
          ...(resolutionNote !== undefined && { resolutionNote }),
        },
      },
      { new: true }
    ).lean()) as MediationLean | null;

    if (!updated) {
      const exists = await MediationRequest.findById(mediationId).select('status').lean();
      if (!exists) {
        throw new AppError('Mediation request not found.', 404, 'DB_NOT_FOUND');
      }
      throw new AppError(
        `Cannot move a ${exists.status} request to ${status}.`,
        409,
        'MEDIATION_INVALID_STATUS_TRANSITION'
      );
    }

    logger.info('admin/mediation-requests', `Mediation request ${status.toLowerCase()}`, {
      requestId,
      mediationRequestId: mediationId,
      adminId: session!.user.id,
    });

    const auditAction: string = AUDIT_ACTION[status];
    AdminAuditLog.create({
      adminId: session!.user.id,
      action: auditAction,
      targetId: mediationId,
      targetType: 'MediationRequest',
      ...(resolutionNote !== undefined && { details: { resolutionNote, outcome } }),
    }).catch(() => {});

    // Apply the escrow decision to the held funds when resolving. Awaited so the
    // money outcome is settled before responding; failures are logged but never
    // un-resolve the mediation (admin can re-apply).
    if (
      status === MediationRequestStatus.RESOLVED &&
      (outcome === MediationOutcome.RELEASE || outcome === MediationOutcome.REFUND)
    ) {
      try {
        await applyEscrowOutcome(updated, outcome, resolutionNote, session!.user.id, requestId);
      } catch (err) {
        logger.error('admin/mediation-requests', 'Escrow outcome failed to apply', {
          requestId,
          mediationRequestId: mediationId,
          outcome,
          err,
        });
      }
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
