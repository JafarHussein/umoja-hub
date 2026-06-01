import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, ProjectStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/lecturer/queue — list engagements awaiting lecturer review
// Auth: LECTURER (must be verified via lecturerData.isVerified)
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    requireRole(session, Role.LECTURER);

    await connectDB();

    const lecturerId = session!.user.id;
    const { default: User } = await import('@/lib/models/User.model');

    const lecturer = await User.findById(lecturerId).lean();

    if (!lecturer?.lecturerData?.isVerified) {
      throw new AppError(
        'Lecturer verification required to access the review queue.',
        403,
        'LECTURER_NOT_VERIFIED'
      );
    }

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');

    const queue = await ProjectEngagement.find(
      { status: ProjectStatus.UNDER_LECTURER_REVIEW } as object
    )
      .populate('studentId', 'firstName lastName')
      .lean();

    logger.info('lecturer/queue', 'Review queue fetched', { requestId, lecturerId, count: queue.length });

    return NextResponse.json({ data: queue });
  } catch (error) {
    return handleApiError(error);
  }
}
