import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role, PortfolioVisibility, StudentTier } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/employer/portfolios — employer-facing discovery of public student
// portfolios. Auth: EMPLOYER. Filters: ?skill (matches a verified tech stack),
// ?tier (BEGINNER|INTERMEDIATE|ADVANCED), ?minProjects (default 1). Sorted by
// verified-project count. Fills the education-side "search realism" gap.
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.EMPLOYER);

    await connectDB();

    const url = new URL(req.url);
    const skill = url.searchParams.get('skill')?.trim();
    const tier = url.searchParams.get('tier')?.trim();
    const minProjectsRaw = Number(url.searchParams.get('minProjects') ?? '1');
    const minProjects = Number.isFinite(minProjectsRaw) ? Math.max(Math.trunc(minProjectsRaw), 0) : 1;
    const limitRaw = Number(url.searchParams.get('limit') ?? '24');
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100) : 24;

    const { default: StudentPortfolioStatus } = await import(
      '@/lib/models/StudentPortfolioStatus.model'
    );
    const { default: User } = await import('@/lib/models/User.model');

    const filter: Record<string, unknown> = {
      visibility: PortfolioVisibility.PUBLIC,
      'stats.verifiedProjectCount': { $gte: minProjects },
    };
    if (tier && Object.values(StudentTier).includes(tier as StudentTier)) {
      filter.currentTier = tier;
    }
    if (skill) {
      // Case-insensitive match against the verified tech stacks.
      filter['stats.techStacksUsed'] = { $regex: new RegExp(escapeRegExp(skill), 'i') };
    }

    const portfolios = await StudentPortfolioStatus.find(filter)
      .sort({ 'stats.verifiedProjectCount': -1 })
      .limit(limit)
      .lean();

    const studentIds = portfolios.map((p) => p.studentId);
    const students = await User.find({ _id: { $in: studentIds } })
      .select('firstName lastName profilePhotoUrl county studentData.universityAffiliation')
      .lean();
    const studentById = new Map(students.map((s) => [String(s._id), s]));

    const data = portfolios.map((p) => {
      const s = studentById.get(String(p.studentId));
      return {
        publicSlug: p.publicSlug,
        currentTier: p.currentTier,
        portfolioStrength: p.portfolioStrength,
        verifiedProjectCount: p.stats?.verifiedProjectCount ?? 0,
        techStacksUsed: p.stats?.techStacksUsed ?? [],
        student: s
          ? {
              firstName: s.firstName,
              lastName: s.lastName,
              profilePhotoUrl: s.profilePhotoUrl,
              county: s.county,
              universityAffiliation: s.studentData?.universityAffiliation,
            }
          : null,
      };
    });

    return NextResponse.json({ data: { items: data, count: data.length } });
  } catch (error) {
    return handleApiError(error);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
