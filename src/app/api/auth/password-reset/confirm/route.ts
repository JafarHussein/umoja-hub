import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { connectDB } from '@/lib/db';
import { passwordResetConfirmSchema } from '@/lib/validation/onboardingSchema';
import { checkRateLimit } from '@/lib/rateLimit';
import { AppError, handleApiError, hashSecret, logger } from '@/lib/utils';

// ---------------------------------------------------------------------------
// POST /api/auth/password-reset/confirm (AUTH_ONBOARDING_FLOW_V2 §10)
//
// Public (pre-auth). Consumes a reset token from the emailed link and sets a new
// bcrypt password. The token is matched by its SHA-256 digest and claimed
// atomically (usedAt: null + unexpired) so it can never be replayed, even under
// a race. Completing a reset also clears any brute-force lockout so a locked-out
// owner can recover. Throttled per IP to slow token guessing.
// ---------------------------------------------------------------------------

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const parsed = passwordResetConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { token, password } = parsed.data;

    if (!(await checkRateLimit(`pwreset-confirm-ip:${clientIp(req)}`, 20, 15 * 60 * 1000)).allowed) {
      throw new AppError('Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    await connectDB();
    const { default: PasswordResetToken } = await import('@/lib/models/PasswordResetToken.model');

    // Atomic single-use claim — only an unused, unexpired token matches.
    const now = new Date();
    const claimed = await PasswordResetToken.findOneAndUpdate(
      { tokenHash: sha256(token), usedAt: null, expiresAt: { $gt: now } },
      { $set: { usedAt: now } },
      { new: true }
    );
    if (!claimed) {
      throw new AppError('This reset link is invalid or has expired.', 400, 'RESET_TOKEN_INVALID');
    }

    const { default: User } = await import('@/lib/models/User.model');
    const hashedPassword = await hashSecret(password);
    await User.findByIdAndUpdate(claimed.userId, {
      $set: { hashedPassword, failedLoginAttempts: 0, lockedUntil: null },
    });

    logger.info('auth', 'Password reset completed', { userId: String(claimed.userId) });
    return NextResponse.json({ data: { reset: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
