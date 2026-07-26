import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import MarketplaceListing from '@/lib/models/MarketplaceListing.model';
import { handleApiError } from '@/lib/utils';
import { ListingStatus, LISTING_CATEGORY_ORDER, LISTING_CATEGORY_LABEL } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/marketplace/suggest — instant search autocomplete (Marketplace
// Rebuild, Stage 4). Public, read-only, additive: powers the feed search box
// with produce, category, county, and direct-listing suggestions. Never mutates.
// ---------------------------------------------------------------------------

const MIN_QUERY = 2;
const EMPTY = { crops: [], categories: [], counties: [], listings: [] };

// Escape user input before it becomes a RegExp — a stray "(" or "*" would
// otherwise throw and 500 the endpoint.
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() ?? '';

    if (q.length < MIN_QUERY) {
      return NextResponse.json({ data: EMPTY });
    }

    await connectDB();
    const rx = new RegExp(escapeRegex(q), 'i');
    const available = { listingStatus: ListingStatus.AVAILABLE };

    const [crops, counties, listings] = await Promise.all([
      MarketplaceListing.aggregate<{ _id: string; count: number }>([
        { $match: { ...available, cropName: rx } },
        { $group: { _id: '$cropName', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 5 },
      ]),
      MarketplaceListing.aggregate<{ _id: string; count: number }>([
        { $match: { ...available, pickupCounty: rx } },
        { $group: { _id: '$pickupCounty', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 4 },
      ]),
      MarketplaceListing.find({ ...available, $or: [{ title: rx }, { cropName: rx }] })
        .sort({ isVerifiedListing: -1, createdAt: -1 })
        .limit(5)
        .select('title cropName pickupCounty currentPricePerUnit unit')
        .lean(),
    ]);

    const needle = q.toLowerCase();
    const categories = LISTING_CATEGORY_ORDER.filter((c) =>
      LISTING_CATEGORY_LABEL[c].toLowerCase().includes(needle)
    )
      .slice(0, 3)
      .map((c) => ({ value: c, label: LISTING_CATEGORY_LABEL[c] }));

    return NextResponse.json({
      data: {
        crops: crops.map((c) => ({ value: c._id, count: c.count })),
        counties: counties.map((c) => ({ value: c._id, count: c.count })),
        categories,
        listings: listings.map((l) => ({
          id: String(l._id),
          title: l.title,
          cropName: l.cropName,
          pickupCounty: l.pickupCounty,
          currentPricePerUnit: l.currentPricePerUnit,
          unit: l.unit,
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
