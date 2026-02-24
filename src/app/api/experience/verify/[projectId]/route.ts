/**
 * GET /api/experience/verify/[projectId]
 * Auth: None (public — employer verification URL)
 * Returns project verification data. Returns 404 if project is not VERIFIED.
 * This URL is immutable and permanent — do not add authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ProjectEngagement from '@/lib/models/ProjectEngagement.model';
import LecturerReview from '@/lib/models/LecturerReview.model';
import PeerReview from '@/lib/models/PeerReview.model';
import VerificationAuditLog from '@/lib/models/VerificationAuditLog.model';
import User from '@/lib/models/User.model';
import { AppError, handleApiError } from '@/lib/utils';
import { ProjectStatus } from '@/types';

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { projectId } = await context.params;

    await connectDB();

    // Only VERIFIED projects are publicly accessible
    const engagement = await ProjectEngagement.findOne({
      _id: projectId,
      status: ProjectStatus.VERIFIED,
    }).lean();

    if (!engagement) {
      throw new AppError('Verified project not found', 404, 'DB_NOT_FOUND');
    }

    // Load student (public-safe fields only)
    const [student, lecturerReview, peerReview, auditLog] = await Promise.all([
      User.findById(engagement.studentId)
        .select('firstName lastName county studentData.universityAffiliation studentData.githubUsername')
        .lean(),
      LecturerReview.findById(engagement.lecturerReviewId).lean(),
      engagement.peerReviewId
        ? PeerReview.findById(engagement.peerReviewId).lean()
        : Promise.resolve(null),
      VerificationAuditLog.findOne({
        engagementId: projectId,
        decision: ProjectStatus.VERIFIED,
      })
        .sort({ recordedAt: -1 })
        .lean(),
    ]);

    if (!student) {
      throw new AppError('Verified project not found', 404, 'DB_NOT_FOUND');
    }

    // Load lecturer (public-safe fields only)
    const lecturer = lecturerReview
      ? await User.findById(lecturerReview.lecturerId)
          .select('firstName lastName lecturerData.universityAffiliation')
          .lean()
      : null;

    const brief = engagement.brief as Record<string, unknown> | undefined;

    return NextResponse.json({
      data: {
        verificationUrl: engagement.verificationUrl,
        verifiedAt: engagement.verifiedAt?.toISOString() ?? null,
        project: {
          id: String(engagement._id),
          title: (brief?.projectTitle as string) ?? engagement.githubRepoName ?? 'Open Source Project',
          track: engagement.track,
          tier: engagement.tier,
          githubRepoUrl: engagement.githubRepoUrl ?? null,
          brief: brief
            ? {
                projectTitle: brief.projectTitle,
                clientPersona: brief.clientPersona,
                problemStatement: brief.problemStatement,
                suggestedTechStack: brief.suggestedTechStack,
                industryContext: brief.industryContext,
              }
            : null,
        },
        student: {
          firstName: student.firstName,
          lastName: student.lastName,
          county: student.county,
          universityAffiliation: student.studentData?.universityAffiliation ?? null,
          githubUsername: student.studentData?.githubUsername ?? null,
        },
        review: lecturerReview
          ? {
              decision: lecturerReview.decision,
              scores: lecturerReview.scores,
              lecturerName: lecturer
                ? `${lecturer.firstName} ${lecturer.lastName}`
                : 'Verified Lecturer',
              lecturerInstitution: lecturer?.lecturerData?.universityAffiliation ?? null,
              reviewedAt: (lecturerReview.createdAt as Date).toISOString(),
            }
          : null,
        peerReview: peerReview
          ? {
              status: peerReview.status,
              scores: peerReview.scores,
            }
          : null,
        integrity: auditLog
          ? {
              documentHashes: auditLog.documentHashes,
              githubSnapshot: auditLog.githubSnapshot,
              recordedAt: auditLog.recordedAt.toISOString(),
            }
          : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
