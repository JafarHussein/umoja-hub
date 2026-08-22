import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { peerReviewSchema } from '@/lib/validation/educationSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, ProjectStatus, PeerReviewStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET  /api/peer-reviews/[id] — Reviewer reads their assignment
// POST /api/peer-reviews/[id] — Reviewer submits scores; advances to UNDER_LECTURER_REVIEW
// Auth: STUDENT (must be the assigned reviewer)
// ---------------------------------------------------------------------------

async function resolveParams(params: Promise<{ id: string }>) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return null;
  return id;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const id = await resolveParams(params);
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid peer review ID.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    await connectDB();

    const reviewerId = session!.user.id;
    const { default: PeerReview } = await import('@/lib/models/PeerReview.model');

    const review = await PeerReview.findOne({
      _id: id,
      reviewerId,
    } as object).lean();

    if (!review) {
      throw new AppError('Peer review assignment not found.', 404, 'DB_NOT_FOUND');
    }

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
    const engagementId = (review as { engagementId: mongoose.Types.ObjectId }).engagementId;
    const engagement = await ProjectEngagement.findById(engagementId)
      .select('brief track status')
      .lean();

    // A peer reads the report, not three separate documents. The report is the
    // one place the project is explained, so it is what there is to read — and
    // a reader who has just written their own report knows what to look for in
    // somebody else's.
    //
    // What comes back is the version list, not the document: the PDF itself is
    // fetched from the file route, which decides for each read whether this
    // peer is still entitled to it.
    const { default: ProjectDocumentation } = await import(
      '@/lib/models/ProjectDocumentation.model'
    );
    const documentation = await ProjectDocumentation.findOne({ engagementId } as object).lean();

    const { toPeerDocumentationView } = await import('@/lib/education/reportAccess');

    return NextResponse.json({
      data: {
        ...review,
        engagement: engagement ?? null,
        documentation: documentation
          ? toPeerDocumentationView(documentation as unknown as never)
          : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const id = await resolveParams(params);
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid peer review ID.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    const body: unknown = await req.json();
    const parsed = peerReviewSchema.safeParse(body);

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

    const requestId = crypto.randomUUID();
    const reviewerId = session!.user.id;
    const { default: PeerReview } = await import('@/lib/models/PeerReview.model');

    // Verify ownership first so we can return a meaningful status
    const existing = await PeerReview.findOne({ _id: id, reviewerId } as object).lean();

    if (!existing) {
      throw new AppError('Peer review assignment not found.', 404, 'DB_NOT_FOUND');
    }

    if ((existing as { status: string }).status !== PeerReviewStatus.ASSIGNED) {
      throw new AppError(
        'This peer review has already been submitted.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const { scores, comments } = parsed.data;
    const submittedAt = new Date();

    // Atomic submit — status guard prevents double-submission under concurrency
    const updated = await PeerReview.findOneAndUpdate(
      { _id: id, reviewerId, status: PeerReviewStatus.ASSIGNED } as object,
      { $set: { status: PeerReviewStatus.SUBMITTED, submittedAt, scores, comments } },
      { new: true }
    );

    if (!updated) {
      throw new AppError(
        'This peer review has already been submitted.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');

    await ProjectEngagement.findByIdAndUpdate(
      (updated as { engagementId: mongoose.Types.ObjectId }).engagementId,
      { $set: { status: ProjectStatus.UNDER_LECTURER_REVIEW } },
      null
    );

    logger.info('peer-reviews', 'Peer review submitted', {
      requestId,
      reviewId: id,
      reviewerId,
      engagementId: String((updated as { engagementId: mongoose.Types.ObjectId }).engagementId),
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
