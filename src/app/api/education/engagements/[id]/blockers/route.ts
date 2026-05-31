import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { blockerLogEntrySchema } from '@/lib/validation/educationSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, ProjectStatus } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/education/engagements/[id]/blockers — Append a blocker log entry
// Auth: STUDENT (owns engagement)
// Engagement must be IN_PROGRESS.
// Body: { stuckOn, resolution, durationHours }
// ---------------------------------------------------------------------------

export async function POST(
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
    const parsed = blockerLogEntrySchema.safeParse(body);

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

    await connectDB();

    const studentId = session!.user.id;
    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');

    const engagement = await ProjectEngagement.findOne({
      _id: id,
      studentId,
    } as object).lean();

    if (!engagement) {
      throw new AppError('Engagement not found.', 404, 'DB_NOT_FOUND');
    }

    if ((engagement as { status: string }).status !== ProjectStatus.IN_PROGRESS) {
      throw new AppError(
        'Blockers can only be logged when the engagement is IN_PROGRESS.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const { stuckOn, resolution, durationHours } = parsed.data;
    const entry = { stuckOn, resolution, durationHours, loggedAt: new Date() };

    await ProjectEngagement.findByIdAndUpdate(
      id,
      { $push: { 'documents.blockerLog': entry } },
      null
    );

    logger.info('education/engagements', 'Blocker logged', { engagementId: id, studentId });

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
