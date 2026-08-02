import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import AdminAuditLog from '@/lib/models/AdminAuditLog.model';
import { adminEscrowSettlementSchema } from '@/lib/validation/escrowSchema';
import { settleEscrow } from '@/lib/foodhub/escrowSettlement';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { MediationOutcome, Role } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/admin/escrow/[orderId] — settle held funds directly.
// Auth: ADMIN.
//
// The escrow console's decision surface. Until now the only way to move held
// funds was to resolve a dispute, which left the admin unable to act on an
// order that had stalled without anyone escalating it. This closes that hole
// without inventing a new money state: the two outcomes are the same two the
// mediation path uses, applied through the same guarded service.
//
// A settlement is refused unless the funds are genuinely held (PAID +
// IN_FULFILLMENT), so a double-submit returns a clean 409 rather than moving
// money twice.
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const { orderId } = await params;
    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    const body: unknown = await req.json();
    const parsed = adminEscrowSettlementSchema.safeParse(body);
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

    const { outcome, reason } = parsed.data;

    await connectDB();

    const result = await settleEscrow({
      orderId,
      outcome,
      note: reason,
      adminId: session!.user.id,
      context: 'ADMIN_DIRECT',
      requestId,
    });

    if (!result.applied) {
      throw new AppError(
        'These funds are no longer held in escrow, so they cannot be settled. Refresh the ledger to see the current state.',
        409,
        'ESCROW_NOT_HELD'
      );
    }

    // The permanent record of who moved custodial funds, and why.
    await AdminAuditLog.create({
      adminId: session!.user.id,
      action:
        outcome === MediationOutcome.REFUND ? 'ESCROW_REFUND_ISSUED' : 'ESCROW_RELEASED',
      targetId: orderId,
      targetType: 'Order',
      details: {
        outcome,
        reason,
        amountKES: result.amountKES,
        orderReferenceId: result.orderReferenceId,
        context: 'ADMIN_DIRECT',
      },
    });

    logger.info('admin/escrow', 'Escrow settled from the admin console', {
      requestId,
      adminId: session!.user.id,
      orderId,
      outcome,
      amountKES: result.amountKES,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
