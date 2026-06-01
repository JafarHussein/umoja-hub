import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { logger } from '@/lib/utils';

// ---------------------------------------------------------------------------
// GET /api/auth/verify-email?token=<token>
// No auth required — link is sent via email.
// On success: redirects to /auth/login
// On failure: redirects to /auth/login?error=invalid_token
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid_token', req.url));
  }

  const requestId = crypto.randomUUID();
  try {
    await connectDB();

    const UserModel = (await import('@/lib/models/User.model')).default;

    const user = await UserModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpiry');

    if (!user) {
      logger.warn('auth/verify-email', 'Invalid or expired token', { requestId, token: token.slice(0, 8) });
      return NextResponse.redirect(new URL('/auth/login?error=invalid_token', req.url));
    }

    await UserModel.findByIdAndUpdate(user._id, {
      isEmailVerified: true,
      $unset: { emailVerificationToken: 1, emailVerificationExpiry: 1 },
    });

    logger.info('auth/verify-email', 'Email verified', { requestId, userId: user._id.toString() });

    return NextResponse.redirect(new URL('/auth/login?verified=1', req.url));
  } catch (error) {
    logger.error('auth/verify-email', 'Unexpected error during verification', { requestId, error });
    return NextResponse.redirect(new URL('/auth/login?error=invalid_token', req.url));
  }
}
