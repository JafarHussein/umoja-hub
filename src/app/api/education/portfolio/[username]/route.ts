/**
 * GET /api/education/portfolio/[username]
 * Auth: None (public — employer-facing)
 * Returns full portfolio data for a student by username (= their email handle).
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import StudentPortfolioStatus from '@/lib/models/StudentPortfolioStatus.model';
import User from '@/lib/models/User.model';
import { AppError, handleApiError } from '@/lib/utils';
import { Role } from '@/types';

interface RouteContext {
  params: Promise<{ username: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { username } = await context.params;

    await connectDB();

    // Look up student by email prefix (username = email without domain) or exact email
    const user = await User.findOne({
      $or: [{ email: username }, { email: { $regex: `^${username}@`, $options: 'i' } }],
      role: Role.STUDENT,
    })
      .select('firstName lastName email county studentData createdAt')
      .lean();

    if (!user) {
      throw new AppError('Portfolio not found', 404, 'DB_NOT_FOUND');
    }

    const portfolio = await StudentPortfolioStatus.findOne({ studentId: user._id }).lean();

    if (!portfolio) {
      throw new AppError('Portfolio not found', 404, 'DB_NOT_FOUND');
    }

    return NextResponse.json({
      data: {
        student: {
          firstName: user.firstName,
          lastName: user.lastName,
          county: user.county,
          universityAffiliation: user.studentData?.universityAffiliation ?? null,
          githubUsername: user.studentData?.githubUsername ?? null,
          memberSince: (user.createdAt as Date).toISOString(),
        },
        portfolio: {
          currentTier: portfolio.currentTier,
          portfolioStrength: portfolio.portfolioStrength,
          stats: portfolio.stats,
          verifiedProjects: portfolio.verifiedProjects,
          verifiedSkills: portfolio.verifiedSkills,
          tierProgressionTimeline: portfolio.tierProgressionTimeline,
          lastRecalculatedAt: portfolio.lastRecalculatedAt?.toISOString() ?? null,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
