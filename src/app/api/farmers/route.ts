import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { farmerProfileSchema } from '@/lib/validation/farmerSchema';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role, VerificationStatus, FarmerTrustTier } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/farmers — Authenticated farmer's own profile + trust score
// Auth: FARMER
// Onboarding edge case: farmerData absent or empty → { onboarded: false }
// Pipeline: connectDB → getServerSession → requireRole → DB lookup
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    const [{ default: User }, { default: FarmerTrustScore }] = await Promise.all([
      import('@/lib/models/User.model'),
      import('@/lib/models/FarmerTrustScore.model'),
    ]);

    const user = await User.findById(session!.user.id)
      .select('firstName lastName county phoneNumber farmerData')
      .lean();

    if (!user) {
      throw new AppError('The requested record was not found.', 404, 'DB_NOT_FOUND');
    }

    // Onboarding is considered complete only once the farmer has submitted
    // at least one crop — used by the frontend to route to /onboarding.
    const onboarded = Boolean(user.farmerData?.cropsGrown?.length);

    const trustScore = await FarmerTrustScore.findOne({ farmerId: user._id })
      .select(
        'compositeScore tier verificationScore transactionScore.scoreContribution ratingScore.scoreContribution reliabilityScore.scoreContribution'
      )
      .lean();

    return NextResponse.json({
      farmer: {
        firstName: user.firstName,
        lastName: user.lastName,
        county: user.county,
        phoneNumber: user.phoneNumber,
        farmerData: {
          cropsGrown: user.farmerData?.cropsGrown ?? [],
          farmSizeAcres: user.farmerData?.farmSizeAcres ?? null,
          verificationStatus:
            user.farmerData?.verificationStatus ?? VerificationStatus.UNSUBMITTED,
          documentType: user.farmerData?.documentType ?? null,
          isVerified: user.farmerData?.isVerified ?? false,
        },
        trustScore: trustScore
          ? {
              compositeScore: trustScore.compositeScore,
              tier: trustScore.tier,
              verificationScore: trustScore.verificationScore ?? 0,
              transactionScore: trustScore.transactionScore?.scoreContribution ?? 0,
              ratingScore: trustScore.ratingScore?.scoreContribution ?? 0,
              reliabilityScore: trustScore.reliabilityScore?.scoreContribution ?? 0,
            }
          : {
              compositeScore: 0,
              tier: FarmerTrustTier.NEW,
              verificationScore: 0,
              transactionScore: 0,
              ratingScore: 0,
              reliabilityScore: 0,
            },
      },
      onboarded,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/farmers — Farmer profile setup (crops, livestock, farm details)
// Auth: FARMER
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    const body: unknown = await req.json();
    const parsed = farmerProfileSchema
      .pick({ cropsGrown: true, livestockKept: true, farmSizeAcres: true, primaryLanguage: true })
      .safeParse(body);

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

    const { default: User } = await import('@/lib/models/User.model');

    const { cropsGrown, livestockKept, farmSizeAcres, primaryLanguage } = parsed.data;

    const updated = await User.findByIdAndUpdate(
      session!.user.id,
      {
        $set: {
          'farmerData.cropsGrown': cropsGrown,
          'farmerData.livestockKept': livestockKept ?? [],
          ...(farmSizeAcres !== undefined && { 'farmerData.farmSizeAcres': farmSizeAcres }),
          ...(primaryLanguage !== undefined && { 'farmerData.primaryLanguage': primaryLanguage }),
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new AppError('The requested record was not found.', 404, 'DB_NOT_FOUND');
    }

    const profileComplete = Boolean(
      updated.farmerData?.cropsGrown?.length && updated.farmerData.cropsGrown.length > 0
    );

    return NextResponse.json(
      { data: { id: updated.id as string, profileComplete } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
