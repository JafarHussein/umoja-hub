import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role, ProjectStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/lecturer/reviews/[engagementId]
// Returns the engagement (with peerReview populated) for the lecturer review page.
// Auth: LECTURER (must be verified)
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ engagementId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.LECTURER);

    const { engagementId } = await params;
    if (!mongoose.isValidObjectId(engagementId)) {
      return NextResponse.json(
        { error: 'Invalid engagement ID.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    await connectDB();

    const lecturerId = session!.user.id;
    const { default: User } = await import('@/lib/models/User.model');

    const lecturer = await User.findById(lecturerId).lean();
    if (!lecturer?.lecturerData?.isVerified) {
      throw new AppError(
        'Lecturer verification required to access review detail.',
        403,
        'LECTURER_NOT_VERIFIED'
      );
    }

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');

    const engagement = await ProjectEngagement.findOne({
      _id: engagementId,
      status: ProjectStatus.UNDER_LECTURER_REVIEW,
    } as object)
      .populate('studentId', 'firstName lastName')
      .populate('peerReviewId', 'scores comments submittedAt status')
      .lean();

    if (!engagement) {
      throw new AppError(
        'Engagement not found or not ready for lecturer review.',
        404,
        'DB_NOT_FOUND'
      );
    }

    return NextResponse.json({ data: engagement });
  } catch (error) {
    return handleApiError(error);
  }
}
