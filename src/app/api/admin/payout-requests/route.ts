import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import WithdrawalRequest from '@/lib/models/WithdrawalRequest.model';
import AdminAuditLog from '@/lib/models/AdminAuditLog.model';
import { adminPayoutDecisionSchema } from '@/lib/validation/payoutSchema';
import { sendSMS } from '@/lib/integrations/smsService';
import { notify } from '@/lib/notifications/notify';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, WithdrawalRequestStatus, NotificationType } from '@/types';

// ---------------------------------------------------------------------------
// GET  /api/admin/payout-requests — Paginated payout queue (default REQUESTED)
// PATCH /api/admin/payout-requests — Decide a request
//   REQUESTED → APPROVED            (admin commits to paying)
//   REQUESTED → REJECTED            (note/reason required; frees the funds)
//   APPROVED  → PAID                (manual M-Pesa transfer done; note = ref)
// Auth: ADMIN. Every decision is audit-logged and SMS-notified.
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status') ?? WithdrawalRequestStatus.REQUESTED;
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);

    if (!Object.values(WithdrawalRequestStatus).includes(statusParam as WithdrawalRequestStatus)) {
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

    const requests = await WithdrawalRequest.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = requests.length > limit;
    const page = hasMore ? requests.slice(0, limit) : requests;
    const nextCursor = hasMore ? (page.at(-1)?._id?.toString() ?? null) : null;

    // Enrich with farmer identity for the queue table.
    const { default: User } = await import('@/lib/models/User.model');
    const farmerIds = [...new Set(page.map((r) => String(r.farmerId)))];
    const farmers = await User.find({ _id: { $in: farmerIds } })
      .select('firstName lastName phoneNumber county')
      .lean();
    const farmerMap = new Map(farmers.map((f) => [String(f._id), f]));

    const data = page.map((r) => {
      const farmer = farmerMap.get(String(r.farmerId));
      return {
        ...r,
        farmer: farmer
          ? {
              firstName: farmer.firstName,
              lastName: farmer.lastName,
              phoneNumber: farmer.phoneNumber,
              county: farmer.county,
            }
          : null,
      };
    });

    const queueSize = await WithdrawalRequest.countDocuments({
      status: WithdrawalRequestStatus.REQUESTED,
    });

    return NextResponse.json({ data, nextCursor, meta: { queueSize } });
  } catch (error) {
    return handleApiError(error);
  }
}

type PayoutDecision = 'APPROVED' | 'REJECTED' | 'PAID';

// Allowed transitions: decision → required current status.
const TRANSITION_FROM: Record<PayoutDecision, WithdrawalRequestStatus> = {
  APPROVED: WithdrawalRequestStatus.REQUESTED,
  REJECTED: WithdrawalRequestStatus.REQUESTED,
  PAID: WithdrawalRequestStatus.APPROVED,
};

const AUDIT_ACTION: Record<PayoutDecision, string> = {
  APPROVED: 'PAYOUT_APPROVED',
  REJECTED: 'PAYOUT_REJECTED',
  PAID: 'PAYOUT_MARKED_PAID',
};

type WithdrawalLean = {
  _id: unknown;
  farmerId: unknown;
  amountKES: number;
  status: string;
  note?: string;
};

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const body: unknown = await req.json();
    const parsed = adminPayoutDecisionSchema.safeParse(body);

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

    const { requestId: withdrawalId, decision, note } = parsed.data;

    if (!mongoose.isValidObjectId(withdrawalId)) {
      return NextResponse.json(
        { error: 'Invalid request ID.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    await connectDB();

    // Atomic, status-guarded transition — a concurrent decision on the same
    // request loses the race and surfaces a clean 409.
    const updated = (await WithdrawalRequest.findOneAndUpdate(
      { _id: withdrawalId, status: TRANSITION_FROM[decision] } as object,
      {
        $set: {
          status: decision,
          resolvedBy: session!.user.id,
          resolvedAt: new Date(),
          ...(note !== undefined && { note }),
        },
      },
      { new: true }
    ).lean()) as WithdrawalLean | null;

    if (!updated) {
      const exists = await WithdrawalRequest.findById(withdrawalId).select('status').lean();
      if (!exists) {
        throw new AppError('Payout request not found.', 404, 'DB_NOT_FOUND');
      }
      throw new AppError(
        `Cannot mark a ${exists.status} request as ${decision}.`,
        409,
        'PAYOUT_INVALID_STATUS_TRANSITION'
      );
    }

    logger.info('admin/payout-requests', `Payout request ${decision.toLowerCase()}`, {
      requestId,
      withdrawalRequestId: withdrawalId,
      adminId: session!.user.id,
      amountKES: updated.amountKES,
    });

    const auditAction: string = AUDIT_ACTION[decision];
    AdminAuditLog.create({
      adminId: session!.user.id,
      action: auditAction,
      targetId: withdrawalId,
      targetType: 'WithdrawalRequest',
      ...(note !== undefined && { details: { note } }),
    }).catch(() => {});

    // Non-blocking SMS to the farmer.
    (async () => {
      const { default: User } = await import('@/lib/models/User.model');
      const farmer = await User.findById(updated.farmerId)
        .select('firstName phoneNumber')
        .lean();
      if (!farmer) return;

      const amount = `KSh ${updated.amountKES.toLocaleString()}`;
      const message =
        decision === 'APPROVED'
          ? `UmojaHub: Your payout request for ${amount} has been approved and is being processed.`
          : decision === 'PAID'
            ? `UmojaHub: Your payout of ${amount} has been sent to your M-Pesa number.`
            : `UmojaHub: Your payout request for ${amount} was not approved. Reason: ${note ?? 'Contact support'}.`;

      await sendSMS(farmer.phoneNumber, message);
      void notify({
        userId: String(updated.farmerId),
        type: NotificationType.PAYOUT_UPDATE,
        title: `Payout ${decision.toLowerCase()}`,
        body: message.replace('UmojaHub: ', ''),
        relatedEntity: { kind: 'WithdrawalRequest', id: withdrawalId },
      });
    })().catch(() => {
      // sendSMS logs its own failures
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
