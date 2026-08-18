import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/education/engagements/[id]/reviews — the lecturer assessments of
// this project, oldest revision first.
// Auth: STUDENT (owns engagement)
//
// A lecturer's verdict was written, logged and notified — and then shown to
// nobody. The workspace told a student to "check lecturer feedback" with no
// screen anywhere that could display it, which is half of why a revision
// request was a dead end: even with the work reopened, there was nothing to
// tell them what to fix.
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid engagement ID.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    await connectDB();

    const studentId = session!.user.id;
    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');

    // Ownership is the gate: an engagement that is not this student's is
    // indistinguishable from one that does not exist.
    const engagement = await ProjectEngagement.findOne({ _id: id, studentId } as object)
      .select('_id')
      .lean();

    if (!engagement) {
      throw new AppError('Engagement not found.', 404, 'DB_NOT_FOUND');
    }

    const { default: LecturerReview } = await import('@/lib/models/LecturerReview.model');

    const reviews = await LecturerReview.find({ engagementId: id } as object)
      .select('revisionNumber decision scores comments rejectionReason createdAt')
      .sort({ revisionNumber: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ data: reviews });
  } catch (error) {
    return handleApiError(error);
  }
}
