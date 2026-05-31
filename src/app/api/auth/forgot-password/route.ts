import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { connectDB } from '@/lib/db';
import { handleApiError, logger } from '@/lib/utils';
import { forgotPasswordSchema } from '@/lib/validation/authSchema';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendPasswordResetEmail } from '@/lib/integrations/emailService';

// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// No auth required.
// Always returns 200 — do not reveal whether the email exists.
// ---------------------------------------------------------------------------

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    if (!(await checkRateLimit(`forgot-password:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)).allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    const body: unknown = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid email address.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    await connectDB();

    const UserModel = (await import('@/lib/models/User.model')).default;

    const user = await UserModel.findOne({ email });

    if (!user) {
      // Return 200 to not reveal whether the account exists
      return NextResponse.json({ data: { sent: true } });
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await UserModel.findByIdAndUpdate(user._id, {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry,
    });

    sendPasswordResetEmail(email, resetToken).catch(() => {
      // Already logged inside emailService
    });

    logger.info('auth/forgot-password', 'Password reset email dispatched', {
      userId: user._id.toString(),
    });

    return NextResponse.json({ data: { sent: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
