import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError } from '@/lib/utils';
import { PortfolioVisibility } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/portfolio/[slug] — public, shareable student portfolio.
// No auth required (a portfolio with visibility=PUBLIC is reachable by anyone
// with the slug). The view count is DERIVED by counting PortfolioView documents
// — never stored on the portfolio.
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const { slug } = await params;

    const { default: StudentPortfolioStatus } = await import(
      '@/lib/models/StudentPortfolioStatus.model'
    );
    const { default: User } = await import('@/lib/models/User.model');
    const { default: PortfolioView } = await import('@/lib/models/PortfolioView.model');

    const portfolio = await StudentPortfolioStatus.findOne({
      publicSlug: slug,
      visibility: PortfolioVisibility.PUBLIC,
    }).lean();

    if (!portfolio) {
      throw new AppError('Portfolio not found', 404, 'NOT_FOUND');
    }

    const student = await User.findById(portfolio.studentId)
      .select('firstName lastName profilePhotoUrl bio county studentData.universityAffiliation')
      .lean();

    const viewCount = await PortfolioView.countDocuments({ studentId: portfolio.studentId });

    return NextResponse.json({
      data: {
        student: student
          ? {
              firstName: student.firstName,
              lastName: student.lastName,
              profilePhotoUrl: student.profilePhotoUrl,
              bio: student.bio,
              county: student.county,
              universityAffiliation: student.studentData?.universityAffiliation,
            }
          : null,
        portfolio: {
          currentTier: portfolio.currentTier,
          portfolioStrength: portfolio.portfolioStrength,
          verifiedProjects: portfolio.verifiedProjects,
          verifiedSkills: portfolio.verifiedSkills,
          stats: portfolio.stats,
        },
        viewCount,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
