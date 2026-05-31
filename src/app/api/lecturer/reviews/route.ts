import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { lecturerReviewSchema } from '@/lib/validation/educationSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, LecturerDecision, ProjectStatus } from '@/types';
import type { LecturerReviewDoc } from '@/lib/models/LecturerReview.model';

// ---------------------------------------------------------------------------
// POST /api/lecturer/reviews — submit a lecturer review for an engagement
// Auth: LECTURER (must be verified via lecturerData.isVerified)
// Body: { engagementId, decision, scores, comments, rejectionReason? }
// Side effects (atomic where possible):
//   1. Create LecturerReview
//   2. Advance ProjectEngagement status (status guard prevents double-submit)
//   3. Append VerificationAuditLog
//   4. $inc StudentPortfolioStatus.stats.verifiedProjectCount (if VERIFIED)
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
    const { default: StudentPortfolioStatus } = await import(
      '@/lib/models/StudentPortfolioStatus.model'
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

    // Idempotency: prevent duplicate reviews for the same engagement
    const existingReview = await LecturerReview.findOne({ engagementId } as object).lean();
    if (existingReview) {
      throw new AppError('A review for this engagement already exists.', 409, 'DB_DUPLICATE');
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

    // 4. Portfolio stats increment (only on VERIFIED)
    if (decision === LecturerDecision.VERIFIED) {
      await StudentPortfolioStatus.findOneAndUpdate(
        { studentId: raw.studentId } as object,
        { $inc: { 'stats.verifiedProjectCount': 1 } },
        { upsert: true }
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
      lecturerId,
      engagementId,
      decision,
      lecturerReviewId: String(lecturerReview._id),
    });

    return NextResponse.json({ data: lecturerReview }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
