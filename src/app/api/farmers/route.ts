import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User.model';
import FarmerTrustScore from '@/lib/models/FarmerTrustScore.model';
import { farmerProfileSchema } from '@/lib/validation/farmerSchema';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/farmers — Farmer profile setup (crops, livestock, farm details)
// Auth: FARMER
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    const body: unknown = await req.json();
    const parsed = farmerProfileSchema
      .pick({ cropsGrown: true, livestockKept: true, farmSizeAcres: true, primaryLanguage: true })
      .safeParse(body);

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

    const { cropsGrown, livestockKept, farmSizeAcres, primaryLanguage } = parsed.data;

    const updated = await User.findByIdAndUpdate(
      session!.user.id,
      {
        $set: {
          'farmerData.cropsGrown': cropsGrown,
          'farmerData.livestockKept': livestockKept ?? [],
          ...(farmSizeAcres !== undefined && { 'farmerData.farmSizeAcres': farmSizeAcres }),
          ...(primaryLanguage !== undefined && { 'farmerData.primaryLanguage': primaryLanguage }),
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new AppError('The requested record was not found.', 404, 'DB_NOT_FOUND');
    }

    const profileComplete = Boolean(
      updated.farmerData?.cropsGrown?.length && updated.farmerData.cropsGrown.length > 0
    );

    return NextResponse.json(
      { data: { id: updated.id as string, profileComplete } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/farmers — Public farmer listing with trust score
// Auth: None (public listing; full profile requires auth)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const county = searchParams.get('county');
    const verified = searchParams.get('verified');
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);

    // Build filter
    const filter: Record<string, unknown> = { role: Role.FARMER };
    if (county) filter['county'] = county;
    if (verified === 'true') filter['farmerData.isVerified'] = true;
    if (cursor) filter['_id'] = { $gt: cursor };

    const farmers = await User.find(filter)
      .select('firstName lastName county farmerData.isVerified farmerData.cropsGrown createdAt')
      .limit(limit + 1)
      .sort({ _id: 1 })
      .lean();

    const hasMore = farmers.length > limit;
    const page = hasMore ? farmers.slice(0, limit) : farmers;
    const nextCursor = hasMore ? (page.at(-1)?._id?.toString() ?? null) : null;

    // Enrich with trust scores
    const farmerIds = page.map((f) => f._id);
    const trustScores = await FarmerTrustScore.find({ farmerId: { $in: farmerIds } })
      .select('farmerId compositeScore tier')
      .lean();

    const trustMap = new Map(trustScores.map((ts) => [String(ts.farmerId), ts]));

    const data = page.map((farmer) => {
      const trust = trustMap.get(String(farmer._id));
      return {
        id: String(farmer._id),
        firstName: farmer.firstName,
        lastName: farmer.lastName,
        county: farmer.county,
        isVerified: farmer.farmerData?.isVerified ?? false,
        trustScore: trust
          ? { compositeScore: trust.compositeScore, tier: trust.tier }
          : { compositeScore: 0, tier: 'NEW' },
        cropsGrown: farmer.farmerData?.cropsGrown ?? [],
        createdAt: (farmer.createdAt as Date).toISOString(),
      };
    });

    return NextResponse.json({ data, nextCursor, total: data.length });
  } catch (error) {
    return handleApiError(error);
  }
}
