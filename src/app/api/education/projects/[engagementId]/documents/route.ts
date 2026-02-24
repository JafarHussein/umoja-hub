/**
 * PATCH /api/education/projects/[engagementId]/documents
 * Auth: STUDENT (must own the engagement)
 * Submits a process document with server-side timestamp and SHA-256 content hash.
 * Students cannot manipulate timestamps — they are set server-side only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import ProjectEngagement from '@/lib/models/ProjectEngagement.model';
import { documentSubmissionSchema } from '@/lib/validation/educationSchema';
import { hashDocument } from '@/lib/educationhub/documentHash';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, ProjectStatus } from '@/types';

interface RouteContext {
  params: Promise<{ engagementId: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const { engagementId } = await context.params;

    const body: unknown = await req.json();
    const parsed = documentSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { documentType, content } = parsed.data;

    await connectDB();

    const engagement = await ProjectEngagement.findOne({
      _id: engagementId,
      studentId: session!.user.id,
    });

    if (!engagement) {
      throw new AppError('Project engagement not found', 404, 'DB_NOT_FOUND');
    }

    if (engagement.status !== ProjectStatus.IN_PROGRESS) {
      throw new AppError(
        'Documents can only be submitted when the project is in progress',
        409,
        'VALIDATION_FAILED'
      );
    }

    // Server-side timestamp — student cannot manipulate this
    const submittedAt = new Date();
    const contentHash = hashDocument(content);

    // Update the specific document in the engagement
    const updateKey = `documents.${documentType}`;
    await ProjectEngagement.updateOne(
      { _id: engagementId },
      {
        $set: {
          [updateKey]: { content, hash: contentHash, submittedAt },
        },
      }
    );

    // Re-fetch to check completeness
    const updated = await ProjectEngagement.findById(engagementId).lean();
    const docs = updated?.documents;

    const allDocumentsComplete = Boolean(
      docs?.problemBreakdown?.hash &&
        docs?.approachPlan?.hash &&
        docs?.finalReflection?.hash
    );

    logger.info('education/projects/documents', 'Document submitted', {
      engagementId,
      documentType,
      contentHash,
      allDocumentsComplete,
    });

    return NextResponse.json({
      data: {
        documentType,
        submittedAt: submittedAt.toISOString(),
        contentHash,
        allDocumentsComplete,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
