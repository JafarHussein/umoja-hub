import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import MarketplaceListing from '@/lib/models/MarketplaceListing.model';
import { listingUpdateSchema } from '@/lib/validation/farmerSchema';
import { revalidateMarketplace } from '@/lib/foodhub/marketplaceCache';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role, ListingStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/marketplace/[listingId] — Single listing with farmer + trust data
// Auth: public
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const { listingId } = await params;

    const listing = await MarketplaceListing.findById(listingId).lean();
    if (!listing) {
      throw new AppError(
        'This listing does not exist or has been removed.',
        404,
        'FARMER_LISTING_NOT_FOUND'
      );
    }

    const farmerId = String(listing.farmerId);

    const [{ default: User }, { default: FarmerTrustScore }] = await Promise.all([
      import('@/lib/models/User.model'),
      import('@/lib/models/FarmerTrustScore.model'),
    ]);

    const [farmer, trustScore] = await Promise.all([
      User.findById(farmerId)
        .select('firstName lastName county phoneNumber farmerData.isVerified')
        .lean(),
      FarmerTrustScore.findOne({ farmerId })
        .select('compositeScore tier ratingScore.averageRating ratingScore.totalRatings')
        .lean(),
    ]);

    // Similar listings (Marketplace Rebuild, Stage 7). Same category (or crop,
    // for pre-taxonomy listings), excluding this one, enriched to the feed card
    // shape so the detail page can reuse the ListingCard grid.
    const affinity = listing.category
      ? { category: listing.category }
      : { cropName: listing.cropName };
    const similarRaw = await MarketplaceListing.find({
      _id: { $ne: listing._id },
      listingStatus: ListingStatus.AVAILABLE,
      ...affinity,
    })
      .sort({ isVerifiedListing: -1, createdAt: -1 })
      .limit(6)
      .select(
        'title cropName category quantityAvailable unit currentPricePerUnit pickupCounty imageUrls farmerId listingStatus createdAt'
      )
      .lean();

    const simFarmerIds = [...new Set(similarRaw.map((l) => String(l.farmerId)))];
    const [simFarmers, simTrust] = await Promise.all([
      User.find({ _id: { $in: simFarmerIds } })
        .select('firstName lastName farmerData.isVerified')
        .lean(),
      FarmerTrustScore.find({ farmerId: { $in: simFarmerIds } })
        .select('farmerId compositeScore tier')
        .lean(),
    ]);
    const simFarmerMap = new Map(simFarmers.map((f) => [String(f._id), f]));
    const simTrustMap = new Map(simTrust.map((t) => [String(t.farmerId), t]));

    const similar = similarRaw.map((l) => {
      const fId = String(l.farmerId);
      const f = simFarmerMap.get(fId) as
        | { firstName?: string; lastName?: string; farmerData?: { isVerified?: boolean } }
        | undefined;
      const t = simTrustMap.get(fId) as
        | { compositeScore?: number; tier?: string }
        | undefined;
      return {
        id: String(l._id),
        title: l.title,
        cropName: l.cropName,
        category: l.category ?? null,
        quantityAvailable: l.quantityAvailable,
        unit: l.unit,
        currentPricePerUnit: l.currentPricePerUnit,
        pickupCounty: l.pickupCounty,
        imageUrl: l.imageUrls[0] ?? '',
        farmer: {
          id: fId,
          firstName: f?.firstName ?? '',
          lastName: f?.lastName ?? '',
          isVerified: f?.farmerData?.isVerified ?? false,
          trustScore: t?.compositeScore ?? 0,
          trustTier: t?.tier ?? 'NEW',
        },
        listingStatus: l.listingStatus,
        createdAt: (l.createdAt as Date).toISOString(),
      };
    });

    return NextResponse.json({
      data: {
        ...listing,
        similar,
        farmer: farmer
          ? {
              firstName: (farmer as { firstName?: string }).firstName ?? '—',
              lastName: (farmer as { lastName?: string }).lastName ?? '',
              county: (farmer as { county?: string }).county ?? '',
              phoneNumber: (farmer as { phoneNumber?: string }).phoneNumber ?? '',
              isVerified: (farmer as { farmerData?: { isVerified?: boolean } }).farmerData?.isVerified ?? false,
            }
          : null,
        trustScore: trustScore
          ? {
              compositeScore: (trustScore as { compositeScore?: number }).compositeScore ?? 0,
              tier: (trustScore as { tier?: string }).tier ?? 'NEW',
              ratingScore: {
                averageRating:
                  (trustScore as { ratingScore?: { averageRating?: number } }).ratingScore
                    ?.averageRating ?? 0,
                totalRatings:
                  (trustScore as { ratingScore?: { totalRatings?: number } }).ratingScore
                    ?.totalRatings ?? 0,
              },
            }
          : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/marketplace/[listingId] — Update listing (FARMER — own listings only)
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    const { listingId } = await params;
    const body: unknown = await req.json();

    // Partial update of listing fields plus the farmer-controllable status
    // transitions (AVAILABLE ⇄ INACTIVE). SOLD_OUT is system-managed.
    const parsed = listingUpdateSchema.safeParse(body);
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

    const listing = await MarketplaceListing.findById(listingId);
    if (!listing) {
      throw new AppError(
        'This listing does not exist or has been removed.',
        404,
        'FARMER_LISTING_NOT_FOUND'
      );
    }

    // Farmers can only edit their own listings
    if (String(listing.farmerId) !== session!.user.id) {
      throw new AppError(
        'You do not have permission to perform this action.',
        403,
        'AUTH_FORBIDDEN'
      );
    }

    // Reactivation guard: a listing may only return to AVAILABLE with stock
    // to sell — either the existing quantity or one supplied in this update.
    if (parsed.data.listingStatus === ListingStatus.AVAILABLE) {
      const effectiveQuantity = parsed.data.quantityAvailable ?? listing.quantityAvailable;
      if (effectiveQuantity <= 0) {
        throw new AppError(
          'Add stock before reactivating this listing.',
          409,
          'LISTING_NO_STOCK'
        );
      }
    }

    const updated = await MarketplaceListing.findByIdAndUpdate(listingId, parsed.data, {
      new: true,
    });

    // Pausing, reactivating or repricing changes what a buyer should be shown.
    revalidateMarketplace(listingId);

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
