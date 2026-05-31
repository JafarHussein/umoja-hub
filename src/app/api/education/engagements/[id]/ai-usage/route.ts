import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { aiUsageLogEntrySchema } from '@/lib/validation/educationSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, ProjectStatus } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/education/engagements/[id]/ai-usage — Append an AI usage log entry
// Auth: STUDENT (owns engagement)
// Engagement must be IN_PROGRESS.
// Body: { toolUsed, prompt, outputReceived, studentAction }
// source is always set to 'MANUAL' server-side — not accepted from client.
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
    const parsed = aiUsageLogEntrySchema.safeParse(body);

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
        'AI usage can only be logged when the engagement is IN_PROGRESS.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const { toolUsed, prompt, outputReceived, studentAction } = parsed.data;
    const entry = {
      toolUsed,
      prompt,
      outputReceived,
      studentAction,
      source: 'MANUAL',
      loggedAt: new Date(),
    };

    await ProjectEngagement.findByIdAndUpdate(
      id,
      { $push: { 'documents.aiUsageLog': entry } },
      null
    );

    logger.info('education/engagements', 'AI usage logged', { engagementId: id, studentId, toolUsed });

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
