import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User.model';
import { verificationDocSchema } from '@/lib/validation/farmerSchema';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role, VerificationStatus } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/farmers/verify — Submit verification document
// Auth: FARMER
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    const body: unknown = await req.json();
    const parsed = verificationDocSchema.safeParse(body);

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

    const farmer = await User.findById(session!.user.id);
    if (!farmer) {
      throw new AppError('The requested record was not found.', 404, 'DB_NOT_FOUND');
    }

    // Cannot re-submit if already PENDING or APPROVED
    if (farmer.farmerData?.verificationStatus === VerificationStatus.PENDING) {
      throw new AppError(
        'Your verification is under review. You will be notified when it is complete.',
        403,
        'FARMER_VERIFICATION_PENDING'
      );
    }

    if (farmer.farmerData?.verificationStatus === VerificationStatus.APPROVED) {
      throw new AppError(
        'Your farmer account is already verified.',
        409,
        'DB_DUPLICATE'
      );
    }

    const { documentType, documentImageUrl, documentNumber } = parsed.data;

    const submittedAt = new Date();

    await User.findByIdAndUpdate(session!.user.id, {
      $set: {
        'farmerData.verificationStatus': VerificationStatus.PENDING,
        'farmerData.documentType': documentType,
        'farmerData.documentImageUrl': documentImageUrl,
        'farmerData.documentNumber': documentNumber,
      },
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
