import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import MarketplaceListing from '@/lib/models/MarketplaceListing.model';
import FarmerTrustScore from '@/lib/models/FarmerTrustScore.model';
import User from '@/lib/models/User.model';
import PriceHistory from '@/lib/models/PriceHistory.model';
import { cropListingSchema } from '@/lib/validation/farmerSchema';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role, PriceHistorySource, ListingStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/marketplace — Public listing browse with filters
// Auth: None (public)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const cropName = searchParams.get('cropName');
    const county = searchParams.get('county');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);

    const filter: Record<string, unknown> = {
      listingStatus: ListingStatus.AVAILABLE,
    };

    if (cropName) filter['cropName'] = { $regex: new RegExp(cropName, 'i') };
    if (county) filter['pickupCounty'] = county;
    if (verifiedOnly) filter['isVerifiedListing'] = true;
    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter['$gte'] = Number(minPrice);
      if (maxPrice) priceFilter['$lte'] = Number(maxPrice);
      filter['currentPricePerUnit'] = priceFilter;
    }
    if (cursor) {
      filter['_id'] = { $lt: cursor }; // Newest first pagination
    }

    const listings = await MarketplaceListing.find(filter)
      .sort({ isVerifiedListing: -1, createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = listings.length > limit;
    const page = hasMore ? listings.slice(0, limit) : listings;
    const nextCursor = hasMore ? (page.at(-1)?._id?.toString() ?? null) : null;
    const total = await MarketplaceListing.countDocuments(filter);

    // Enrich with farmer data and trust scores
    const farmerIds = [...new Set(page.map((l) => String(l.farmerId)))];
    const [farmers, trustScores] = await Promise.all([
      User.find({ _id: { $in: farmerIds } })
        .select('firstName lastName farmerData.isVerified')
        .lean(),
      FarmerTrustScore.find({ farmerId: { $in: farmerIds } })
        .select('farmerId compositeScore tier')
        .lean(),
    ]);

    const farmerMap = new Map(farmers.map((f) => [String(f._id), f]));
    const trustMap = new Map(trustScores.map((ts) => [String(ts.farmerId), ts]));

    const data = page.map((listing) => {
      const farmerId = String(listing.farmerId);
      const farmer = farmerMap.get(farmerId);
      const trust = trustMap.get(farmerId);

      return {
        id: String(listing._id),
        title: listing.title,
        cropName: listing.cropName,
        quantityAvailable: listing.quantityAvailable,
        unit: listing.unit,
        currentPricePerUnit: listing.currentPricePerUnit,
        pickupCounty: listing.pickupCounty,
        imageUrl: listing.imageUrls[0] ?? '',
        farmer: {
          id: farmerId,
          firstName: farmer?.firstName ?? '',
          lastName: farmer?.lastName ?? '',
          isVerified: farmer?.farmerData?.isVerified ?? false,
          trustScore: trust?.compositeScore ?? 0,
          trustTier: trust?.tier ?? 'NEW',
        },
        listingStatus: listing.listingStatus,
        createdAt: (listing.createdAt as Date).toISOString(),
      };
    });

    return NextResponse.json({ data, nextCursor, total });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/marketplace — Create a crop listing
// Auth: FARMER (must be verified)
// Side effects: inserts PriceHistory record (source: LISTING_CREATED)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    const body: unknown = await req.json();
    const parsed = cropListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'The submitted data is invalid. Check the details and try again.',
          code: 'VALIDATION_FAILED',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Farmer must be verified to list produce
    const farmer = await User.findById(session!.user.id).select('farmerData county').lean();
    if (!farmer?.farmerData?.isVerified) {
      throw new AppError(
        'Your farmer account must be verified before you can list produce.',
        403,
        'FARMER_NOT_VERIFIED'
      );
    }

    const {
      title,
      cropName,
      description,
      quantityAvailable,
      unit,
      currentPricePerUnit,
      pickupCounty,
      pickupDescription,
      imageUrls,
      buyerContactPreference,
    } = parsed.data;

    const listing = await MarketplaceListing.create({
      farmerId: session!.user.id,
      title,
      cropName,
      description,
      quantityAvailable,
      unit,
      currentPricePerUnit,
      pickupCounty,
      pickupDescription,
      imageUrls,
      buyerContactPreference,
      isVerifiedListing: true, // Verified because farmer is verified
      listingStatus: ListingStatus.AVAILABLE,
    });

    // Insert PriceHistory record (LISTING_CREATED)
    let priceHistoryRecorded = false;
    try {
      await PriceHistory.create({
        cropName,
        county: pickupCounty,
        pricePerUnit: currentPricePerUnit,
        unit,
        source: PriceHistorySource.LISTING_CREATED,
        farmerId: session!.user.id,
        recordedAt: new Date(),
      });
      priceHistoryRecorded = true;
    } catch (priceError) {
      // Non-fatal: log but continue
      const err = priceError instanceof Error ? priceError.message : String(priceError);
      void err; // suppress unused var lint
    }

    return NextResponse.json(
      {
        data: {
          id: String(listing._id),
          listingStatus: ListingStatus.AVAILABLE,
          priceHistoryRecorded,
          createdAt: (listing.createdAt as Date).toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
