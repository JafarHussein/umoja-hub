import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { connectDB } from '@/lib/db';
import { hashPassword, handleApiError, AppError, logger } from '@/lib/utils';
import { registerSchema } from '@/lib/validation/authSchema';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendVerificationEmail } from '@/lib/integrations/emailService';
import { Role } from '@/types';

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    if (!(await checkRateLimit(`register:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)).allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    const body: unknown = await req.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'The submitted data is invalid. Check the details and try again.', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, phoneNumber, role, county } = parsed.data;

    await connectDB();

    const UserModel = (await import('@/lib/models/User.model')).default;

    const existing = await UserModel.findOne({ email });
    if (existing) {
      throw new AppError('An account with this email address already exists.', 409, 'DB_DUPLICATE_EMAIL');
    }

    const hashedPassword = await hashPassword(password);

    const roleDefaults = buildRoleDefaults(role);

    const user = await UserModel.create({
      email,
      hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      role,
      county,
      ...roleDefaults,
    });

    // Generate email verification token and store it (non-blocking email send)
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await UserModel.findByIdAndUpdate(user._id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    });

    sendVerificationEmail(email, verificationToken).catch(() => {
      // Already logged inside emailService
    });

    logger.info('auth', 'New user registered', { requestId, userId: user._id.toString(), role });

    return NextResponse.json(
      {
        data: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// buildRoleDefaults — initialise the correct role subdocument
// ---------------------------------------------------------------------------

function buildRoleDefaults(role: string): Record<string, unknown> {
  switch (role) {
    case Role.FARMER:
      return {
        farmerData: {
          verificationStatus: 'UNSUBMITTED',
          isVerified: false,
          cropsGrown: [],
          livestockKept: [],
        },
      };
    case Role.STUDENT:
      return {
        studentData: {
          currentTier: 'BEGINNER',
          techStackPreferences: [],
          completedProjectCount: 0,
        },
      };
    case Role.LECTURER:
      return {
        lecturerData: {
          isVerified: false,
        },
      };
    default:
      return {};
  }
}
