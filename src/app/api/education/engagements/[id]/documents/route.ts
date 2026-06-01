import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { documentSubmissionSchema } from '@/lib/validation/educationSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, ProjectStatus } from '@/types';

// ---------------------------------------------------------------------------
// PATCH /api/education/engagements/[id]/documents — Submit a process document
// Auth: STUDENT (owns engagement)
// Engagement must be IN_PROGRESS.
// Body: { documentType: 'problemBreakdown' | 'approachPlan' | 'finalReflection', content: string }
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
    const parsed = documentSubmissionSchema.safeParse(body);

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

    const { documentType, content } = parsed.data;

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

    const engagementStatus = (engagement as { status: string }).status;

    if (engagementStatus !== ProjectStatus.IN_PROGRESS) {
      throw new AppError(
        'Documents can only be submitted when the engagement is IN_PROGRESS.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const hash = createHash('sha256').update(content).digest('hex');
    const submittedAt = new Date();

    await ProjectEngagement.findByIdAndUpdate(
      id,
      { $set: { [`documents.${documentType}`]: { content, hash, submittedAt } } },
      null
    );

    logger.info('education/engagements', 'Document submitted', {
      requestId,
      engagementId: id,
      studentId,
      documentType,
      hash,
    });

    return NextResponse.json(
      { data: { documentType, hash, submittedAt } },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
