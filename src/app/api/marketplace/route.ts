import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import MarketplaceListing from '@/lib/models/MarketplaceListing.model';
import FarmerTrustScore from '@/lib/models/FarmerTrustScore.model';
import User from '@/lib/models/User.model';
import PriceHistory from '@/lib/models/PriceHistory.model';
import { cropListingSchema } from '@/lib/validation/farmerSchema';
import { notify } from '@/lib/notifications/notify';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role, PriceHistorySource, ListingStatus, UserStatus, NotificationType } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/marketplace — Public listing browse with filters
// Auth: None (public)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    const cropName = searchParams.get('cropName');
    const category = searchParams.get('category');
    const county = searchParams.get('county');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const sort = searchParams.get('sort');
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);

    // ── own=true: authenticated farmer's own listings (all statuses) ──────
    // Powers the dashboard "My Listings" view. Unlike the public branch this
    // includes SOLD_OUT and INACTIVE listings, and is scoped to the session
    // farmer — never combined with the public filters below.
    if (searchParams.get('own') === 'true') {
      const session = await getServerSession(authOptions);
      requireRole(session, Role.FARMER);

      const ownFilter: Record<string, unknown> = { farmerId: session!.user.id };
      if (cursor) {
        if (!mongoose.isValidObjectId(cursor)) {
          return NextResponse.json(
            { error: 'Invalid cursor value.', code: 'VALIDATION_FAILED' },
            { status: 400 }
          );
        }
        ownFilter['_id'] = { $lt: new mongoose.Types.ObjectId(cursor) };
      }

      const ownListings = await MarketplaceListing.find(ownFilter)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .select(
          'title cropName category currentPricePerUnit unit quantityAvailable pickupCounty listingStatus isVerifiedListing createdAt'
        )
        .lean();

      const ownHasMore = ownListings.length > limit;
      const ownPage = ownHasMore ? ownListings.slice(0, limit) : ownListings;
      const ownNextCursor = ownHasMore ? (ownPage.at(-1)?._id?.toString() ?? null) : null;
      const ownTotal = await MarketplaceListing.countDocuments({
        farmerId: session!.user.id,
      });

      return NextResponse.json({ data: ownPage, nextCursor: ownNextCursor, total: ownTotal });
    }

    const filter: Record<string, unknown> = {
      listingStatus: ListingStatus.AVAILABLE,
    };

    if (q) {
      // Text search — disables cursor pagination (text score sort incompatible with _id cursor)
      filter['$text'] = { $search: q };
    } else {
      if (cropName) filter['cropName'] = { $regex: new RegExp(cropName, 'i') };
      if (cursor) {
        if (!mongoose.isValidObjectId(cursor)) {
          return NextResponse.json(
            { error: 'Invalid cursor value.', code: 'VALIDATION_FAILED' },
            { status: 400 }
          );
        }
        filter['_id'] = { $lt: new mongoose.Types.ObjectId(cursor) };
      }
    }

    if (category) filter['category'] = category;
    if (county) filter['pickupCounty'] = county;
    if (verifiedOnly) filter['isVerifiedListing'] = true;
    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter['$gte'] = Number(minPrice);
      if (maxPrice) priceFilter['$lte'] = Number(maxPrice);
      filter['currentPricePerUnit'] = priceFilter;
    }

    // Feed sort (Marketplace Rebuild, Stage 3). Text search always sorts by
    // relevance; otherwise the buyer's chosen order, defaulting to verified-first
    // then newest. The `_id` tiebreaker keeps cursor pagination stable.
    const sortSpec: Record<string, 1 | -1> =
      sort === 'price-asc'
        ? { currentPricePerUnit: 1, _id: -1 }
        : sort === 'price-desc'
          ? { currentPricePerUnit: -1, _id: -1 }
          : sort === 'recent'
            ? { createdAt: -1, _id: -1 }
            : { isVerifiedListing: -1, createdAt: -1 };

    const listings = await (q
      ? MarketplaceListing.find(filter)
          .select({ score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(limit + 1)
          .lean()
      : MarketplaceListing.find(filter)
          .sort(sortSpec)
          .limit(limit + 1)
          .lean());

    const hasMore = !q && listings.length > limit;
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
        category: listing.category ?? null,
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

    // Farmer must be verified to list produce, and account must be active
    const farmer = await User.findById(session!.user.id).select('farmerData county status').lean();
    if (farmer?.status !== UserStatus.ACTIVE) {
      throw new AppError('Your account has been suspended.', 403, 'ACCOUNT_SUSPENDED');
    }
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
      category,
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
      category,
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

    // First-listing milestone — congratulate the farmer the first time they go
    // live (engagement nudge, fire-and-forget like every other notify side effect).
    const listingCount = await MarketplaceListing.countDocuments({
      farmerId: session!.user.id,
    });
    if (listingCount === 1) {
      void notify({
        userId: session!.user.id,
        type: NotificationType.SYSTEM,
        title: 'Your first listing is live',
        body: `"${title}" is now visible to buyers across the region. Verified listings sell faster — keep your details accurate.`,
        relatedEntity: { kind: 'MarketplaceListing', id: String(listing._id) },
      });
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
