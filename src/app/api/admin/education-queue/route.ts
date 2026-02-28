import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import ProjectEngagement from '@/lib/models/ProjectEngagement.model';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role, ProjectStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/admin/education-queue — Pending lecturer review queue
// Auth: ADMIN
// Returns projects with status UNDER_LECTURER_REVIEW, populated with student info
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    await connectDB();

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

    const query: Record<string, unknown> = {
      status: ProjectStatus.UNDER_LECTURER_REVIEW,
    };

    if (cursor) {
      query['_id'] = { $lt: cursor };
    }

    const engagements = await ProjectEngagement.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit + 1)
      .populate('studentId', 'firstName lastName phoneNumber studentData.universityAffiliation')
      .select(
        'studentId track tier status brief.title brief.clientPersona githubRepoUrl submittedAt updatedAt createdAt'
      )
      .lean();

    const hasMore = engagements.length > limit;
    const results = hasMore ? engagements.slice(0, limit) : engagements;
    const nextCursor = hasMore
      ? String((results[results.length - 1] as { _id: unknown })?._id)
      : null;

    const total = await ProjectEngagement.countDocuments({
      status: ProjectStatus.UNDER_LECTURER_REVIEW,
    });

    const data = results.map((e) => {
      const student = (e.studentId as unknown) as Record<string, unknown> | null;
      const studentData = student?.['studentData'] as Record<string, unknown> | undefined;
      return {
        engagementId: String(e._id),
        student: student
          ? {
              firstName: student['firstName'],
              lastName: student['lastName'],
              phoneNumber: student['phoneNumber'],
              university: studentData?.['universityAffiliation'] ?? null,
            }
          : null,
        track: e.track,
        tier: e.tier,
        status: e.status,
        briefTitle: (e.brief as Record<string, unknown> | undefined)?.['title'] ?? null,
        githubRepoUrl: e.githubRepoUrl ?? null,
        submittedAt: e.updatedAt?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ data, nextCursor, hasMore, total });
  } catch (error) {
    return handleApiError(error);
  }
}
