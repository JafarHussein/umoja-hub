import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role, ProjectStatus } from '@/types';

// Statuses that represent work-in-progress — the engagement the student is actively working on.
// Terminal statuses (VERIFIED, DENIED) are excluded: a verified project is history, not a current engagement.
const ACTIVE_STATUSES: ProjectStatus[] = [
  ProjectStatus.BRIEF_GENERATED,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.SUBMITTED,
  ProjectStatus.UNDER_PEER_REVIEW,
  ProjectStatus.UNDER_LECTURER_REVIEW,
  ProjectStatus.REVISION_REQUIRED,
];

// ---------------------------------------------------------------------------
// GET /api/education/engagements/me — Current active project engagement
// Auth: STUDENT
// Returns: { data: engagement } or { data: null } — never 404
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    await connectDB();

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');

    const engagement = await ProjectEngagement.findOne({
      studentId: session!.user.id,
      status: { $in: ACTIVE_STATUSES },
    } as object)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: engagement ?? null });
  } catch (error) {
    return handleApiError(error);
  }
}
