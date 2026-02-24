/**
 * POST /api/education/projects
 * Auth: STUDENT
 * Creates a ProjectEngagement for either OPEN_SOURCE or AI_BRIEF track.
 * Also creates StudentPortfolioStatus if this is the student's first project.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import ProjectEngagement from '@/lib/models/ProjectEngagement.model';
import StudentPortfolioStatus from '@/lib/models/StudentPortfolioStatus.model';
import User from '@/lib/models/User.model';
import { briefRequestSchema } from '@/lib/validation/educationSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, ProjectTrack, ProjectStatus, StudentTier } from '@/types';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const body: unknown = await req.json();
    const parsed = briefRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const student = await User.findById(session!.user.id).select('studentData').lean();
    if (!student?.studentData) {
      throw new AppError('Student profile not found', 404, 'DB_NOT_FOUND');
    }

    const { track, githubRepoUrl } = parsed.data;

    if (track === ProjectTrack.OPEN_SOURCE && !githubRepoUrl) {
      return NextResponse.json(
        { error: 'githubRepoUrl is required for OPEN_SOURCE track', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    const currentTier = (student.studentData.currentTier as StudentTier) ?? StudentTier.BEGINNER;

    // Extract repo name from URL for OPEN_SOURCE track
    let githubRepoName: string | undefined;
    if (track === ProjectTrack.OPEN_SOURCE && githubRepoUrl) {
      const match = /github\.com\/([^/]+\/[^/]+)/.exec(githubRepoUrl);
      githubRepoName = match?.[1] ?? undefined;
    }

    const createData: Record<string, unknown> = {
      studentId: session!.user.id,
      track,
      tier: currentTier,
      status: ProjectStatus.IN_PROGRESS,
      documents: { blockerLog: [], aiUsageLog: [] },
    };
    if (githubRepoUrl) createData['githubRepoUrl'] = githubRepoUrl;
    if (githubRepoName) createData['githubRepoName'] = githubRepoName;

    const engagement = await ProjectEngagement.create(createData);

    // Upsert StudentPortfolioStatus (create on first project)
    await StudentPortfolioStatus.findOneAndUpdate(
      { studentId: session!.user.id },
      {
        $setOnInsert: {
          studentId: session!.user.id,
          currentTier,
          verifiedProjects: [],
          verifiedSkills: [],
          tierProgressionTimeline: [{ tier: currentTier, unlockedAt: new Date() }],
        },
        $inc: { 'stats.totalProjectCount': 1 },
      },
      { upsert: true, new: true }
    );

    logger.info('education/projects', 'ProjectEngagement created', {
      engagementId: String(engagement._id),
      studentId: session!.user.id,
      track,
      tier: currentTier,
    });

    return NextResponse.json(
      {
        data: {
          engagementId: String(engagement._id),
          track,
          tier: currentTier,
          status: ProjectStatus.IN_PROGRESS,
          githubRepoUrl: engagement.githubRepoUrl,
          githubRepoName: engagement.githubRepoName,
          createdAt: (engagement.createdAt as Date).toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
