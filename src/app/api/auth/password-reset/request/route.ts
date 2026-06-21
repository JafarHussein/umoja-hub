import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { connectDB } from '@/lib/db';
import { passwordResetRequestSchema } from '@/lib/validation/onboardingSchema';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendPasswordResetEmail } from '@/lib/integrations/emailService';
import { handleApiError, logger } from '@/lib/utils';
import { env } from '@/lib/env';
import { UserStatus } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/auth/password-reset/request (AUTH_ONBOARDING_FLOW_V2 §10)
//
// Public (pre-auth, exempt via the /api/auth middleware prefix). Issues a
// single-use reset link to the account email. Anti-enumeration: the response is
// an identical generic 200 whether or not the email maps to a credentials-
// capable account, so it cannot be used to probe which emails exist. Throttled
// per email and per IP to curb email-bombing.
// ---------------------------------------------------------------------------

const RESET_TTL_MS = 30 * 60 * 1000;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const parsed = passwordResetRequestSchema.safeParse(body);
    // One generic success shape — never reveal anything that aids enumeration.
    const generic = NextResponse.json({ data: { sent: true } });
    if (!parsed.success) return generic;
    const { email } = parsed.data;

    const ipOk = (await checkRateLimit(`pwreset-ip:${clientIp(req)}`, 10, 15 * 60 * 1000)).allowed;
    const emailOk = (await checkRateLimit(`pwreset-email:${email}`, 3, 15 * 60 * 1000)).allowed;
    if (!ipOk || !emailOk) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    await connectDB();
    const { default: User } = await import('@/lib/models/User.model');
    const user = await User.findOne({ email }).select('status +hashedPassword').lean();

    // Only credentials-capable, active accounts get a link — but the response is
    // identical regardless, so an attacker cannot distinguish the cases.
    if (user?.hashedPassword && user.status === UserStatus.ACTIVE) {
      const { default: PasswordResetToken } = await import(
        '@/lib/models/PasswordResetToken.model'
      );
      const rawToken = randomBytes(32).toString('hex');
      await PasswordResetToken.create({
        tokenHash: sha256(rawToken),
        userId: user._id,
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      });

      const base = env('NEXTAUTH_URL').replace(/\/$/, '');
      const link = `${base}/auth/reset-password?token=${rawToken}`;
      sendPasswordResetEmail(email, link).catch(() => {
        // Already logged inside emailService.
      });
      logger.info('auth', 'Password reset link issued', { userId: String(user._id) });
    }

    return generic;
  } catch (error) {
    return handleApiError(error);
  }
}
