import { NextRequest, NextResponse } from 'next/server';
import { AppError, handleApiError } from '@/lib/utils';
import { getListingFairness } from '@/lib/intelligence/buyerFairness';

// ---------------------------------------------------------------------------
// GET /api/marketplace/[listingId]/fairness — buyer price fairness signal
// Auth: public (D14)
//
// The marketplace is a public surface (`middleware.ts` EXEMPT_PREFIXES), so the
// fairness signal is public too: a fairness signal that requires an account is a
// fairness signal for people who already trust the platform.
//
// This returns a narrow projection (assessment band + confidence band + the
// geographic tier actually used), never the recommendation itself — see
// buyerFairness.ts for why. Listing-scoped so it cannot be swept across the
// crop/county taxonomy.
//
// `data: null` means "not enough evidence to judge", which is a normal state and
// renders nothing. A missing listing is a 404. The two are deliberately
// distinguishable: conflating them is what hid D14 for an entire release.
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
): Promise<NextResponse> {
  try {
    const { listingId } = await params;

    const fairness = await getListingFairness(listingId);
    if (fairness === null) {
      throw new AppError(
        'This listing does not exist or has been removed.',
        404,
        'FARMER_LISTING_NOT_FOUND'
      );
    }

    return NextResponse.json({ data: fairness });
  } catch (error) {
    return handleApiError(error);
  }
}
