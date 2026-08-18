import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { lecturerReviewSchema } from '@/lib/validation/educationSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, LecturerDecision, ProjectStatus, NotificationType } from '@/types';
import { notify } from '@/lib/notifications/notify';
import type { LecturerReviewDoc } from '@/lib/models/LecturerReview.model';

// Student-facing copy for each lecturer decision.
const DECISION_NOTICE: Record<string, { title: string; body: string }> = {
  [LecturerDecision.VERIFIED]: {
    title: 'Project verified',
    body: 'A lecturer has signed off your project. Read their feedback on the review.',
  },
  [LecturerDecision.REVISION_REQUIRED]: {
    title: 'Revision requested',
    body: 'A lecturer reviewed your project and requested revisions before it can be verified.',
  },
  [LecturerDecision.DENIED]: {
    title: 'Project not verified',
    body: 'A lecturer reviewed your project and did not verify it. See the feedback for details.',
  },
};

// ---------------------------------------------------------------------------
// POST /api/lecturer/reviews — submit a lecturer review for an engagement
// Auth: LECTURER (must be verified via lecturerData.isVerified)
// Body: { engagementId, decision, scores, comments, rejectionReason? }
// Side effects (atomic where possible):
//   1. Create LecturerReview
//   2. Advance ProjectEngagement status (status guard prevents double-submit)
//   3. Append VerificationAuditLog
//   4. $inc User.studentData.completedProjectCount (if VERIFIED)
//   5. $inc LecturerEffectiveness counts
// ---------------------------------------------------------------------------

