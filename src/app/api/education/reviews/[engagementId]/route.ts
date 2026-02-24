/**
 * POST /api/education/reviews/[engagementId]
 * Auth: LECTURER
 * Submits a lecturer review with 50-word minimum enforcement on all 4 comment fields.
 * On VERIFIED decision: runs the full cascade (skills, portfolio, audit log, notifications).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import ProjectEngagement from '@/lib/models/ProjectEngagement.model';
import LecturerReview from '@/lib/models/LecturerReview.model';
import LecturerEffectiveness from '@/lib/models/LecturerEffectiveness.model';
import StudentPortfolioStatus from '@/lib/models/StudentPortfolioStatus.model';
import VerificationAuditLog from '@/lib/models/VerificationAuditLog.model';
import User from '@/lib/models/User.model';
import { lecturerReviewSchema } from '@/lib/validation/educationSchema';
import { calculateTier, calculatePortfolioStrength, extractSkills } from '@/lib/trust/portfolioTierer';
import { getRepoLanguages } from '@/lib/integrations/githubService';
import { AppError, handleApiError, requireRole, countWords, logger } from '@/lib/utils';
import { Role, ProjectStatus, LecturerDecision, StudentTier, REVIEW_MIN_WORD_COUNT } from '@/types';
import type { IStudentPortfolioStatus, IVerifiedProject } from '@/types/education';
import { sendSMS } from '@/lib/integrations/smsService';

interface RouteContext {
  params: Promise<{ engagementId: string }>;
}

export async function POST(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.LECTURER);

    const { engagementId } = await context.params;

    const body: unknown = await req.json();
    const parsed = lecturerReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Server-side 50-word enforcement (belt-and-suspenders beyond Zod)
    const { decision, scores, comments } = parsed.data;
    const commentFields = ['problemUnderstanding', 'solutionQuality', 'processQuality', 'aiUsage'] as const;

    for (const field of commentFields) {
      const wordCount = countWords(comments[field]);
      if (wordCount < REVIEW_MIN_WORD_COUNT) {
        return NextResponse.json(
          {
            error: `Comment for "${field}" must be at least ${REVIEW_MIN_WORD_COUNT} words (got ${wordCount})`,
            code: 'VALIDATION_COMMENT_TOO_SHORT',
            field,
          },
          { status: 400 }
        );
      }
    }

    await connectDB();

    const engagement = await ProjectEngagement.findOne({
      _id: engagementId,
      status: ProjectStatus.UNDER_LECTURER_REVIEW,
    });

    if (!engagement) {
      throw new AppError(
        'Project engagement not found or not under lecturer review',
        404,
        'DB_NOT_FOUND'
      );
    }

    // Create the LecturerReview record (APPEND-ONLY)
    const lecturerReview = (await LecturerReview.create({
      engagementId,
      lecturerId: session!.user.id,
      decision,
      scores,
      comments,
      ...(parsed.data.rejectionReason ? { rejectionReason: parsed.data.rejectionReason } : {}),
    } as Record<string, unknown>)) as unknown as { _id: { toString(): string }; createdAt: Date };

    // Map decision to ProjectStatus
    const statusMap: Record<LecturerDecision, ProjectStatus> = {
      [LecturerDecision.VERIFIED]: ProjectStatus.VERIFIED,
      [LecturerDecision.REVISION_REQUIRED]: ProjectStatus.REVISION_REQUIRED,
      [LecturerDecision.DENIED]: ProjectStatus.DENIED,
    };
    const newEngagementStatus = statusMap[decision];

    // Update engagement status
    engagement.status = newEngagementStatus;
    (engagement as unknown as Record<string, unknown>)['lecturerReviewId'] = lecturerReview._id;

    if (decision === LecturerDecision.VERIFIED) {
      engagement.verifiedAt = new Date();
      engagement.verificationUrl = `/experience/verify/${engagementId}`;
    }

    await engagement.save();

    // ---------------------------------------------------------------------------
    // VERIFIED cascade
    // ---------------------------------------------------------------------------
    if (decision === LecturerDecision.VERIFIED) {
      await runVerifiedCascade({
        engagement,
        lecturerReview,
        lecturerId: session!.user.id,
        scores,
        comments,
      });
    }

    // ---------------------------------------------------------------------------
    // Update LecturerEffectiveness (all decisions)
    // ---------------------------------------------------------------------------
    await updateLecturerEffectiveness({
      lecturerId: session!.user.id,
      decision,
      scores,
      comments,
    });

    // ---------------------------------------------------------------------------
    // Append final VerificationAuditLog entry
    // ---------------------------------------------------------------------------
    const docs = engagement.documents;
    await VerificationAuditLog.create({
      engagementId,
      studentId: engagement.studentId,
      lecturerId: session!.user.id,
      decision,
      documentHashes: {
        problemBreakdown: docs?.problemBreakdown?.hash ?? '',
        approachPlan: docs?.approachPlan?.hash ?? '',
        finalReflection: docs?.finalReflection?.hash ?? '',
      },
      githubSnapshot: {
        commitCount: engagement.githubSnapshot?.commitCount ?? 0,
        lastCommitHash: engagement.githubSnapshot?.lastCommitHash ?? '',
        commitTimelineHash: engagement.githubSnapshot?.commitTimelineHash ?? '',
      },
      reviewScores: scores,
    });

    logger.info('education/reviews', 'Lecturer review submitted', {
      engagementId,
      lecturerId: session!.user.id,
      decision,
    });

    return NextResponse.json(
      {
        data: {
          reviewId: String(lecturerReview._id),
          engagementId,
          decision,
          engagementStatus: newEngagementStatus,
          verificationUrl:
            decision === LecturerDecision.VERIFIED
              ? `/experience/verify/${engagementId}`
              : undefined,
          createdAt: (lecturerReview.createdAt as Date).toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// VERIFIED cascade — runs only when decision = VERIFIED
// ---------------------------------------------------------------------------

interface CascadeInput {
  engagement: Awaited<ReturnType<typeof ProjectEngagement.findOne>>;
  lecturerReview: { _id: unknown };
  lecturerId: string;
  scores: {
    problemUnderstanding: number;
    solutionQuality: number;
    processQuality: number;
    aiUsage: number;
  };
  comments: Record<string, string | undefined>;
}

async function runVerifiedCascade(input: CascadeInput): Promise<void> {
  const { engagement, scores, lecturerId } = input;

  if (!engagement) return;

  const averageScore =
    (scores.problemUnderstanding +
      scores.solutionQuality +
      scores.processQuality +
      scores.aiUsage) /
    4;

  // Get lecturer institution for portfolio record
  const lecturer = await User.findById(lecturerId)
    .select('lecturerData.universityAffiliation')
    .lean();
  const lecturerInstitution = lecturer?.lecturerData?.universityAffiliation ?? 'Unknown Institution';

  // Extract GitHub languages for skill confirmation
  let githubLanguages: string[] = [];
  if (engagement.githubRepoName) {
    githubLanguages = await getRepoLanguages(engagement.githubRepoName);
  }

  const brief = engagement.brief as { projectTitle?: string; suggestedTechStack?: string[] } | undefined;
  const suggestedTechStack = brief?.suggestedTechStack ?? [];
  const projectTitle = brief?.projectTitle ?? engagement.githubRepoName ?? 'Untitled Project';

  // Extract and categorise skills
  const extractedSkills = extractSkills({
    suggestedTechStack,
    githubLanguages,
  });

  // Load existing portfolio status
  const portfolioStatus = await StudentPortfolioStatus.findOne({
    studentId: engagement.studentId,
  });

  if (!portfolioStatus) {
    logger.warn('education/reviews', 'StudentPortfolioStatus missing for verified student', {
      studentId: String(engagement.studentId),
    });
    return;
  }

  // Add verified project to portfolio
  const newVerifiedProject: IVerifiedProject = {
    engagementId: String(engagement._id),
    title: projectTitle,
    tier: engagement.tier as StudentTier,
    techStack: suggestedTechStack,
    verifiedAt: new Date(),
    averageScore,
    lecturerInstitution,
  };

  portfolioStatus.verifiedProjects.push(newVerifiedProject as unknown as typeof portfolioStatus.verifiedProjects[0]);

  // Upsert verified skills (avoid duplicates by skillName)
  for (const skill of extractedSkills) {
    const existing = (portfolioStatus.verifiedSkills as Array<{ skillName: string }>).find(
      (s) => s.skillName === skill.skillName
    );
    if (!existing) {
      portfolioStatus.verifiedSkills.push({
        skillName: skill.skillName,
        category: skill.category,
        tierDemonstrated: engagement.tier as StudentTier,
        firstVerifiedAt: new Date(),
        projectTitle,
        engagementId: String(engagement._id),
      } as unknown as typeof portfolioStatus.verifiedSkills[0]);
    }
  }

  // Recalculate tier
  const newTier = calculateTier(
    (portfolioStatus.verifiedProjects as unknown as IVerifiedProject[]).map((p) => ({
      ...p,
      engagementId: String(p.engagementId),
    }))
  );
  const previousTier = portfolioStatus.currentTier as StudentTier;

  if (newTier !== previousTier) {
    portfolioStatus.currentTier = newTier;
    portfolioStatus.tierProgressionTimeline.push({ tier: newTier, unlockedAt: new Date() } as unknown as typeof portfolioStatus.tierProgressionTimeline[0]);

    // Update User.studentData.currentTier to keep in sync
    await User.updateOne(
      { _id: engagement.studentId },
      { $set: { 'studentData.currentTier': newTier } }
    );
  }

  // Update stats
  portfolioStatus.stats!.verifiedProjectCount += 1;
  portfolioStatus.stats!.totalProjectCount = Math.max(
    portfolioStatus.stats!.totalProjectCount,
    portfolioStatus.stats!.verifiedProjectCount
  );

  // Add unique tech stacks
  for (const tech of suggestedTechStack) {
    if (!(portfolioStatus.stats!.techStacksUsed as string[]).includes(tech)) {
      (portfolioStatus.stats!.techStacksUsed as string[]).push(tech);
    }
  }

  if (!(portfolioStatus.stats!.reviewerInstitutions as string[]).includes(lecturerInstitution)) {
    (portfolioStatus.stats!.reviewerInstitutions as string[]).push(lecturerInstitution);
  }

  // Recalculate portfolio strength
  const portfolioDoc = portfolioStatus.toObject() as unknown as IStudentPortfolioStatus;
  const newStrength = calculatePortfolioStrength({
    ...portfolioDoc,
    currentTier: newTier,
  });
  portfolioStatus.portfolioStrength = newStrength;
  portfolioStatus.lastRecalculatedAt = new Date();

  await portfolioStatus.save();

  // Update student completedProjectCount
  await User.updateOne(
    { _id: engagement.studentId },
    { $inc: { 'studentData.completedProjectCount': 1 } }
  );

  // Send student notification (non-fatal)
  try {
    const student = await User.findById(engagement.studentId)
      .select('phoneNumber firstName')
      .lean();
    if (student?.phoneNumber) {
      await sendSMS(
        student.phoneNumber,
        `Congratulations ${student.firstName}! Your project "${projectTitle}" has been VERIFIED on UmojaHub. View your portfolio at umojahub.co.ke/experience/portfolio.`
      );
    }
  } catch (smsError) {
    logger.error('education/reviews', 'Failed to send VERIFIED SMS', { error: smsError });
  }
}

// ---------------------------------------------------------------------------
// LecturerEffectiveness update — runs for all decisions
// ---------------------------------------------------------------------------

async function updateLecturerEffectiveness(params: {
  lecturerId: string;
  decision: LecturerDecision;
  scores: {
    problemUnderstanding: number;
    solutionQuality: number;
    processQuality: number;
    aiUsage: number;
  };
  comments: Record<string, string | undefined>;
}): Promise<void> {
  try {
    const { lecturerId, decision, scores, comments } = params;

    const existing = await LecturerEffectiveness.findOne({ lecturerId });

    const commentWordCounts = Object.values(comments).map((c) =>
      typeof c === 'string' ? countWords(c) : 0
    );
    const avgCommentWords =
      commentWordCounts.reduce((a, b) => a + b, 0) / Math.max(commentWordCounts.length, 1);
    const overallScore =
      (scores.problemUnderstanding +
        scores.solutionQuality +
        scores.processQuality +
        scores.aiUsage) /
      4;

    if (!existing) {
      await LecturerEffectiveness.create({
        lecturerId,
        totalReviews: 1,
        verifiedCount: decision === LecturerDecision.VERIFIED ? 1 : 0,
        deniedCount: decision === LecturerDecision.DENIED ? 1 : 0,
        revisionCount: decision === LecturerDecision.REVISION_REQUIRED ? 1 : 0,
        averageScoresGiven: { ...scores, overall: overallScore },
        averageCommentWordCount: avgCommentWords,
        lastReviewAt: new Date(),
      });
      return;
    }

    const n = existing.totalReviews;
    const newN = n + 1;

    // Rolling average for scores
    const rollingAvg = (oldAvg: number, newVal: number): number =>
      (oldAvg * n + newVal) / newN;

    await LecturerEffectiveness.updateOne(
      { lecturerId },
      {
        $inc: {
          totalReviews: 1,
          verifiedCount: decision === LecturerDecision.VERIFIED ? 1 : 0,
          deniedCount: decision === LecturerDecision.DENIED ? 1 : 0,
          revisionCount: decision === LecturerDecision.REVISION_REQUIRED ? 1 : 0,
        },
        $set: {
          'averageScoresGiven.problemUnderstanding': rollingAvg(
            existing.averageScoresGiven!.problemUnderstanding,
            scores.problemUnderstanding
          ),
          'averageScoresGiven.solutionQuality': rollingAvg(
            existing.averageScoresGiven!.solutionQuality,
            scores.solutionQuality
          ),
          'averageScoresGiven.processQuality': rollingAvg(
            existing.averageScoresGiven!.processQuality,
            scores.processQuality
          ),
          'averageScoresGiven.aiUsage': rollingAvg(
            existing.averageScoresGiven!.aiUsage,
            scores.aiUsage
          ),
          'averageScoresGiven.overall': rollingAvg(existing.averageScoresGiven!.overall, overallScore),
          averageCommentWordCount: rollingAvg(existing.averageCommentWordCount, avgCommentWords),
          lastReviewAt: new Date(),
        },
      }
    );
  } catch (error) {
    logger.error('education/reviews', 'Failed to update LecturerEffectiveness', { error });
    // Non-fatal
  }
}
