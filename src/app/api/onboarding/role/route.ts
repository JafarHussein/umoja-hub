import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { roleSelectionSchema } from '@/lib/validation/onboardingSchema';
import { buildRoleDefaults } from '@/lib/auth/roleDefaults';
import { AppError, handleApiError, logger } from '@/lib/utils';
import { Role, OnboardingStage, OAuthProvider } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/onboarding/role — Stage 1: role selection (AUTH-05)
// Auth: any onboarding user (stage must be ROLE_SELECTION).
// Enforces provider↔role (GitHub → STUDENT only), seeds the role sub-document,
// and advances onboardingStage to IDENTITY_INPUT. The client must call the
// NextAuth update() trigger afterwards so the JWT picks up the new role/stage.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }

    const body: unknown = await req.json();
    const parsed = roleSelectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { role } = parsed.data;

    await connectDB();
    const { default: User } = await import('@/lib/models/User.model');

    const user = await User.findById(session.user.id)
      .select('onboardingStage oauthProvider studentData.githubUsername')
      .lean();
    if (!user) {
      throw new AppError('The requested record was not found.', 404, 'DB_NOT_FOUND');
    }
    if (user.onboardingStage !== OnboardingStage.ROLE_SELECTION) {
      throw new AppError(
        'Role has already been selected.',
        409,
        'ONBOARDING_INVALID_STAGE'
      );
    }

    // Provider↔role enforcement (Decision 01-B): GitHub is a STUDENT-only
    // identity; every other role must come from Google.
    const providerAllows =
      user.oauthProvider === OAuthProvider.GITHUB
        ? role === Role.STUDENT
        : role !== Role.STUDENT;
    if (!providerAllows) {
      throw new AppError(
        'This role is not available for your sign-in method.',
        403,
        'PROVIDER_ROLE_MISMATCH'
      );
    }

    const defaults = buildRoleDefaults(role);
    // Preserve the OAuth-sourced githubUsername captured at sign-in (UI-12).
    if (role === Role.STUDENT && user.studentData?.githubUsername) {
      defaults.studentData = {
        ...(defaults.studentData as Record<string, unknown>),
        githubUsername: user.studentData.githubUsername,
      };
    }

    await User.findByIdAndUpdate(session.user.id, {
      $set: { role, onboardingStage: OnboardingStage.IDENTITY_INPUT, ...defaults },
    });

    logger.info('onboarding', 'Role selected', { userId: session.user.id, role });

    return NextResponse.json({ data: { role, onboardingStage: OnboardingStage.IDENTITY_INPUT } });
  } catch (error) {
    return handleApiError(error);
  }
}