const DECISION_TO_STATUS: Record<string, ProjectStatus> = {
  [LecturerDecision.VERIFIED]: ProjectStatus.VERIFIED,
  [LecturerDecision.REVISION_REQUIRED]: ProjectStatus.REVISION_REQUIRED,
  [LecturerDecision.DENIED]: ProjectStatus.DENIED,
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.LECTURER);

    const body: unknown = await req.json();

    // Validate engagementId separately — it is not part of lecturerReviewSchema
    const rawEngagementId = (body as Record<string, unknown>)?.engagementId;
    if (typeof rawEngagementId !== 'string' || !rawEngagementId) {
      return NextResponse.json(
        { error: 'engagementId is required.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }
    if (!mongoose.isValidObjectId(rawEngagementId)) {
      return NextResponse.json(
        { error: 'Invalid engagement ID.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }
    const engagementId = rawEngagementId;

    const parsed = lecturerReviewSchema.safeParse(body);
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
    const lecturerId = session!.user.id;
    const { default: User } = await import('@/lib/models/User.model');

    const lecturer = await User.findById(lecturerId).lean();
    if (!lecturer?.lecturerData?.isVerified) {
      throw new AppError(
        'Lecturer verification required to submit reviews.',
        403,
        'LECTURER_NOT_VERIFIED'
      );
    }

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
    const { default: LecturerReview } = await import('@/lib/models/LecturerReview.model');
    const { default: VerificationAuditLog } = await import(
      '@/lib/models/VerificationAuditLog.model'
    );
    const { default: LecturerEffectiveness } = await import(
      '@/lib/models/LecturerEffectiveness.model'
    );

    const raw = await ProjectEngagement.findOne({
      _id: engagementId,
      status: ProjectStatus.UNDER_LECTURER_REVIEW,
    } as object).lean();

    if (!raw) {
      throw new AppError(
        'Engagement not found or not ready for lecturer review.',
        404,
        'DB_NOT_FOUND'
      );
    }

    // Idempotency, scoped to the pass being judged. It used to reject any second
    // review of an engagement, which meant a project sent back for revisions
    // could never be reviewed again — the student's corrected work had nowhere
    // to go. A resubmission arrives with a higher revision number and is
    // reviewable; the same pass is still judged only once.
    const revisionNumber = (raw as unknown as { revisionNumber?: number }).revisionNumber ?? 0;
    const existingReview = await LecturerReview.findOne({
      engagementId,
      revisionNumber,
    } as object).lean();
    if (existingReview) {
      throw new AppError('This revision has already been reviewed.', 409, 'DB_DUPLICATE');
    }

    const { decision, scores, comments, rejectionReason } = parsed.data;
    const newStatus = DECISION_TO_STATUS[decision] ?? ProjectStatus.REVISION_REQUIRED;

    // Build the comments object omitting overallFeedback when undefined so that
    // exactOptionalPropertyTypes is satisfied on the create() call.
    const commentsDoc: LecturerReviewDoc['comments'] = {
      problemUnderstanding: comments.problemUnderstanding,
      solutionQuality: comments.solutionQuality,
      processQuality: comments.processQuality,
      aiUsage: comments.aiUsage,
    };
    if (comments.overallFeedback !== undefined) {
      commentsDoc.overallFeedback = comments.overallFeedback;
    }

    // 1. Create LecturerReview document
    const lecturerReview = await LecturerReview.create({
      engagementId,
      lecturerId,
      revisionNumber,
      decision,
      scores,
      comments: commentsDoc,
      ...(rejectionReason !== undefined ? { rejectionReason } : {}),
    });

    // 2. Atomic engagement status transition — status guard prevents double-submission
    const setFields: Record<string, unknown> = {
      status: newStatus,
      lecturerReviewId: lecturerReview._id,
    };
    if (decision === LecturerDecision.VERIFIED) {
      setFields.verifiedAt = new Date();
    }

    const updatedEngagement = await ProjectEngagement.findOneAndUpdate(
      { _id: engagementId, status: ProjectStatus.UNDER_LECTURER_REVIEW } as object,
      { $set: setFields },
      { new: true }
    );

    if (!updatedEngagement) {
      // Race condition — clean up orphaned review and surface 409
      await LecturerReview.findByIdAndDelete(lecturerReview._id, null);
      throw new AppError(
        'Engagement status changed concurrently. Please retry.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    // 3. Append-only audit log
    const rawRecord = raw as unknown as Record<string, unknown>;
    const snap = rawRecord.githubSnapshot as
      | { commitCount?: number; lastCommitHash?: string; commitTimelineHash?: string }
      | undefined;

    await VerificationAuditLog.create({
      engagementId,
      studentId: raw.studentId,
      lecturerId,
      decision,
      documentHashes: {
        problemBreakdown: raw.documents.problemBreakdown?.hash ?? '',
        approachPlan: raw.documents.approachPlan?.hash ?? '',
        finalReflection: raw.documents.finalReflection?.hash ?? '',
      },
      githubSnapshot: {
        commitCount: snap?.commitCount ?? 0,
        lastCommitHash: snap?.lastCommitHash ?? '',
        commitTimelineHash: snap?.commitTimelineHash ?? '',
      },
      reviewScores: scores,
    });

    // 4. Student's completed-project counter (only on VERIFIED)
    if (decision === LecturerDecision.VERIFIED) {
      const { default: User } = await import('@/lib/models/User.model');
      await User.updateOne(
        { _id: raw.studentId },
        { $inc: { 'studentData.completedProjectCount': 1 } }
      );
    }

    // 5. Lecturer effectiveness counters
    const decisionIncrement =
      decision === LecturerDecision.VERIFIED
        ? { verifiedCount: 1 }
        : decision === LecturerDecision.REVISION_REQUIRED
          ? { revisionCount: 1 }
          : { deniedCount: 1 };

    await LecturerEffectiveness.findOneAndUpdate(
      { lecturerId } as object,
      { $inc: { totalReviews: 1, ...decisionIncrement }, $set: { lastReviewAt: new Date() } },
      { upsert: true }
    );

    logger.info('lecturer/reviews', 'Lecturer review submitted', {
      requestId,
      lecturerId,
      engagementId,
      decision,
      lecturerReviewId: String(lecturerReview._id),
    });

    // Notify the student of the decision (non-blocking).
    const notice = DECISION_NOTICE[decision];
    if (notice) {
      void notify({
        userId: raw.studentId,
        type: NotificationType.REVIEW_UPDATE,
        title: notice.title,
        body: notice.body,
        relatedEntity: { kind: 'ProjectEngagement', id: engagementId },
      });
    }

    // Confirm back to the lecturer that their review was recorded — closes the
    // review-completed silence so the reviewer gets closure on each assessment.
    void notify({
      userId: lecturerId,
      type: NotificationType.REVIEW_UPDATE,
      title: 'Review submitted',
      body: 'Your assessment has been recorded and the student has been notified.',
      relatedEntity: { kind: 'ProjectEngagement', id: engagementId },
    });

    // 6. Reveal the peer review only now that the decision is irreversibly
    // recorded — the detail GET withholds it to keep assessments independent.
    const { default: PeerReview } = await import('@/lib/models/PeerReview.model');
    const rawPeerReviewId = rawRecord['peerReviewId'];
    const peerReview = rawPeerReviewId
      ? await PeerReview.findById(rawPeerReviewId)
          .select('scores comments submittedAt status')
          .lean()
      : null;

    return NextResponse.json({ data: lecturerReview, peerReview }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
