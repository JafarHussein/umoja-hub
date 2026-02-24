import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import PriceHistory from '@/lib/models/PriceHistory.model';
import MarketInsight from '@/lib/models/MarketInsight.model';
import { handleApiError, requireRole } from '@/lib/utils';
import { calculatePlatformPremium } from '@/lib/integrations/priceDataService';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/prices — Price Intelligence
// Auth: FARMER or ADMIN
// Query: cropName, county, period (7d | 30d | 90d, default 30d)
// Returns: price history data points + market insight + platform premium
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER, Role.ADMIN);

    const { searchParams } = new URL(req.url);
    const cropName = searchParams.get('cropName');
    const county = searchParams.get('county');
    const period = searchParams.get('period') ?? '30d';

    if (!cropName || !county) {
      return NextResponse.json(
        { error: 'cropName and county are required', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    const periodDays = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    await connectDB();

    // Fetch price history data points
    const priceHistory = await PriceHistory.find({
      cropName,
      county,
      recordedAt: { $gte: since },
    })
      .sort({ recordedAt: 1 })
      .select('pricePerUnit unit source recordedAt farmerId')
      .lean();

    // Get latest market insight for middleman benchmark
    const marketInsight = await MarketInsight.findOne({ cropName, county } as object)
      .sort({ weekOf: -1 })
      .select('pricing weekOf')
      .lean();

    const middlemanBenchmark = marketInsight?.pricing?.middlemanBenchmark ?? null;
    const umojaHubAverage =
      priceHistory.length > 0
        ? priceHistory.reduce((sum: number, p) => sum + (p.pricePerUnit ?? 0), 0) / priceHistory.length
        : null;

    const platformPremium =
      umojaHubAverage !== null && middlemanBenchmark !== null
        ? calculatePlatformPremium(umojaHubAverage, middlemanBenchmark)
        : null;

    return NextResponse.json({
      data: {
        cropName,
        county,
        period,
        priceHistory,
        stats: {
          dataPointCount: priceHistory.length,
          averagePrice: umojaHubAverage !== null ? Math.round(umojaHubAverage * 100) / 100 : null,
          lowestPrice: priceHistory.length > 0 ? Math.min(...priceHistory.map((p) => p.pricePerUnit ?? 0)) : null,
          highestPrice: priceHistory.length > 0 ? Math.max(...priceHistory.map((p) => p.pricePerUnit ?? 0)) : null,
          middlemanBenchmark,
          platformPremium,
        },
        marketInsight: marketInsight ?? null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
