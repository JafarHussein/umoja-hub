import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { passwordSetupSchema } from '@/lib/validation/onboardingSchema';
import { AppError, handleApiError, hashSecret, logger } from '@/lib/utils';
import { OnboardingStage } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/onboarding/password — Stage 0: credentials setup
// (AUTH_ONBOARDING_FLOW_V3).
//
// The account already exists: OAuth created it and the caller is authenticated.
// This sets the username + password the account can fall back to when the
// identity provider is unreachable, then advances PASSWORD_SETUP →
// ROLE_SELECTION. The client calls the NextAuth update() trigger afterwards so
// the JWT picks up the new stage.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }

    const body: unknown = await req.json();
    const parsed = passwordSetupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { username, password } = parsed.data;

    await connectDB();
    const { default: User } = await import('@/lib/models/User.model');

    const user = await User.findById(session.user.id).select('onboardingStage username').lean();
    if (!user) {
      throw new AppError('The requested record was not found.', 404, 'DB_NOT_FOUND');
    }
    // Single-use: this endpoint only ever moves an account off PASSWORD_SETUP.
    // A settled account changes its password through the reset flow, not here.
    if (user.onboardingStage !== OnboardingStage.PASSWORD_SETUP) {
      throw new AppError('Your password is already set.', 409, 'ONBOARDING_INVALID_STAGE');
    }

    // The username is editable, so it can collide with somebody else's between
    // the auto-assignment at sign-in and this submit.
    if (username !== user.username) {
      const taken = await User.exists({ username, _id: { $ne: session.user.id } });
      if (taken) {
        return NextResponse.json(
          { error: 'That username is taken.', code: 'USERNAME_TAKEN' },
          { status: 409 }
        );
      }
    }

    await User.findByIdAndUpdate(session.user.id, {
      $set: {
        username,
        hashedPassword: await hashSecret(password),
        onboardingStage: OnboardingStage.ROLE_SELECTION,
      },
    });

    logger.info('onboarding', 'Credentials set for OAuth account', { userId: session.user.id });

    return NextResponse.json({
      data: { username, onboardingStage: OnboardingStage.ROLE_SELECTION },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
