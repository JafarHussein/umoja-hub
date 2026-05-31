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
// PATCH /api/education/engagements/[id]/status — Begin project (BRIEF_GENERATED → IN_PROGRESS)
// Auth: STUDENT (owns engagement)
// Body: { status: 'IN_PROGRESS' }
// ---------------------------------------------------------------------------

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

    if (currentStatus !== ProjectStatus.BRIEF_GENERATED) {
      throw new AppError(
        'Engagement can only be started from BRIEF_GENERATED status.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    await ProjectEngagement.findByIdAndUpdate(id, { status: ProjectStatus.IN_PROGRESS });

    logger.info('education/engagements', 'Engagement started — BRIEF_GENERATED → IN_PROGRESS', {
      engagementId: id,
      studentId,
    });

    return NextResponse.json({ data: { status: ProjectStatus.IN_PROGRESS } });
  } catch (error) {
    return handleApiError(error);
  }
}
