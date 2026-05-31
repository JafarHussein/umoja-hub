import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { hashPassword, handleApiError, AppError, logger } from '@/lib/utils';
import { resetPasswordSchema } from '@/lib/validation/authSchema';
import { checkRateLimit } from '@/lib/rateLimit';

// ---------------------------------------------------------------------------
// POST /api/auth/reset-password
// No auth required — token from the reset email is the credential.
// Body: { token: string, newPassword: string }
// ---------------------------------------------------------------------------

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    if (!(await checkRateLimit(`reset-password:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)).allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    const body: unknown = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'The submitted data is invalid.',
          code: 'VALIDATION_FAILED',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { token, newPassword } = parsed.data;

    await connectDB();

    const UserModel = (await import('@/lib/models/User.model')).default;

    const user = await UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpiry');

    if (!user) {
      throw new AppError(
        'This reset link is invalid or has expired. Please request a new one.',
        400,
        'AUTH_INVALID_RESET_TOKEN'
      );
    }

    const newHashedPassword = await hashPassword(newPassword);

    await UserModel.findByIdAndUpdate(user._id, {
      hashedPassword: newHashedPassword,
      $unset: { passwordResetToken: 1, passwordResetExpiry: 1 },
    });

    logger.info('auth/reset-password', 'Password reset completed', {
      userId: user._id.toString(),
    });

    return NextResponse.json({ data: { reset: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
