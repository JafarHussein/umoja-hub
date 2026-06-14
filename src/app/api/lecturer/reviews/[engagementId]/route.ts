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

    // Peer review scores are deliberately withheld here (field excluded, not
    // just unpopulated) so the lecturer's assessment is made independently —
    // the published /trust methodology promises this. The scores are revealed
    // in the POST /api/lecturer/reviews response after the decision is
    // recorded. Supersedes the earlier client-side masking approach.
    const engagement = await ProjectEngagement.findOne({
      _id: engagementId,
      status: ProjectStatus.UNDER_LECTURER_REVIEW,
    } as object)
      .select('-peerReviewId')
      .populate('studentId', 'firstName lastName')
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
