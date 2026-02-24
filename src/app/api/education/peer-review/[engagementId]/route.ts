/**
 * POST /api/education/peer-review/[engagementId]
 * Auth: STUDENT (must be the assigned peer reviewer — not the submitting student)
 * Submits a peer review with scores and comments.
 * Advances engagement to UNDER_LECTURER_REVIEW on success.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import ProjectEngagement from '@/lib/models/ProjectEngagement.model';
import PeerReview from '@/lib/models/PeerReview.model';
import { peerReviewSchema } from '@/lib/validation/educationSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, ProjectStatus, PeerReviewStatus } from '@/types';

interface RouteContext {
  params: Promise<{ engagementId: string }>;
}

export async function POST(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const { engagementId } = await context.params;

    const body: unknown = await req.json();
    const parsed = peerReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const engagement = await ProjectEngagement.findOne({
      _id: engagementId,
      status: ProjectStatus.UNDER_PEER_REVIEW,
    });

    if (!engagement) {
      throw new AppError(
        'Project engagement not found or not under peer review',
        404,
        'DB_NOT_FOUND'
      );
    }

    // Prevent the student from reviewing their own project
    if (String(engagement.studentId) === session!.user.id) {
      throw new AppError(
        'You cannot review your own project',
        409,
        'AUTH_FORBIDDEN'
      );
    }

    // Verify this user is the assigned peer reviewer
    const peerReview = await PeerReview.findOne({
      _id: engagement.peerReviewId,
      status: PeerReviewStatus.ASSIGNED,
    });

    if (!peerReview) {
      throw new AppError('Peer review not found or already submitted', 404, 'DB_NOT_FOUND');
    }

    if (String(peerReview.reviewerId) !== session!.user.id) {
      throw new AppError(
        'You are not the assigned peer reviewer for this project',
        403,
        'AUTH_FORBIDDEN'
      );
    }

    const { scores, comments } = parsed.data;

    // Update PeerReview to SUBMITTED
    peerReview.scores = scores;
    peerReview.comments = comments;
    peerReview.status = PeerReviewStatus.SUBMITTED;
    peerReview.submittedAt = new Date();
    await peerReview.save();

    // Advance engagement to UNDER_LECTURER_REVIEW
    engagement.status = ProjectStatus.UNDER_LECTURER_REVIEW;
    await engagement.save();

    logger.info('education/peer-review', 'Peer review submitted', {
      engagementId,
      reviewerId: session!.user.id,
      scores,
    });

    return NextResponse.json({
      data: {
        peerReviewId: String(peerReview._id),
        engagementId,
        status: PeerReviewStatus.SUBMITTED,
        engagementStatus: ProjectStatus.UNDER_LECTURER_REVIEW,
        submittedAt: peerReview.submittedAt?.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
