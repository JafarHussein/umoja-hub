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

  const requestId = crypto.randomUUID();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekOf = new Date();
  weekOf.setUTCHours(0, 0, 0, 0);

  // Aggregate PriceHistory by crop + county + UNIT for last 7 days.
  //
  // D17 — `unit` was not in this group key, so every statistic below was computed
  // across a bimodal set: maize trades at ~KES 40/KG and ~KES 3,600/BAG, and
  // `lowestPrice`/`highestPrice` were therefore guaranteed to come from different
  // units. This is D1, in the cron layer, surviving the fix to the engine.
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
    // Only process crop+county pairs with 3+ data points
    { $match: { dataPointCount: { $gte: 3 } } },
    { $limit: 50 }, // batch size
  ]);

  let updated = 0;

  for (const agg of aggregations) {
    const { cropName, county, unit } = agg._id;
    const avgPrice = agg.averageTransactionPrice ?? agg.averageListingPrice;
    // Null for any unit the benchmark table is not authored in — it is a per-kg
    // table, and no bag figure is derived from it. See getMiddlemanBenchmark.
    const middlemanBenchmark = getMiddlemanBenchmark(cropName, unit);
    const platformPremium =
      avgPrice !== null && middlemanBenchmark !== null
        ? calculatePlatformPremium(avgPrice, middlemanBenchmark)
        : null;

    // `unit` MUST be in this filter. Without it the KG and BAG aggregations for
    // the same crop, county and week resolve to one document and clobber each
    // other, leaving whichever unit the pipeline happened to emit last.
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

  logger.info('cron/market-insight', 'Market insight update complete', {
    requestId,
    cropCountyUnitCombinationsUpdated: updated,
    weekOf: weekOf.toISOString(),
  });

  return NextResponse.json({
    data: { updated, weekOf: weekOf.toISOString() },
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
