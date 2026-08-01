import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ChatSession from '@/lib/models/ChatSession.model';
import MentorSession from '@/lib/models/MentorSession.model';
import PriceHistory from '@/lib/models/PriceHistory.model';
import MarketInsight from '@/lib/models/MarketInsight.model';
import User from '@/lib/models/User.model';
import Order from '@/lib/models/Order.model';
import FarmerTrustScore from '@/lib/models/FarmerTrustScore.model';
import StudentPortfolioStatus from '@/lib/models/StudentPortfolioStatus.model';
import PlatformImpactSummary from '@/lib/models/PlatformImpactSummary.model';
import { calculatePlatformPremium, getMiddlemanBenchmark } from '@/lib/integrations/priceDataService';
import { logger } from '@/lib/utils';
import { Role, OrderFulfillmentStatus } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/cron/weekly-jobs — Consolidated weekly cron (Vercel Hobby: 2-cron limit)
// Auth: Bearer CRON_SECRET
// Schedule: Monday 03:00 UTC (06:00 EAT) — configured in vercel.json
// Runs three sub-tasks sequentially:
//   1. cleanup-sessions  — belt-and-suspenders for MongoDB TTL indexes
//   2. market-insight    — aggregate weekly price data per BUSINESS_LOGIC.md §10.2
//   3. impact-summary    — compute platform metrics per BUSINESS_LOGIC.md §10.3
// Individual route files remain at /api/cron/* for manual invocation and testing.
// ---------------------------------------------------------------------------

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '').trim();
  return token === process.env['CRON_SECRET'];
}

// ---------------------------------------------------------------------------
// Sub-task 1: Delete expired chat and mentor sessions
// Primary cleanup is handled by MongoDB TTL indexes; this is belt-and-suspenders.
// ---------------------------------------------------------------------------
async function runCleanupSessions(requestId: string): Promise<{ chatDeleted: number; mentorDeleted: number }> {
  const now = new Date();

  const [chatResult, mentorResult] = await Promise.all([
    ChatSession.deleteMany({ expiresAt: { $lt: now } }),
    MentorSession.deleteMany({ expiresAt: { $lt: now } }),
  ]);

  const chatDeleted = chatResult.deletedCount;
  const mentorDeleted = mentorResult.deletedCount;

  logger.info('cron/weekly-jobs/cleanup-sessions', 'Session cleanup complete', {
    requestId,
    chatSessionsDeleted: chatDeleted,
    mentorSessionsDeleted: mentorDeleted,
  });

  return { chatDeleted, mentorDeleted };
}

