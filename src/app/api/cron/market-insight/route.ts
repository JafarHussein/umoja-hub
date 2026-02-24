import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import PriceHistory from '@/lib/models/PriceHistory.model';
import MarketInsight from '@/lib/models/MarketInsight.model';
import { calculatePlatformPremium, getMiddlemanBenchmark } from '@/lib/integrations/priceDataService';
import { logger } from '@/lib/utils';

// ---------------------------------------------------------------------------
// POST /api/cron/market-insight — Weekly market insight aggregation
// Auth: Bearer CRON_SECRET
// Schedule: Monday 3am UTC (6am EAT)
// Per BUSINESS_LOGIC.md §10.2
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

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekOf = new Date();
  weekOf.setUTCHours(0, 0, 0, 0);

  // Aggregate PriceHistory by crop + county for last 7 days
  const aggregations = await PriceHistory.aggregate([
    { $match: { recordedAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { cropName: '$cropName', county: '$county' },
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
    // Only process crop+county pairs with 3+ data points per BUSINESS_LOGIC.md §10.2
    { $match: { dataPointCount: { $gte: 3 } } },
    { $limit: 50 }, // batch size
  ]);

  let updated = 0;

  for (const agg of aggregations) {
    const { cropName, county } = agg._id;
    const avgPrice = agg.averageTransactionPrice ?? agg.averageListingPrice;
    const middlemanBenchmark = getMiddlemanBenchmark(cropName);
    const platformPremium =
      avgPrice !== null && middlemanBenchmark !== null
        ? calculatePlatformPremium(avgPrice, middlemanBenchmark)
        : null;

    await MarketInsight.findOneAndUpdate(
      { cropName, county, weekOf } as object,
      {
        cropName,
        county,
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

  logger.info('cron/market-insight', 'Market insight update complete', {
    cropCountyCombinationsUpdated: updated,
    weekOf: weekOf.toISOString(),
  });

  return NextResponse.json({
    data: { updated, weekOf: weekOf.toISOString() },
  });
}
