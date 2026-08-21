import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { briefRequestSchema } from '@/lib/validation/educationSchema';
import { generateAIBrief, generateOpenSourceBrief } from '@/lib/integrations/openaiService';
import type { BriefContextInput } from '@/lib/integrations/openaiService';
import { loadAcademicContext } from '@/lib/education/academicContext';
import { assignmentToBrief, isEligible, takenCount } from '@/lib/education/assignment';
import type { AssignmentRecord } from '@/lib/education/assignment';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, ProjectTrack, ProjectStatus, UserStatus } from '@/types';

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
};

// ---------------------------------------------------------------------------
// POST /api/education/engagements — Generate brief + create ProjectEngagement
// Auth: STUDENT
// Body: { track, interest?, githubRepoUrl? (OPEN_SOURCE), assignmentId? (LECTURER_ASSIGNED) }
//
// A project starts from the units the student is taking, never from a
// difficulty they picked for themselves. That is why there is no tier here any
// more, and why a student with no coursework on record is sent to declare it
// rather than handed a brief written from nothing.
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

    const { track, interest, githubRepoUrl, assignmentId } = parsed.data;

    if (track === ProjectTrack.LECTURER_ASSIGNED && !assignmentId) {
      return NextResponse.json(
        {
          error: 'Choose which of your lecturer’s projects you are starting.',
          code: 'VALIDATION_FAILED',
        },
        { status: 400 }
      );
    }

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

    const requestId = crypto.randomUUID();
    const studentId = session!.user.id;
    const { default: User } = await import('@/lib/models/User.model');
    const student = await User.findById(studentId)
      .select('status studentData.primaryInterest')
      .lean();
    if (student?.status !== UserStatus.ACTIVE) {
      throw new AppError('Your account has been suspended.', 403, 'ACCOUNT_SUSPENDED');
    }

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

    // The coursework is the origin of the project, so there is no brief to write
    // without it. Refused with a code the interface acts on — the student is
    // sent to record what they are studying, not told to try again.
    const academic = await loadAcademicContext(studentId);
    if (!academic) {
      throw new AppError(
        'Tell us what you are studying this semester first — your project is written from your units.',
        409,
        'ACADEMIC_CONTEXT_REQUIRED'
      );
    }

    // Interest is a filter over valid projects, not the thing that picks them.
    const chosenInterest = interest ?? student.studentData?.primaryInterest ?? undefined;

    // Resolve the problem domain from the library. It used to be
    // `pool[Math.floor(Math.random() * pool.length)]` filtered by the student's
    // own difficulty choice — so the domain was arbitrary and could repeat
    // immediately. Kenya is not one industry, and a student should not spend
    // three projects in the same one: the domains this student has already
    // worked in are ruled out before the choice, and only fall back in when
    // they have exhausted the library.
    let briefContextId: mongoose.Types.ObjectId | undefined;
    let briefContextInput: BriefContextInput | undefined;
    let industryName: string | undefined;

    if (track === ProjectTrack.AI_BRIEF) {
      const { default: BriefContextLibrary } = await import(
        '@/lib/models/BriefContextLibrary.model'
      );
      const library = await BriefContextLibrary.findOne().sort({ version: -1 }).lean();

      if (library && library.contexts.length > 0) {
        briefContextId = library._id as mongoose.Types.ObjectId;
        const contexts = library.contexts as unknown as BriefContextItem[];

        const previous = await ProjectEngagement.find({ studentId } as object)
          .select('industryName')
          .lean();
        const seen = new Set(
          previous.map((e) => e.industryName).filter((n): n is string => typeof n === 'string')
        );

        const unseen = contexts.filter((c) => !seen.has(c.industryName));
        const pool = unseen.length > 0 ? unseen : contexts;
        // Deterministic within a student's history rather than a coin toss:
        // the same student asking again after a completed project moves on.
        const chosen = pool[previous.length % pool.length];

        if (chosen) {
          industryName = chosen.industryName;
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

    if (track === ProjectTrack.LECTURER_ASSIGNED) {
      const { default: ProjectAssignment } = await import('@/lib/models/ProjectAssignment.model');
      const assignment = (await ProjectAssignment.findById(assignmentId)
        .populate('lecturerId', 'firstName lastName')
        .lean()) as unknown as (AssignmentRecord & { lecturerId: unknown }) | null;

      // Eligibility is re-checked here, not trusted from the list the student
      // was shown: the offer may have closed or filled since the page loaded,
      // and the list is a convenience, never the authority.
      if (
        !assignment ||
        !isEligible(assignment, {
          studentId,
          institutionId: student.studentData?.institutionId,
          academic,
        })
      ) {
        throw new AppError(
          'That project is not open to you. It may have been closed since you opened this page.',
          404,
          'ASSIGNMENT_UNAVAILABLE'
        );
      }

      if (assignment.capacity && (await takenCount(assignment._id)) >= assignment.capacity) {
        throw new AppError(
          'That project is full. Your lecturer set a limit on how many students can take it.',
          409,
          'ASSIGNMENT_FULL'
        );
      }

      const ref = assignment.lecturerId as { firstName?: string; lastName?: string } | null;
      const setBy = `${ref?.firstName ?? ''} ${ref?.lastName ?? ''}`.trim() || 'Your lecturer';
      brief = assignmentToBrief(assignment, academic, setBy) as unknown as Record<string, unknown>;
    } else if (track === ProjectTrack.OPEN_SOURCE) {
      const match = githubRepoUrl!.match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)/);
      githubRepoName = match ? match[1] : undefined;
      const openSourceBrief = await generateOpenSourceBrief(
        githubRepoUrl!,
        githubRepoName ?? githubRepoUrl!,
        academic
      );
      brief = openSourceBrief as unknown as Record<string, unknown>;
    } else {
      const aiBrief = await generateAIBrief({
        academic,
        interest: chosenInterest,
        industry: briefContextInput,
      });
      brief = aiBrief as unknown as Record<string, unknown>;
    }

    const engagement = await ProjectEngagement.create({
      studentId,
      track,
      status: ProjectStatus.BRIEF_GENERATED,
      brief,
      ...(chosenInterest && { interest: chosenInterest }),
      ...(industryName && { industryName }),
      ...(assignmentId && track === ProjectTrack.LECTURER_ASSIGNED && { assignmentId }),
      ...(briefContextId && { briefContextId }),
      ...(githubRepoUrl && { githubRepoUrl }),
      ...(githubRepoName && { githubRepoName }),
      documents: {},
    });

    logger.info('education/engagements', 'Project engagement created', {
      requestId,
      engagementId: String(engagement._id),
      studentId,
      track,
      knowledgeAreas: academic.knowledgeAreas.slice(0, 3),
    });

    return NextResponse.json({ data: engagement }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
