import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { mediationResponseSchema } from '@/lib/validation/mediationSchema';
import { AppError, handleApiError, logger } from '@/lib/utils';
import { notify, notifyAdmins } from '@/lib/notifications/notify';
import {
  MediationInitiator,
  MediationRequestStatus,
  NotificationType,
  Role,
} from '@/types';

// ---------------------------------------------------------------------------
// POST /api/orders/[orderId]/mediation/response — the respondent's account.
// Auth: whichever party did NOT file the escalation.
//
// A dispute decided on one side's story is not mediation, it is a complaints
// box. Until now only the filer was heard: an admin resolving a case — and
// moving real money with it — had the buyer's account and nothing else. This
// gives the other party exactly one statement, optionally with photos, before
// the decision is taken.
//
// One statement each, deliberately. This is an adjudication record, not a
// message thread; a back-and-forth would need moderation the platform has no
// way to provide.
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
    const parsed = mediationResponseSchema.safeParse(body);
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

    const { default: MediationRequest } = await import('@/lib/models/MediationRequest.model');

    const mediation = await MediationRequest.findOne({
      orderId,
      status: { $in: [MediationRequestStatus.OPEN, MediationRequestStatus.IN_REVIEW] },
    } as object).sort({ createdAt: -1 });

    if (!mediation) {
      throw new AppError(
        'There is no open escalation on this order to respond to.',
        404,
        'MEDIATION_NOT_FOUND'
      );
    }

    // Only the side that did not file may respond, and only if they are on the
    // order at all.
    const isBuyer = String(mediation.buyerId) === session.user.id;
    const isFarmer = String(mediation.farmerId) === session.user.id;
    if (!isBuyer && !isFarmer) {
      throw new AppError(
        'You do not have permission to perform this action.',
        403,
        'AUTH_FORBIDDEN'
      );
    }

    const filedByBuyer = mediation.initiatedBy === MediationInitiator.BUYER;
    if ((filedByBuyer && isBuyer) || (!filedByBuyer && isFarmer)) {
      throw new AppError(
        'You raised this escalation. The other party is the one who responds to it.',
        409,
        'MEDIATION_NOT_RESPONDENT'
      );
    }

    if (mediation.respondentStatement) {
      throw new AppError(
        'You have already given your account of this order.',
        409,
        'MEDIATION_ALREADY_ANSWERED'
      );
    }

    const now = new Date();
    mediation.respondentStatement = parsed.data.statement;
    mediation.respondentRespondedAt = now;
    const respondentRole = isBuyer ? MediationInitiator.BUYER : MediationInitiator.FARMER;
    for (const item of parsed.data.evidence ?? []) {
      mediation.evidence.push({
        ...item,
        uploadedByRole: respondentRole,
        uploadedAt: now,
      });
    }
    await mediation.save();

    logger.info('orders/mediation', 'Respondent statement recorded', {
      requestId,
      mediationRequestId: String(mediation._id),
      orderId,
      respondentRole: session.user.role,
    });

    void notify({
      userId: session.user.id,
      type: NotificationType.ORDER_UPDATE,
      title: 'Your response was recorded',
      body: 'The UmojaHub mediation team will consider both accounts before deciding what happens to the funds held in escrow.',
      relatedEntity: { kind: 'Order', id: orderId },
    });
    void notify({
      userId: String(filedByBuyer ? mediation.buyerId : mediation.farmerId),
      type: NotificationType.ORDER_UPDATE,
      title: 'The other party has responded',
      body: 'They have given their account of this order. The mediation team now has both sides and will decide.',
      relatedEntity: { kind: 'Order', id: orderId },
    });
    void notifyAdmins({
      type: NotificationType.ORDER_UPDATE,
      title: 'Dispute response received',
      body: 'Both sides have now been heard on an escalated order. Open the mediation queue to review and resolve it.',
      relatedEntity: { kind: 'Order', id: orderId },
    });

    return NextResponse.json({ data: mediation });
  } catch (error) {
    return handleApiError(error);
  }
}
