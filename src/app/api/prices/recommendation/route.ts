import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { handleApiError, requireRole } from '@/lib/utils';
import { priceRecommendationQuerySchema } from '@/lib/validation/priceSchema';
import { composeRecommendation } from '@/lib/intelligence/priceIntelligence';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/prices/recommendation — Price Intelligence recommendation
// Auth: FARMER or ADMIN
// Query: cropName, county, unit? (default KG), quantity? (for earnings)
// Returns: a full PriceRecommendation (recommended price, range, demand, trend,
//          season, confidence, insight). Always 200 with a recommendation body;
//          thin data yields a null price + low confidence, never an error.
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER, Role.ADMIN);

    const { searchParams } = new URL(req.url);
    const parsed = priceRecommendationQuerySchema.safeParse({
      cropName: searchParams.get('cropName') ?? undefined,
      county: searchParams.get('county') ?? undefined,
      unit: searchParams.get('unit') ?? undefined,
      quantity: searchParams.get('quantity') ?? undefined,
      excludeOwnListings: searchParams.get('excludeOwnListings') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'cropName and a valid county are required.',
          code: 'VALIDATION_FAILED',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { cropName, county, unit, quantity, excludeOwnListings } = parsed.data;

    // D12 — the id comes from the session, never the query string: a caller must
    // not be able to suppress someone else's listings from the evidence base.
    const excludeFarmerId =
      excludeOwnListings && session?.user?.id ? String(session.user.id) : undefined;

    // composeRecommendation is itself cached (see priceIntelligence.ts), so this
    // route stays a thin validate-and-delegate.
    const recommendation = await composeRecommendation({
      crop: cropName,
      county,
      unit,
      quantity,
      excludeFarmerId,
    });

    return NextResponse.json({ data: recommendation });
  } catch (error) {
    return handleApiError(error);
  }
}
