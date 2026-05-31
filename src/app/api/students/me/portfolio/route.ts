import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, StudentTier, PortfolioStrength } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/students/me/portfolio — return own portfolio or an empty scaffold
// Auth: STUDENT
// If no StudentPortfolioStatus document exists, returns a zero-state scaffold
// so the client can render an empty portfolio page without an error state.
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    await connectDB();

    const studentId = session!.user.id;
    const { default: StudentPortfolioStatus } = await import(
      '@/lib/models/StudentPortfolioStatus.model'
    );

    const portfolio = await StudentPortfolioStatus.findOne({ studentId } as object).lean();

    if (portfolio) {
      logger.info('students/portfolio', 'Portfolio found', { studentId });
      return NextResponse.json({ data: portfolio });
    }

    // No record yet — return a scaffold so the client always gets a usable shape
    const scaffold = {
      studentId,
      currentTier: StudentTier.BEGINNER,
      portfolioStrength: PortfolioStrength.BUILDING,
      verifiedProjects: [],
      verifiedSkills: [],
      tierProgressionTimeline: [],
      stats: {
        verifiedProjectCount: 0,
        totalProjectCount: 0,
        averageScore: 0,
        techStacksUsed: [],
        reviewerInstitutions: [],
      },
      lastRecalculatedAt: null,
    };

    logger.info('students/portfolio', 'No portfolio record — returning scaffold', { studentId });
    return NextResponse.json({ data: scaffold });
  } catch (error) {
    return handleApiError(error);
  }
}
