import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User.model';
import FarmerTrustScore from '@/lib/models/FarmerTrustScore.model';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/farmers/me — Authenticated farmer's own profile + trust score
// Auth: FARMER
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    await connectDB();

    const user = await User.findById(session!.user.id)
      .select(
        'firstName lastName email phoneNumber county status farmerData createdAt updatedAt'
      )
      .lean();

    if (!user) {
      throw new AppError('The requested record was not found.', 404, 'DB_NOT_FOUND');
    }

    const trustScore = await FarmerTrustScore.findOne({ farmerId: user._id })
      .select(
        'compositeScore tier verificationScore transactionScore ratingScore reliabilityScore lastCalculatedAt'
      )
      .lean();

    return NextResponse.json({
      data: {
        id: String(user._id),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        county: user.county,
        status: user.status,
        farmerData: user.farmerData ?? null,
        trustScore: trustScore
          ? {
              compositeScore: trustScore.compositeScore,
              tier: trustScore.tier,
              verificationScore: trustScore.verificationScore,
              transactionScore: trustScore.transactionScore,
              ratingScore: trustScore.ratingScore,
              reliabilityScore: trustScore.reliabilityScore,
              lastCalculatedAt: trustScore.lastCalculatedAt ?? null,
            }
          : null,
        createdAt: (user.createdAt as Date).toISOString(),
        updatedAt: (user.updatedAt as Date).toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
