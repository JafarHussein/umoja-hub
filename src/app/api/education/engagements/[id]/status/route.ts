import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, ProjectStatus } from '@/types';

const statusTransitionSchema = z.object({
  status: z.literal('IN_PROGRESS'),
});

// ---------------------------------------------------------------------------
// PATCH /api/education/engagements/[id]/status — Move the project into work
// Auth: STUDENT (owns engagement)
// Body: { status: 'IN_PROGRESS' }
//
// Two starting points, one destination:
//   BRIEF_GENERATED   → IN_PROGRESS   the student begins
//   REVISION_REQUIRED → IN_PROGRESS   the student takes the lecturer's feedback
//                                     back into the workspace, and the
//                                     engagement's revision number advances
//
// The second transition did not exist. A lecturer asking for revisions ended
// the project instead of continuing it: documents, blockers and AI-usage all
// require IN_PROGRESS, and REVISION_REQUIRED counts as an active engagement, so
// the student could neither fix the work nor start anything else.
// ---------------------------------------------------------------------------

const RESUMABLE_STATUSES: string[] = [
  ProjectStatus.BRIEF_GENERATED,
  ProjectStatus.REVISION_REQUIRED,
];

export async function PATCH(
  req: NextRequest,
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

    const body: unknown = await req.json();
    const parsed = statusTransitionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid status transition.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    await connectDB();

    const requestId = crypto.randomUUID();
    const studentId = session!.user.id;
    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');

    const engagement = await ProjectEngagement.findOne({
      _id: id,
      studentId,
    } as object).lean();

    if (!engagement) {
      throw new AppError('Engagement not found.', 404, 'DB_NOT_FOUND');
    }

    const currentStatus = (engagement as { status: string }).status;

    if (!RESUMABLE_STATUSES.includes(currentStatus)) {
      throw new AppError(
        'A project can only be started from its brief or resumed after a revision request.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const isRevision = currentStatus === ProjectStatus.REVISION_REQUIRED;

    // Filtered on the status we read, so two clicks cannot advance the revision
    // counter twice.
    const updated = await ProjectEngagement.findOneAndUpdate(
      { _id: id, studentId, status: currentStatus } as object,
      {
        $set: { status: ProjectStatus.IN_PROGRESS },
        ...(isRevision ? { $inc: { revisionNumber: 1 } } : {}),
      },
      { new: true }
    );

    if (!updated) {
      throw new AppError(
        'Engagement status changed concurrently. Please retry.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    logger.info(
      'education/engagements',
      isRevision
        ? 'Revision resumed — REVISION_REQUIRED → IN_PROGRESS'
        : 'Engagement started — BRIEF_GENERATED → IN_PROGRESS',
      { requestId, engagementId: id, studentId, revisionNumber: updated.revisionNumber }
    );

    return NextResponse.json({
      data: { status: ProjectStatus.IN_PROGRESS, revisionNumber: updated.revisionNumber },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
