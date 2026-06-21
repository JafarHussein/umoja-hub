import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError, logger } from '@/lib/utils';
import { Role, PortfolioVisibility, NotificationType } from '@/types';
import { notify } from '@/lib/notifications/notify';

// ---------------------------------------------------------------------------
// GET /api/portfolio/[slug] — public, shareable student portfolio.
// No auth required (a portfolio with visibility=PUBLIC is reachable by anyone
// with the slug). When an authenticated EMPLOYER opens it, the view is recorded
// (PortfolioView) and the student is notified. The view count is DERIVED by
// counting PortfolioView documents — never stored on the portfolio.
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

    // Record an employer view (non-blocking) and notify the student. Anonymous
    // and self views are not recorded.
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;
    const viewerRole = session?.user?.role;
    const isEmployerView =
      viewerRole === Role.EMPLOYER && viewerId && String(viewerId) !== String(portfolio.studentId);

    if (isEmployerView) {
      void (async () => {
        try {
          await PortfolioView.create({
            studentId: portfolio.studentId,
            viewerId,
            viewerRole,
            viewedAt: new Date(),
          });
          await notify({
            userId: portfolio.studentId,
            type: NotificationType.PORTFOLIO_VIEW,
            title: 'An employer viewed your portfolio',
            body: 'Your public portfolio was opened by an employer on UmojaHub.',
            relatedEntity: { kind: 'User', id: portfolio.studentId },
          });
        } catch (err) {
          logger.error('portfolio', 'Failed to record portfolio view', { slug, err });
        }
      })();
    }

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
