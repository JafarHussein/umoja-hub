import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import PriceHistory from '@/lib/models/PriceHistory.model';
import MarketInsight from '@/lib/models/MarketInsight.model';
import { handleApiError, requireRole } from '@/lib/utils';
import { calculatePlatformPremium } from '@/lib/integrations/priceDataService';
import { cropNamePattern, matchesCrop, resolveCrop } from '@/lib/taxonomy/crops';
import { resolveUnit } from '@/lib/taxonomy/units';
import { composeRecommendation } from '@/lib/intelligence/priceIntelligence';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/prices — Price Intelligence
// Auth: FARMER or ADMIN
// Query: cropName, county, unit (required), period (7d | 30d | 90d, default 30d)
// Returns: unit-scoped price history series + market insight + platform premium.
//          It does NOT return a central price — that is the recommendation
//          endpoint's job, and duplicating it here was defect D13.
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER, Role.ADMIN);

    const { searchParams } = new URL(req.url);
    const cropName = searchParams.get('cropName');
    const county = searchParams.get('county');
    const period = searchParams.get('period') ?? '30d';
    const unitParam = searchParams.get('unit');

    if (!cropName || !county) {
      return NextResponse.json(
        { error: 'cropName and county are required', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    // D13 — `unit` is required. Maize trades both per KG (~KES 40) and per 90 kg
    // BAG (~KES 3,600); a chart plotting both on one axis is the mixed-unit
    // defect in visual form, exactly as the unfiltered statistics were.
    const unit = unitParam ? resolveUnit(unitParam) : null;
    if (!unit) {
      return NextResponse.json(
        {
          error: 'A valid unit is required (KG, BAG, CRATE, LITRE or PIECE).',
          code: 'VALIDATION_FAILED',
        },
        { status: 400 }
      );
    }

    const periodDays = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    await connectDB();

    // Crop identity comes from the canonical taxonomy, so this endpoint, the
    // recommendation engine and the price-alert cron all agree on what a crop
    // name matches. Exact string equality used to mean "Milk" and "dairy" were
    // different crops here but the same crop in the engine.
    const cropId = resolveCrop(cropName);
    const cropFilter = cropId ? cropNamePattern(cropId) : cropName;

    // Fetch price history data points, restricted to the requested unit.
    const unitMatch = new RegExp('^' + unit.trim() + '$', 'i');
    const priceHistory = (
      await PriceHistory.find({
        cropName: cropFilter,
        county,
        unit: unitMatch,
        recordedAt: { $gte: since },
      })
        .sort({ recordedAt: 1 })
        .select('cropName pricePerUnit unit source recordedAt farmerId')
        .lean()
      // `cropNamePattern` is a superset match — narrow it with alias precedence.
    ).filter((p) => (cropId ? matchesCrop(p.cropName, cropId) : true));

    // Latest market insight for the middleman benchmark. This lookup used exact
    // `cropName` equality while the history query above used the taxonomy, so a
    // crop could match its history and miss its own benchmark — D3 surviving in
    // one line. It now resolves through the same taxonomy.
    const marketInsight =
      (
        await MarketInsight.find({ cropName: cropFilter, county } as object)
          .sort({ weekOf: -1 })
          .select('pricing weekOf cropName')
          .limit(10)
          .lean()
      ).find((m) => (cropId ? matchesCrop(m.cropName, cropId) : true)) ?? null;

    const middlemanBenchmark = marketInsight?.pricing?.middlemanBenchmark ?? null;

    // D13 — this route no longer computes its own central figure. The premium is
    // measured against the engine's weighted median, so there is exactly one
    // place in the codebase that decides what a crop is worth. The old
    // unweighted mean over mixed units was defect D1 still live on this endpoint.
    const recommendation = await composeRecommendation({ crop: cropName, county, unit });
    const umojaHubPrice = recommendation.recommendedPricePerUnit;

    const platformPremium =
      umojaHubPrice !== null && middlemanBenchmark !== null
        ? calculatePlatformPremium(umojaHubPrice, middlemanBenchmark)
        : null;

    return NextResponse.json({
      data: {
        cropName,
        county,
        unit,
        period,
        priceHistory,
        // `averagePrice`, `lowestPrice` and `highestPrice` were removed (D13)
        // rather than unit-corrected in place: duplicating the unit logic in a
        // second location is what produced the defect. Consumers needing a
        // central figure call /api/prices/recommendation, which is now also
        // where `platformPremium` gets its baseline.
        stats: {
          dataPointCount: priceHistory.length,
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
