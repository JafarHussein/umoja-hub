import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User.model';
import AdminAuditLog from '@/lib/models/AdminAuditLog.model';
import { adminVerifyBuyerSchema } from '@/lib/validation/buyerSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, VerificationStatus } from '@/types';
import { sendSMS } from '@/lib/integrations/smsService';

// ---------------------------------------------------------------------------
// PATCH /api/admin/verify-buyer — Admin approves or rejects buyer KYC (BE-09)
// Auth: ADMIN. PENDING → APPROVED | REJECTED. Unlike farmers, a buyer carries
// no trust score; approval simply flips isVerified. Every decision is
// audit-logged and SMS-notified.
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const body: unknown = await req.json();
    const parsed = adminVerifyBuyerSchema.safeParse(body);

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

    const { buyerId, decision, rejectionReason } = parsed.data;

    if (decision === 'REJECTED' && !rejectionReason?.trim()) {
      return NextResponse.json(
        {
          error: 'A rejection reason is required when rejecting a verification.',
          code: 'VALIDATION_REQUIRED_FIELD',
        },
        { status: 400 }
      );
    }

    await connectDB();

    const buyer = await User.findById(buyerId);
    if (!buyer || buyer.role !== Role.BUYER) {
      throw new AppError('The requested record was not found.', 404, 'DB_NOT_FOUND');
    }

    if (buyer.buyerData?.verificationStatus !== VerificationStatus.PENDING) {
      throw new AppError(
        'This buyer does not have a pending verification.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const isApproved = decision === 'APPROVED';
    const newStatus = isApproved ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;

    await User.findByIdAndUpdate(buyerId, {
      $set: {
        'buyerData.verificationStatus': newStatus,
        'buyerData.isVerified': isApproved,
      },
    });

    logger.info('admin', `Buyer verification ${decision.toLowerCase()}`, {
      requestId,
      buyerId,
      adminId: session!.user.id,
      ...(isApproved ? {} : { rejectionReason }),
    });

    AdminAuditLog.create({
      adminId: session!.user.id,
      action: isApproved ? 'BUYER_APPROVED' : 'BUYER_REJECTED',
      targetId: buyerId,
      targetType: 'User',
      ...(isApproved ? {} : { details: { rejectionReason } }),
    }).catch(() => {});

    const smsMessage = isApproved
      ? `UmojaHub: Congratulations ${buyer.firstName}! Your buyer account has been verified. You can now place orders on the marketplace.`
      : `UmojaHub: Your verification was not approved. Reason: ${rejectionReason ?? 'Please contact support'}. Re-submit with a valid certificate.`;
    sendSMS(buyer.phoneNumber, smsMessage).catch(() => {
      // Already logged inside sendSMS
    });

    return NextResponse.json(
      { data: { buyerId, verificationStatus: newStatus } },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
