import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { handleApiError, requireRole } from '@/lib/utils';
import { computePriceAnalytics } from '@/lib/intelligence/priceAnalytics';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/admin/price-analytics — platform-wide price intelligence analytics
// Auth: ADMIN
// Returns: commodity overview (median/trend/volatility), demand hotspots,
//          regional price comparison, supply concentration, market anomalies.
// Read-only aggregation over PriceHistory + MarketplaceListing.
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const analytics = await computePriceAnalytics();
    return NextResponse.json({ data: analytics });
  } catch (error) {
    return handleApiError(error);
  }
}
