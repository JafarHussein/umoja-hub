import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { hashPassword, handleApiError, AppError, logger } from '@/lib/utils';
import { registerSchema } from '@/lib/validation/authSchema';
import { applyRateLimit } from '@/lib/rateLimit';
import { Role } from '@/types';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate limiting — 10 requests per IP per minute
  const rateLimitResponse = applyRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
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

    logger.info('auth', 'New user registered', { userId: user._id.toString(), role });

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
