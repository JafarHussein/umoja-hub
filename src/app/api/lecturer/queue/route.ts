import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, ProjectStatus } from '@/types';
import { cohortStudentIds } from '@/lib/education/cohort';

// ---------------------------------------------------------------------------
// GET /api/lecturer/queue — engagements from this lecturer's own institution
// that are awaiting lecturer review.
// Auth: LECTURER (must be verified via lecturerData.isVerified)
//
// The queue used to be every UNDER_LECTURER_REVIEW engagement on the platform,
// so a lecturer at one university was offered the work of students at another
// — people they have never taught and cannot mentor, and whose institution
// never asked them to assess anyone. A lecturer belongs to their students, not
// to the platform.
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

    const cohortIds = await cohortStudentIds(lecturer.lecturerData);

    if (cohortIds === null) {
      // A verified lecturer with no institution on record cannot be scoped, and
      // showing them every institution's students is the defect this replaced.
      logger.warn('lecturer/queue', 'Lecturer has no institution recorded — queue withheld', {
        requestId,
        lecturerId,
      });
      return NextResponse.json({ data: [] });
    }

    const queue = await ProjectEngagement.find({
      status: ProjectStatus.UNDER_LECTURER_REVIEW,
      studentId: { $in: cohortIds },
    } as object)
      .populate('studentId', 'firstName lastName')
      .lean();

    logger.info('lecturer/queue', 'Review queue fetched', {
      requestId,
      lecturerId,
      count: queue.length,
      cohortSize: cohortIds.length,
    });

    return NextResponse.json({ data: queue });
  } catch (error) {
    return handleApiError(error);
  }
}
