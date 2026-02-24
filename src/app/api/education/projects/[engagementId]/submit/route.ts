/**
 * POST /api/education/projects/[engagementId]/submit
 * Auth: STUDENT (must own the engagement)
 * Validates all 5 documents complete, captures GitHub commit history, sets status to UNDER_PEER_REVIEW,
 * assigns a peer reviewer, and creates the initial VerificationAuditLog entry.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import ProjectEngagement from '@/lib/models/ProjectEngagement.model';
import PeerReview from '@/lib/models/PeerReview.model';
import VerificationAuditLog from '@/lib/models/VerificationAuditLog.model';
import User from '@/lib/models/User.model';
import { getCommitHistory } from '@/lib/integrations/githubService';
import { assignPeerReviewer } from '@/lib/educationhub/peerReviewRouter';
import { hashDocument } from '@/lib/educationhub/documentHash';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, ProjectStatus, ProjectTrack, PeerReviewStatus } from '@/types';

interface RouteContext {
  params: Promise<{ engagementId: string }>;
}

export async function POST(_req: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const { engagementId } = await context.params;

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
        'Project must be IN_PROGRESS to submit',
        409,
        'VALIDATION_FAILED'
      );
    }

    // Validate all 5 documents are complete
    const docs = engagement.documents;
    if (!docs) {
      throw new AppError('Project documents not initialized', 500, 'VALIDATION_FAILED');
    }
    const hasAllDocs = Boolean(
      docs?.problemBreakdown?.hash &&
        docs?.approachPlan?.hash &&
        docs?.finalReflection?.hash &&
        docs?.blockerLog?.length > 0 &&
        docs?.aiUsageLog?.length > 0
    );

    if (!hasAllDocs) {
      throw new AppError(
        'All 5 process documents must be completed before submission: problemBreakdown, approachPlan, finalReflection, blockerLog (at least 1 entry), aiUsageLog (at least 1 entry)',
        409,
        'EDUCATION_DOCUMENTS_INCOMPLETE'
      );
    }

    // Fetch GitHub commit history for OPEN_SOURCE projects
    let githubSnapshot = engagement.githubSnapshot ?? {};
    if (
      engagement.track === ProjectTrack.OPEN_SOURCE &&
      engagement.githubRepoName
    ) {
      const student = await User.findById(session!.user.id)
        .select('studentData.githubUsername')
        .lean();
      const githubUsername = student?.studentData?.githubUsername ?? '';

      if (githubUsername) {
        const history = await getCommitHistory(engagement.githubRepoName, githubUsername);
        if (history) {
          githubSnapshot = {
            ...history,
            snapshotAt: new Date(),
          };
        }
      }
    } else {
      // AI_BRIEF track — create a timeline hash from document hashes as substitute
      const combinedHash = hashDocument(
        [
          docs.problemBreakdown?.hash ?? '',
          docs.approachPlan?.hash ?? '',
          docs.finalReflection?.hash ?? '',
        ].join('')
      );
      githubSnapshot = {
        commitCount: 0,
        lastCommitHash: combinedHash.slice(0, 40),
        commitTimelineHash: combinedHash,
        snapshotAt: new Date(),
      };
    }

    // Assign peer reviewer
    const briefForRouting = engagement.brief as { suggestedTechStack?: string[] } | undefined;
    const reviewerId = await assignPeerReviewer({
      studentId: engagement.studentId,
      tier: engagement.tier,
      ...(briefForRouting ? { brief: briefForRouting } : {}),
    });

    // Create PeerReview record
    const peerReviewStatus = reviewerId ? PeerReviewStatus.ASSIGNED : PeerReviewStatus.WAIVED;
    const peerReview = await PeerReview.create({
      engagementId,
      reviewerId: reviewerId ?? engagement.studentId, // fallback for WAIVED
      status: peerReviewStatus,
    });

    // Update engagement status
    engagement.status = ProjectStatus.UNDER_PEER_REVIEW;
    engagement.githubSnapshot = githubSnapshot as typeof engagement.githubSnapshot;
    engagement.peerReviewId = peerReview._id;
    await engagement.save();

    // Create initial VerificationAuditLog entry (SUBMITTED event)
    // Note: a full entry is also created on VERIFIED/REVISION_REQUIRED/DENIED decision
    await VerificationAuditLog.create({
      engagementId,
      studentId: session!.user.id,
      lecturerId: session!.user.id, // placeholder — lecturer is unknown at submission
      decision: 'VERIFIED', // placeholder — will be overwritten on actual decision
      documentHashes: {
        problemBreakdown: docs.problemBreakdown?.hash ?? '',
        approachPlan: docs.approachPlan?.hash ?? '',
        finalReflection: docs.finalReflection?.hash ?? '',
      },
      githubSnapshot: {
        commitCount: (githubSnapshot as { commitCount?: number }).commitCount ?? 0,
        lastCommitHash: (githubSnapshot as { lastCommitHash?: string }).lastCommitHash ?? '',
        commitTimelineHash: (githubSnapshot as { commitTimelineHash?: string }).commitTimelineHash ?? '',
      },
      reviewScores: {
        problemUnderstanding: 0,
        solutionQuality: 0,
        processQuality: 0,
        aiUsage: 0,
      },
    });

    logger.info('education/projects/submit', 'Project submitted for review', {
      engagementId,
      studentId: session!.user.id,
      peerReviewStatus,
      reviewerId: reviewerId ? String(reviewerId) : 'WAIVED',
    });

    return NextResponse.json({
      data: {
        engagementId,
        status: ProjectStatus.UNDER_PEER_REVIEW,
        peerReviewId: String(peerReview._id),
        peerReviewStatus,
        documentHashes: {
          problemBreakdown: docs.problemBreakdown?.hash ?? '',
          approachPlan: docs.approachPlan?.hash ?? '',
          finalReflection: docs.finalReflection?.hash ?? '',
        },
        githubSnapshot,
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
