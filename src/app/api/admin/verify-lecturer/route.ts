import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import AdminAuditLog from '@/lib/models/AdminAuditLog.model';
import { adminVerifyLecturerSchema } from '@/lib/validation/educationSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/admin/verify-lecturer — Admin grants lecturer verification
// Auth: ADMIN
// Body: { lecturerId: string }
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const body: unknown = await req.json();
    const parsed = adminVerifyLecturerSchema.safeParse(body);

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

    const { lecturerId } = parsed.data;

    await connectDB();

    const { default: User } = await import('@/lib/models/User.model');

    const lecturer = await User.findById(lecturerId);

    if (!lecturer || lecturer.role !== Role.LECTURER) {
      throw new AppError('Lecturer not found.', 404, 'DB_NOT_FOUND');
    }

    if (lecturer.lecturerData?.isVerified) {
      throw new AppError('This lecturer is already verified.', 409, 'LECTURER_ALREADY_VERIFIED');
    }

    await User.findByIdAndUpdate(lecturerId, {
      $set: { 'lecturerData.isVerified': true },
    });

    logger.info('admin', 'Lecturer verified', {
      requestId,
      lecturerId,
      adminId: session!.user.id,
    });

    AdminAuditLog.create({
      adminId: session!.user.id,
      action: 'LECTURER_VERIFIED',
      targetId: lecturerId,
      targetType: 'User',
    }).catch(() => {});

    return NextResponse.json(
      { data: { lecturerId, isVerified: true } },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