// ---------------------------------------------------------------------------
// Sub-task 2: Aggregate weekly market insights from PriceHistory
// Batch size: 50 crop+county combinations per run (per BUSINESS_LOGIC.md §10.2)
// ---------------------------------------------------------------------------
async function runMarketInsight(requestId: string): Promise<{ updated: number; weekOf: string }> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekOf = new Date();
  weekOf.setUTCHours(0, 0, 0, 0);

  // D17 — `unit` belongs in the group key. Without it every statistic below is
  // computed across mixed units (maize: ~KES 40/KG and ~KES 3,600/BAG), so the
  // min and the max are drawn from different quantities. Kept identical to
  // `cron/market-insight`, which runs the same job.
  const aggregations = await PriceHistory.aggregate([
    { $match: { recordedAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { cropName: '$cropName', county: '$county', unit: '$unit' },
        averageListingPrice: {
          $avg: { $cond: [{ $eq: ['$source', 'LISTING_CREATED'] }, '$pricePerUnit', null] },
        },
        averageTransactionPrice: {
          $avg: { $cond: [{ $eq: ['$source', 'ORDER_COMPLETED'] }, '$pricePerUnit', null] },
        },
        lowestPrice: { $min: '$pricePerUnit' },
        highestPrice: { $max: '$pricePerUnit' },
        dataPointCount: { $sum: 1 },
      },
    },
    { $match: { dataPointCount: { $gte: 3 } } },
    { $limit: 50 },
  ]);

  let updated = 0;

  for (const agg of aggregations) {
    const { cropName, county, unit } = agg._id as {
      cropName: string;
      county: string;
      unit: string;
    };
    const avgPrice = agg.averageTransactionPrice ?? agg.averageListingPrice;
    const middlemanBenchmark = getMiddlemanBenchmark(cropName, unit);
    const platformPremium =
      avgPrice !== null && middlemanBenchmark !== null
        ? calculatePlatformPremium(avgPrice, middlemanBenchmark)
        : null;

    // `unit` MUST be in this filter, or the KG and BAG records for one crop,
    // county and week collapse onto a single document and overwrite each other.
    await MarketInsight.findOneAndUpdate(
      { cropName, county, unit, weekOf } as object,
      {
        cropName,
        county,
        unit,
        weekOf,
        pricing: {
          averageListingPrice: agg.averageListingPrice,
          averageTransactionPrice: agg.averageTransactionPrice,
          lowestPrice: agg.lowestPrice,
          highestPrice: agg.highestPrice,
          middlemanBenchmark,
          platformPremium,
          dataPointCount: agg.dataPointCount,
        },
      },
      { upsert: true }
    );

    updated++;
  }

  logger.info('cron/weekly-jobs/market-insight', 'Market insight update complete', {
    requestId,
    cropCountyUnitCombinationsUpdated: updated,
    weekOf: weekOf.toISOString(),
  });

  return { updated, weekOf: weekOf.toISOString() };
}

// ---------------------------------------------------------------------------
// Sub-task 3: Compute platform-wide impact summary (singleton upsert)
// Per BUSINESS_LOGIC.md §10.3 — READ ONLY aggregations, single upsert at end
// ---------------------------------------------------------------------------
async function runImpactSummary(requestId: string): Promise<{ computedAt: Date }> {
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
      { $group: { _id: null, count: { $sum: 1 }, totalVolume: { $sum: '$totalAmountKES' } } },
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

  const [countiesResult, universitiesResult, activeCropResult] = await Promise.all([
    User.distinct('county', { role: Role.FARMER, 'farmerData.isVerified': true }),
    User.distinct('studentData.universityAffiliation', {
      role: Role.STUDENT,
      'studentData.universityAffiliation': { $exists: true, $ne: '' },
    }),
    Order.distinct('listingId'),
  ]);

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

  await PlatformImpactSummary.findOneAndUpdate({}, summary, { upsert: true, new: true });

  logger.info('cron/weekly-jobs/impact-summary', 'Platform impact summary updated', {
    requestId,
    verifiedFarmerCount: summary.food.verifiedFarmerCount,
    completedOrderCount: summary.food.completedOrderCount,
    verifiedProjectCount: summary.education.verifiedProjectCount,
  });

  return { computedAt: summary.computedAt };
}

// ---------------------------------------------------------------------------
// Route handler — runs all three sub-tasks sequentially
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_UNAUTHORIZED' }, { status: 401 });
  }

  await connectDB();

  const requestId = crypto.randomUUID();
  logger.info('cron/weekly-jobs', 'Starting weekly jobs', { requestId });

  const cleanupResult = await runCleanupSessions(requestId);
  const insightResult = await runMarketInsight(requestId);
  const impactResult = await runImpactSummary(requestId);

  logger.info('cron/weekly-jobs', 'All weekly jobs complete', { requestId });

  return NextResponse.json({
    data: {
      cleanupSessions: cleanupResult,
      marketInsight: insightResult,
      impactSummary: { computedAt: impactResult.computedAt },
    },
  });
}

// ---------------------------------------------------------------------------
// Vercel Cron invokes scheduled paths with GET. Only POST was exported, so the
// entries in vercel.json silently never ran. Both verbs execute the same job
// behind the same Bearer CRON_SECRET check.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  return POST(req);
}
