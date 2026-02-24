import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User.model';
import FarmerTrustScore from '@/lib/models/FarmerTrustScore.model';
import { adminVerifyFarmerSchema } from '@/lib/validation/farmerSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, VerificationStatus } from '@/types';
import { sendSMS } from '@/lib/integrations/smsService';

// ---------------------------------------------------------------------------
// PATCH /api/admin/verify-farmer — Admin approves or rejects farmer verification
// Auth: ADMIN
// Side effects on APPROVED: creates FarmerTrustScore, sends SMS
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const body: unknown = await req.json();
    const parsed = adminVerifyFarmerSchema.safeParse(body);

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

    const { farmerId, decision, rejectionReason } = parsed.data;

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

    const farmer = await User.findById(farmerId);
    if (!farmer || farmer.role !== Role.FARMER) {
      throw new AppError('The requested record was not found.', 404, 'DB_NOT_FOUND');
    }

    if (farmer.farmerData?.verificationStatus !== VerificationStatus.PENDING) {
      throw new AppError(
        'This farmer does not have a pending verification.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const newStatus =
      decision === 'APPROVED' ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;
    const isApproved = decision === 'APPROVED';

    // Update user verification status
    await User.findByIdAndUpdate(farmerId, {
      $set: {
        'farmerData.verificationStatus': newStatus,
        'farmerData.isVerified': isApproved,
      },
    });

    let trustScoreInitialized = false;

    if (isApproved) {
      // Create FarmerTrustScore with initial verificationScore: 40
      await FarmerTrustScore.findOneAndUpdate(
        { farmerId },
        {
          farmerId,
          verificationScore: 40,
          compositeScore: 40,
          tier: 'ESTABLISHED', // 40 pts = ESTABLISHED threshold
          lastCalculatedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      trustScoreInitialized = true;

      logger.info('admin', 'Farmer verification approved', {
        farmerId,
        adminId: session!.user.id,
      });

      // Non-blocking SMS notification
      const smsMessage = `UmojaHub: Congratulations ${farmer.firstName}! Your farmer account has been verified. You can now list your produce on the marketplace.`;
      sendSMS(farmer.phoneNumber, smsMessage).catch(() => {
        // Already logged inside sendSMS
      });
    } else {
      logger.info('admin', 'Farmer verification rejected', {
        farmerId,
        adminId: session!.user.id,
        rejectionReason,
      });

      // Non-blocking SMS notification
      const smsMessage = `UmojaHub: Your verification was not approved. Reason: ${rejectionReason ?? 'Please contact support'}. Re-submit with correct documents.`;
      sendSMS(farmer.phoneNumber, smsMessage).catch(() => {
        // Already logged inside sendSMS
      });
    }

    return NextResponse.json(
      {
        data: {
          farmerId,
          verificationStatus: newStatus,
          trustScoreInitialized,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
