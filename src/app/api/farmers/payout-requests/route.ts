import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { payoutRequestSchema } from '@/lib/validation/payoutSchema';
import { computeEscrowBalance } from '@/lib/foodhub/escrow';
import { notifyAdmins } from '@/lib/notifications/notify';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { NotificationType, Role, UserStatus, WithdrawalRequestStatus } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/farmers/payout-requests — Farmer requests a manual payout
// Auth: FARMER (ACTIVE)
// Rules: one open (REQUESTED) request at a time; amount must not exceed the
// derived available escrow balance. Settlement itself is an admin decision —
// there is no automated B2C disbursement.
// GET — Farmer's own payout request history + live balance.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    const body: unknown = await req.json();
    const parsed = payoutRequestSchema.safeParse(body);

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

    const farmerId = session!.user.id;

    const { default: User } = await import('@/lib/models/User.model');
    const farmer = await User.findById(farmerId).select('status').lean();
    if (farmer?.status !== UserStatus.ACTIVE) {
      throw new AppError('Your account has been suspended.', 403, 'ACCOUNT_SUSPENDED');
    }

    const { default: WithdrawalRequest } = await import('@/lib/models/WithdrawalRequest.model');

    // One open request at a time keeps the admin queue and the committed-
    // funds math simple: a farmer adjusts by waiting for a decision, not by
    // stacking overlapping requests.
    const openRequest = await WithdrawalRequest.findOne({
      farmerId,
      status: WithdrawalRequestStatus.REQUESTED,
    } as object)
      .select('_id')
      .lean();

    if (openRequest) {
      throw new AppError(
        'You already have a payout request awaiting review.',
        409,
        'PAYOUT_REQUEST_PENDING'
      );
    }

    const balance = await computeEscrowBalance(farmerId);

    if (parsed.data.amountKES > balance.availableKES) {
      throw new AppError(
        `Requested amount exceeds your available balance of KSh ${balance.availableKES.toLocaleString()}.`,
        409,
        'PAYOUT_INSUFFICIENT_BALANCE'
      );
    }

    // The check above is a courtesy that gives a clear message; the partial
    // unique index on WithdrawalRequest is what actually enforces the rule. Two
    // requests arriving together both clear the read, so without this the
    // second one would be created against a balance the first had already
    // spent. Translate the database's refusal back into the same answer the
    // read gives, rather than letting it surface as "Duplicate entry".
    let request;
    try {
      request = await WithdrawalRequest.create({
        farmerId,
        amountKES: parsed.data.amountKES,
        status: WithdrawalRequestStatus.REQUESTED,
      });
    } catch (createError) {
      if ((createError as { code?: number }).code === 11000) {
        throw new AppError(
          'You already have a payout request awaiting review.',
          409,
          'PAYOUT_REQUEST_PENDING'
        );
      }
      throw createError;
    }

    logger.info('farmers/payout-requests', 'Payout request created', {
      requestId,
      withdrawalRequestId: String(request._id),
      farmerId,
      amountKES: parsed.data.amountKES,
      availableKES: balance.availableKES,
    });

    // A payout request needs an admin decision before any settlement — alert the
    // admin queue so released escrow does not sit waiting on a manual check.
    void notifyAdmins({
      type: NotificationType.PAYOUT_UPDATE,
      title: 'New payout request awaiting review',
      body: `A farmer requested a payout of KSh ${parsed.data.amountKES.toLocaleString()}. Open the payout queue to approve or decline it.`,
      relatedEntity: { kind: 'WithdrawalRequest', id: String(request._id) },
    });

    return NextResponse.json(
      {
        data: request,
        balance: {
          ...balance,
          // Reflect the funds this new request just committed.
          committedPayoutsKES: balance.committedPayoutsKES + parsed.data.amountKES,
          availableKES: balance.availableKES - parsed.data.amountKES,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    await connectDB();

    const farmerId = session!.user.id;
    const { default: WithdrawalRequest } = await import('@/lib/models/WithdrawalRequest.model');

    const [requests, balance] = await Promise.all([
      WithdrawalRequest.find({ farmerId } as object)
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      computeEscrowBalance(farmerId),
    ]);

    return NextResponse.json({ data: requests, balance });
  } catch (error) {
    return handleApiError(error);
  }
}
