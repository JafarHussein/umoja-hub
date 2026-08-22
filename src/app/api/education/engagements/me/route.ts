import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role, ACTIVE_PROJECT_STATUSES } from '@/types';

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
      status: { $in: ACTIVE_PROJECT_STATUSES },
    } as object)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: engagement ?? null });
  } catch (error) {
    return handleApiError(error);
  }
}
