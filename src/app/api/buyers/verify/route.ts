import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User.model';
import { buyerVerificationDocSchema } from '@/lib/validation/buyerSchema';
import { notify, notifyAdmins } from '@/lib/notifications/notify';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { NotificationType, Role, VerificationStatus } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/buyers/verify — Submit a tax compliance certificate for KYC (BE-09)
// Auth: BUYER. Sets buyerData.verificationStatus to PENDING and feeds the
// admin buyer-verification queue. Cannot re-submit while PENDING or APPROVED.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.BUYER);

    const body: unknown = await req.json();
    const parsed = buyerVerificationDocSchema.safeParse(body);

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

    const buyer = await User.findById(session!.user.id);
    if (!buyer) {
      throw new AppError('The requested record was not found.', 404, 'DB_NOT_FOUND');
    }

    if (buyer.buyerData?.verificationStatus === VerificationStatus.PENDING) {
      throw new AppError(
        'Your verification is under review. You will be notified when it is complete.',
        403,
        'BUYER_VERIFICATION_PENDING'
      );
    }

    if (buyer.buyerData?.verificationStatus === VerificationStatus.APPROVED) {
      throw new AppError('Your buyer account is already verified.', 409, 'DB_DUPLICATE');
    }

    const submittedAt = new Date();

    await User.findByIdAndUpdate(session!.user.id, {
      $set: {
        'buyerData.verificationStatus': VerificationStatus.PENDING,
        'buyerData.taxComplianceCertificate': parsed.data.taxComplianceCertificate,
      },
    });

    // Acknowledge the submission to the buyer and alert the admin queue. Mirrors
    // the onboarding-funnel verification route so both submission paths communicate.
    void notify({
      userId: session!.user.id,
      type: NotificationType.VERIFICATION_UPDATE,
      title: 'Verification received — your documents are under review',
      body: 'Thank you — we have received your tax compliance certificate and an administrator will review it shortly. We will let you know as soon as your account is verified.',
      relatedEntity: { kind: 'User', id: session!.user.id },
    });
    void notifyAdmins({
      type: NotificationType.VERIFICATION_UPDATE,
      title: 'New verification request',
      body: 'A buyer submitted a tax compliance certificate for verification. Open the verification queue to review.',
      relatedEntity: { kind: 'User', id: session!.user.id },
    });

    return NextResponse.json(
      {
        data: {
          verificationStatus: VerificationStatus.PENDING,
          submittedAt: submittedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
