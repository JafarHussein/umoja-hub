import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { institutionalEmailVerifySchema } from '@/lib/validation/onboardingSchema';
import { checkRateLimit } from '@/lib/rateLimit';
import { AppError, handleApiError, verifySecret, logger } from '@/lib/utils';
import { Role, OnboardingStage } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/onboarding/institutional-email/verify — Stage 3 for STUDENT (AUTH-05)
// Auth: STUDENT in onboarding (stage VERIFICATION_UPLOAD). Checks the 6-digit
// pin against the bcrypt-hashed value and its expiry; on success marks the
// institutional email verified, clears the pin, and advances to COMPLETED.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }

    const body: unknown = await req.json();
    const parsed = institutionalEmailVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Throttle verification attempts to make pin brute force impractical.
    if (!(await checkRateLimit(`inst-email-verify:${session.user.id}`, 10, 15 * 60 * 1000)).allowed) {
      throw new AppError('Too many attempts. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    await connectDB();
    const { default: User } = await import('@/lib/models/User.model');

    const user = await User.findById(session.user.id)
      .select(
        'role onboardingStage studentData.institutionalEmailPinExpiry +studentData.institutionalEmailPin'
      )
      .lean();
    if (!user) {
      throw new AppError('The requested record was not found.', 404, 'DB_NOT_FOUND');
    }
    if (user.role !== Role.STUDENT) {
      throw new AppError('This step does not apply to your account.', 409, 'ONBOARDING_WRONG_ROLE');
    }
    if (user.onboardingStage !== OnboardingStage.VERIFICATION_UPLOAD) {
      throw new AppError('Complete the previous step first.', 409, 'ONBOARDING_INVALID_STAGE');
    }

    const hashedPin = user.studentData?.institutionalEmailPin;
    const expiry = user.studentData?.institutionalEmailPinExpiry;
    if (!hashedPin || !expiry) {
      throw new AppError('Request a verification code first.', 409, 'INSTITUTIONAL_PIN_MISSING');
    }
    if (new Date(expiry).getTime() < Date.now()) {
      throw new AppError('Your verification code has expired.', 410, 'INSTITUTIONAL_PIN_EXPIRED');
    }

    const isValid = await verifySecret(parsed.data.pin, hashedPin);
    if (!isValid) {
      throw new AppError('Incorrect verification code.', 400, 'INSTITUTIONAL_PIN_INVALID');
    }

    await User.findByIdAndUpdate(session.user.id, {
      $set: {
        'studentData.institutionalEmailVerified': true,
        onboardingStage: OnboardingStage.COMPLETED,
      },
      $unset: {
        'studentData.institutionalEmailPin': '',
        'studentData.institutionalEmailPinExpiry': '',
      },
    });

    logger.info('onboarding', 'Institutional email verified', { userId: session.user.id });

    return NextResponse.json({ data: { onboardingStage: OnboardingStage.COMPLETED } });
  } catch (error) {
    return handleApiError(error);
  }
}
