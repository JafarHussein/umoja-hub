import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { briefRequestSchema } from '@/lib/validation/educationSchema';
import { generateAIBrief, generateOpenSourceBrief } from '@/lib/integrations/openaiService';
import type { BriefContextInput } from '@/lib/integrations/openaiService';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, ProjectTrack, ProjectStatus, StudentTier } from '@/types';

// ---------------------------------------------------------------------------
// Active statuses: student may not start a new engagement while in any of these.
// Terminal statuses (VERIFIED, DENIED) allow a fresh start.
// ---------------------------------------------------------------------------

const ACTIVE_STATUSES: ProjectStatus[] = [
  ProjectStatus.BRIEF_GENERATED,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.SUBMITTED,
  ProjectStatus.UNDER_PEER_REVIEW,
  ProjectStatus.UNDER_LECTURER_REVIEW,
  ProjectStatus.REVISION_REQUIRED,
];

const GITHUB_REPO_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/.*)?$/;

// ---------------------------------------------------------------------------
// BriefContextItem — matches BriefContextLibrary.contexts subdocument shape
// ---------------------------------------------------------------------------

type BriefContextItem = {
  id: string;
  industryName: string;
  problemDomains?: string[];
  kenyanConstraints?: string[];
  clientPersonaTemplate?: {
    businessTypes: string[];
    counties: string[];
    contexts: string[];
  };
  targetTiers?: string[];
};

// ---------------------------------------------------------------------------
// POST /api/education/engagements — Generate brief + create ProjectEngagement
// Auth: STUDENT
// Body: { track: ProjectTrack, tier: StudentTier, githubRepoUrl?: string }
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const body: unknown = await req.json();
    const parsed = briefRequestSchema.safeParse(body);

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

    const { track, tier, githubRepoUrl } = parsed.data;

    // OPEN_SOURCE requires a valid GitHub repository URL
    if (track === ProjectTrack.OPEN_SOURCE) {
      if (!githubRepoUrl) {
        return NextResponse.json(
          {
            error: 'A GitHub repository URL is required for the OPEN_SOURCE track.',
            code: 'VALIDATION_FAILED',
          },
          { status: 400 }
        );
      }
      if (!GITHUB_REPO_PATTERN.test(githubRepoUrl)) {
        return NextResponse.json(
          {
            error: 'URL must point to a valid GitHub repository (https://github.com/owner/repo).',
            code: 'VALIDATION_FAILED',
          },
          { status: 400 }
        );
      }
    }

    await connectDB();

    const studentId = session!.user.id;
    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');

    // One-active-engagement guard
    const activeEngagement = await ProjectEngagement.findOne({
      studentId,
      status: { $in: ACTIVE_STATUSES },
    } as object).lean();

    if (activeEngagement) {
      throw new AppError(
        'You already have an active project engagement. Complete your current project before starting a new one.',
        409,
        'ENGAGEMENT_ALREADY_ACTIVE'
      );
    }

    // For AI_BRIEF: resolve industry context from BriefContextLibrary (best-effort)
    let briefContextId: mongoose.Types.ObjectId | undefined;
    let briefContextInput: BriefContextInput | undefined;

    if (track === ProjectTrack.AI_BRIEF) {
      const { default: BriefContextLibrary } = await import(
        '@/lib/models/BriefContextLibrary.model'
      );
      const library = await BriefContextLibrary.findOne().sort({ version: -1 }).lean();

      if (library && library.contexts.length > 0) {
        briefContextId = library._id as mongoose.Types.ObjectId;
        const contexts = library.contexts as unknown as BriefContextItem[];

        const tierPool = contexts.filter(
          (c) => !c.targetTiers?.length || c.targetTiers.includes(tier)
        );
        const pool = tierPool.length > 0 ? tierPool : contexts;
        const chosen = pool[Math.floor(Math.random() * pool.length)];

        if (chosen) {
          briefContextInput = {
            industryName: chosen.industryName,
            problemDomains: chosen.problemDomains ?? [],
            kenyanConstraints: chosen.kenyanConstraints ?? [],
            clientPersonaTemplate: chosen.clientPersonaTemplate ?? {
              businessTypes: [],
              counties: [],
              contexts: [],
            },
          };
        }
      }
    }

    // Generate brief via OpenAI
    let brief: Record<string, unknown>;
    let githubRepoName: string | undefined;

    if (track === ProjectTrack.OPEN_SOURCE) {
      const match = githubRepoUrl!.match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)/);
      githubRepoName = match ? match[1] : undefined;
      const openSourceBrief = await generateOpenSourceBrief(
        githubRepoUrl!,
        githubRepoName ?? githubRepoUrl!
      );
      brief = openSourceBrief as unknown as Record<string, unknown>;
    } else {
      const aiBrief = await generateAIBrief(tier as StudentTier, briefContextInput);
      brief = aiBrief as unknown as Record<string, unknown>;
    }

    const engagement = await ProjectEngagement.create({
      studentId,
      track,
      tier,
      status: ProjectStatus.BRIEF_GENERATED,
      brief,
      ...(briefContextId && { briefContextId }),
      ...(githubRepoUrl && { githubRepoUrl }),
      ...(githubRepoName && { githubRepoName }),
      documents: {},
    });

    logger.info('education/engagements', 'Project engagement created', {
      engagementId: String(engagement._id),
      studentId,
      track,
      tier,
    });

    return NextResponse.json({ data: engagement }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
