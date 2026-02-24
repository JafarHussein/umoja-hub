/**
 * POST /api/education/briefs
 * Auth: STUDENT
 * Generates an AI project brief via GPT-4o and creates a ProjectEngagement.
 * Selects a context from BriefContextLibrary, excluding the last 3 contexts used by this student.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import ProjectEngagement from '@/lib/models/ProjectEngagement.model';
import StudentPortfolioStatus from '@/lib/models/StudentPortfolioStatus.model';
import BriefContextLibrary from '@/lib/models/BriefContextLibrary.model';
import User from '@/lib/models/User.model';
import { briefRequestSchema } from '@/lib/validation/educationSchema';
import { buildBriefGenerationPrompt } from '@/lib/educationhub/briefGenerator';
import { generateBrief } from '@/lib/integrations/openaiService';
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

    if (parsed.data.track !== ProjectTrack.AI_BRIEF) {
      return NextResponse.json(
        { error: 'This endpoint only generates AI briefs', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    await connectDB();

    // Load student profile for interest area and tech stack
    const student = await User.findById(session!.user.id)
      .select('studentData')
      .lean();

    if (!student?.studentData) {
      throw new AppError('Student profile not found', 404, 'DB_NOT_FOUND');
    }

    const currentTier =
      (student.studentData.currentTier as StudentTier) ?? StudentTier.BEGINNER;
    const interestArea = student.studentData.primaryInterest ?? 'software development';
    const techStack =
      student.studentData.techStackPreferences.length > 0
        ? student.studentData.techStackPreferences
        : ['JavaScript', 'React'];

    // Find last 3 brief context IDs used by this student to enforce diversity
    const recentEngagements = await ProjectEngagement.find({
      studentId: session!.user.id,
      track: ProjectTrack.AI_BRIEF,
      briefContextId: { $exists: true },
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('briefContextId')
      .lean();

    const recentContextIds = recentEngagements
      .map((e) => String(e.briefContextId))
      .filter(Boolean);

    // Load active BriefContextLibrary (latest version)
    const library = await BriefContextLibrary.findOne().sort({ version: -1 }).lean();
    if (!library || !library.contexts || library.contexts.length === 0) {
      throw new AppError(
        'Brief context library not available. Please try again later.',
        503,
        'EDUCATION_BRIEF_GENERATION_FAILED'
      );
    }

    // Filter out recently used contexts for diversity
    interface IBriefContextItem {
      id: string;
      industryName: string;
      description: string;
      clientPersonaTemplate?: { businessTypes?: string[]; counties?: string[]; contexts?: string[] } | null;
      problemDomains: string[];
      kenyanConstraints: string[];
      exampleProjects: string[];
      targetTiers: string[];
    }
    const allContexts = library.contexts as unknown as IBriefContextItem[];
    const availableContexts = allContexts.filter(
      (ctx) => !recentContextIds.includes(ctx.id)
    );
    const contextPool =
      availableContexts.length > 0 ? availableContexts : allContexts;

    // Select a random context from the pool
    const selectedContext = contextPool[Math.floor(Math.random() * contextPool.length)];
    if (!selectedContext) {
      throw new AppError('No brief context available', 503, 'EDUCATION_BRIEF_GENERATION_FAILED');
    }

    // Build prompt and call GPT-4o
    const prompt = buildBriefGenerationPrompt(currentTier, interestArea, techStack, {
      id: selectedContext.id,
      industryName: selectedContext.industryName,
      description: selectedContext.description,
      ...(selectedContext.clientPersonaTemplate
        ? { clientPersonaTemplate: selectedContext.clientPersonaTemplate }
        : {}),
      problemDomains: selectedContext.problemDomains,
      kenyanConstraints: selectedContext.kenyanConstraints,
      exampleProjects: selectedContext.exampleProjects,
      targetTiers: selectedContext.targetTiers,
    });

    const brief = await generateBrief(prompt);

    // Create ProjectEngagement with the generated brief
    const engagement = await ProjectEngagement.create({
      studentId: session!.user.id,
      track: ProjectTrack.AI_BRIEF,
      tier: currentTier,
      status: ProjectStatus.IN_PROGRESS,
      brief,
      briefContextId: library._id,
      documents: {
        blockerLog: [],
        aiUsageLog: [],
      },
    });

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

    logger.info('education/briefs', 'AI brief generated and engagement created', {
      engagementId: String(engagement._id),
      studentId: session!.user.id,
      contextId: selectedContext.id,
      tier: currentTier,
    });

    return NextResponse.json(
      {
        data: {
          engagementId: String(engagement._id),
          track: ProjectTrack.AI_BRIEF,
          tier: currentTier,
          status: ProjectStatus.IN_PROGRESS,
          brief,
          briefContextId: selectedContext.id,
          createdAt: (engagement.createdAt as Date).toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
