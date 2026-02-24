import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User.model';
import Order from '@/lib/models/Order.model';
import FarmerTrustScore from '@/lib/models/FarmerTrustScore.model';
import MarketInsight from '@/lib/models/MarketInsight.model';
import StudentPortfolioStatus from '@/lib/models/StudentPortfolioStatus.model';
import PlatformImpactSummary from '@/lib/models/PlatformImpactSummary.model';
import { logger } from '@/lib/utils';
import { Role, OrderFulfillmentStatus } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/cron/impact-summary — Nightly platform impact summary
// Auth: Bearer CRON_SECRET
// Schedule: nightly 11pm UTC (2am EAT)
// Per BUSINESS_LOGIC.md §10.3 — READ ONLY, single upsert at end
// ---------------------------------------------------------------------------

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '').trim();
  return token === process.env['CRON_SECRET'];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_UNAUTHORIZED' }, { status: 401 });
  }

  await connectDB();

  // --- Food Hub aggregations (read-only) ---
  const [
    verifiedFarmerCount,
    activeBuyerCount,
    completedOrders,
    trustScores,
    latestInsight,
    registeredStudentCount,
    portfolioStatuses,
    lecturerCount,
  ] = await Promise.all([
    User.countDocuments({ role: Role.FARMER, 'farmerData.isVerified': true }),
    User.countDocuments({ role: Role.BUYER }),
    Order.aggregate([
      { $match: { fulfillmentStatus: OrderFulfillmentStatus.COMPLETED } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalVolume: { $sum: '$totalAmountKES' },
        },
      },
    ]),
    FarmerTrustScore.aggregate([
      { $group: { _id: null, avg: { $avg: '$compositeScore' } } },
    ]),
    MarketInsight.aggregate([
      { $sort: { weekOf: -1 } },
      { $limit: 50 },
      { $group: { _id: null, avgPremium: { $avg: '$pricing.platformPremium' } } },
    ]),
    User.countDocuments({ role: Role.STUDENT }),
    StudentPortfolioStatus.aggregate([
      {
        $group: {
          _id: null,
          totalVerifiedProjects: { $sum: '$stats.verifiedProjectCount' },
          activeCount: {
            $sum: { $cond: [{ $gt: ['$stats.verifiedProjectCount', 0] }, 1, 0] },
          },
          avgScore: { $avg: '$stats.averageScore' },
          totalSkills: { $sum: { $size: '$verifiedSkills' } },
        },
      },
    ]),
    User.countDocuments({ role: Role.LECTURER }),
  ]);

  const completedOrdersData = completedOrders[0] ?? { count: 0, totalVolume: 0 };
  const avgTrustScore = trustScores[0]?.avg ?? 0;
  const avgPlatformPremium = latestInsight[0]?.avgPremium ?? 0;
  const portfolioData = portfolioStatuses[0] ?? {
    totalVerifiedProjects: 0,
    activeCount: 0,
    avgScore: 0,
    totalSkills: 0,
  };

  // Count unique counties from verified farmers
  const countiesResult = await User.distinct('county', {
    role: Role.FARMER,
    'farmerData.isVerified': true,
  });

  // Count unique universities from students
  const universitiesResult = await User.distinct('studentData.universityAffiliation', {
    role: Role.STUDENT,
    'studentData.universityAffiliation': { $exists: true, $ne: '' },
  });

  // Count unique crop names from completed orders
  const activeCropResult = await Order.distinct('listingId');

  const summary = {
    computedAt: new Date(),
    food: {
      verifiedFarmerCount,
      activeBuyerCount,
      completedOrderCount: completedOrdersData.count,
      totalTransactionVolumeKES: completedOrdersData.totalVolume,
      averagePlatformPremium: Math.round(avgPlatformPremium * 10) / 10,
      activeCropCount: activeCropResult.length,
      countiesRepresented: countiesResult.length,
      avgTrustScore: Math.round(avgTrustScore * 10) / 10,
    },
    education: {
      registeredStudentCount,
      verifiedProjectCount: portfolioData.totalVerifiedProjects,
      activeStudentCount: portfolioData.activeCount,
      averageProjectScore: Math.round((portfolioData.avgScore ?? 0) * 10) / 10,
      skillsIssuedCount: portfolioData.totalSkills,
      lecturerCount,
      universitiesRepresented: universitiesResult.length,
    },
  };

  // Single upsert — singleton pattern
  await PlatformImpactSummary.findOneAndUpdate({}, summary, { upsert: true, new: true });

  logger.info('cron/impact-summary', 'Platform impact summary updated', {
    verifiedFarmerCount: summary.food.verifiedFarmerCount,
    completedOrderCount: summary.food.completedOrderCount,
    verifiedProjectCount: summary.education.verifiedProjectCount,
  });

  return NextResponse.json({ data: { computedAt: summary.computedAt } });
}
