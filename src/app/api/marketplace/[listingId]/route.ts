import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import MarketplaceListing from '@/lib/models/MarketplaceListing.model';
import { cropListingSchema } from '@/lib/validation/farmerSchema';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

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

    return NextResponse.json({
      data: {
        ...listing,
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

    // Only allow partial updates of listing fields
    const parsed = cropListingSchema.partial().safeParse(body);
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

    const updated = await MarketplaceListing.findByIdAndUpdate(listingId, parsed.data, {
      new: true,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
