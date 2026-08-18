import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { notify } from '@/lib/notifications/notify';
import { Role, ProjectStatus, PeerReviewStatus, UserStatus, NotificationType } from '@/types';
import type { ProjectEngagementDoc } from '@/lib/models/ProjectEngagement.model';
import { selectPeerReviewer } from '@/lib/education/peerReviewer';

// ---------------------------------------------------------------------------
// POST /api/education/engagements/[id]/submit — Submit project for peer review
// Auth: STUDENT (owns engagement)
// Requires: status IN_PROGRESS + all 3 process docs present
// Effect: creates PeerReview, transitions engagement → UNDER_PEER_REVIEW
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

    await connectDB();

    const requestId = crypto.randomUUID();
    const studentId = session!.user.id;
    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');

    const raw = await ProjectEngagement.findOne({
      _id: id,
      studentId,
    } as object).lean();

    if (!raw) {
      throw new AppError('Engagement not found.', 404, 'DB_NOT_FOUND');
    }

    const engagement = raw as unknown as ProjectEngagementDoc;

    if (engagement.status !== ProjectStatus.IN_PROGRESS) {
      throw new AppError(
        'Only IN_PROGRESS engagements can be submitted.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const { problemBreakdown, approachPlan, finalReflection } = engagement.documents;
    if (!problemBreakdown || !approachPlan || !finalReflection) {
      throw new AppError(
        'All three process documents (problemBreakdown, approachPlan, finalReflection) must be submitted before submitting the project.',
        422,
        'DOCUMENTS_INCOMPLETE'
      );
    }

    const { default: User } = await import('@/lib/models/User.model');
    const { default: PeerReview } = await import('@/lib/models/PeerReview.model');

    // Ask this student's own cohort first. Reading a peer's work is more useful
    // when the reader is studying alongside them, and it keeps the query bounded
    // — but a student whose institution has nobody else must still be able to
    // submit, so the search widens rather than failing.
    const author = await User.findById(studentId).select('studentData.institutionId').lean();
    const institutionId = author?.studentData?.institutionId;

    const eligible = { role: Role.STUDENT, status: UserStatus.ACTIVE, _id: { $ne: studentId } };
    let candidateDocs = institutionId
      ? await User.find({ ...eligible, 'studentData.institutionId': institutionId } as object)
          .select('_id')
          .lean()
      : [];
    if (candidateDocs.length === 0) {
      candidateDocs = await User.find(eligible as object)
        .select('_id')
        .lean();
    }

    // Outstanding assignments per candidate — the load the choice balances.
    const candidateIds = candidateDocs.map((c) => c._id);
    const openCounts = await PeerReview.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([
      { $match: { reviewerId: { $in: candidateIds }, status: PeerReviewStatus.ASSIGNED } },
      { $group: { _id: '$reviewerId', n: { $sum: 1 } } },
    ]);
    const openByReviewer = new Map(openCounts.map((row) => [String(row._id), row.n]));

    // Whoever read an earlier revision of this project has already formed a view
    // of it.
    const previousReviewers = (
      await PeerReview.find({ engagementId: id } as object)
        .select('reviewerId')
        .lean()
    ).map((r) => String(r.reviewerId));

    const reviewer = selectPeerReviewer({
      candidates: candidateDocs.map((c) => ({
        id: String(c._id),
        openAssignments: openByReviewer.get(String(c._id)) ?? 0,
      })),
      excludeIds: previousReviewers,
    });

    if (!reviewer) {
      throw new AppError(
        'No peer reviewers are currently available. Please try again later.',
        503,
        'NO_REVIEWER_AVAILABLE'
      );
    }

    const peerReview = await PeerReview.create({
      engagementId: id,
      reviewerId: reviewer.id,
      status: PeerReviewStatus.ASSIGNED,
    });

    // Atomic status transition — guard against double-submit via filter on status
    const updated = await ProjectEngagement.findOneAndUpdate(
      { _id: id, studentId, status: ProjectStatus.IN_PROGRESS } as object,
      { $set: { status: ProjectStatus.UNDER_PEER_REVIEW, peerReviewId: peerReview._id } },
      { new: true }
    );

    if (!updated) {
      // Race condition: engagement status changed between our read and update — undo peer review
      await PeerReview.findByIdAndDelete(peerReview._id, null);
      throw new AppError(
        'Engagement status changed concurrently. Please retry.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    logger.info('education/engagements', 'Project submitted for peer review', {
      requestId,
      engagementId: id,
      studentId,
      reviewerId: reviewer.id,
      peerReviewId: String(peerReview._id),
    });

    void notify({
      userId: studentId,
      type: NotificationType.REVIEW_UPDATE,
      title: 'Your project was submitted for peer review',
      body: 'Your project is now under peer review. We will let you know as soon as feedback is ready and it advances to lecturer review.',
      relatedEntity: { kind: 'ProjectEngagement', id },
    });
    void notify({
      userId: reviewer.id,
      type: NotificationType.REVIEW_UPDATE,
      title: 'You have a new peer review to complete',
      body: 'A fellow student has submitted a project for your review. Open your peer-review queue to read their work and give structured feedback.',
      relatedEntity: { kind: 'ProjectEngagement', id },
    });

    return NextResponse.json({ data: updated }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
