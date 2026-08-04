import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { institutionalEmailSchema } from '@/lib/validation/onboardingSchema';
import { isAllowedUniversityDomain } from '@/lib/auth/universityDomains';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendInstitutionalEmailPin } from '@/lib/integrations/emailService';
import { AppError, handleApiError, hashSecret, logger } from '@/lib/utils';
import { Role } from '@/types';
import { isOnboardingComplete } from '@/lib/auth/onboarding';

// ---------------------------------------------------------------------------
// POST /api/onboarding/institutional-email — Stage 3 for STUDENT (AUTH-05)
// Auth: STUDENT in onboarding (stage VERIFICATION_UPLOAD). Issues a 6-digit pin
// to a university-domain email and stores it bcrypt-hashed with a 15-min expiry.
// Verified via POST /api/onboarding/institutional-email/verify.
// ---------------------------------------------------------------------------

const PIN_TTL_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }

    const body: unknown = await req.json();
    const parsed = institutionalEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { institutionalEmail } = parsed.data;

    if (!isAllowedUniversityDomain(institutionalEmail)) {
      throw new AppError(
        'Use an email from a recognised university domain.',
        400,
        'INSTITUTIONAL_EMAIL_DOMAIN'
      );
    }

    // Throttle pin issuance per user to curb email-bombing and brute force.
    if (!(await checkRateLimit(`inst-email:${session.user.id}`, 5, 15 * 60 * 1000)).allowed) {
      throw new AppError('Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    await connectDB();
    const { default: User } = await import('@/lib/models/User.model');

    const user = await User.findById(session.user.id).select('role onboardingStage').lean();
    if (!user) {
      throw new AppError('The requested record was not found.', 404, 'DB_NOT_FOUND');
    }
    if (user.role !== Role.STUDENT) {
      throw new AppError('This step does not apply to your account.', 409, 'ONBOARDING_WRONG_ROLE');
    }
    // Verification is demand-driven: a student reaches this from
    // /dashboard/verify, after setup has completed, not as a funnel step. The
    // guard is that setup *is* done — an account still choosing a role has no
    // institution to check an address against.
    if (!isOnboardingComplete(user.onboardingStage)) {
      throw new AppError('Finish setting up your account first.', 409, 'ONBOARDING_INVALID_STAGE');
    }

    const pin = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const hashedPin = await hashSecret(pin);
    const expiry = new Date(Date.now() + PIN_TTL_MS);

    await User.findByIdAndUpdate(session.user.id, {
      $set: {
        'studentData.institutionalEmail': institutionalEmail,
        'studentData.institutionalEmailVerified': false,
        'studentData.institutionalEmailPin': hashedPin,
        'studentData.institutionalEmailPinExpiry': expiry,
      },
    });

    sendInstitutionalEmailPin(institutionalEmail, pin).catch(() => {
      // Already logged inside emailService
    });

    logger.info('onboarding', 'Institutional email pin issued', { userId: session.user.id });

    return NextResponse.json({ data: { sent: true, expiresAt: expiry.toISOString() } });
  } catch (error) {
    return handleApiError(error);
  }
}
