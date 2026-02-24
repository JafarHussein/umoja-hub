import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User.model';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role, VerificationStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/admin/verification-queue — Paginated list of PENDING verifications
// Auth: ADMIN
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    await connectDB();

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);

    const filter: Record<string, unknown> = {
      role: Role.FARMER,
      'farmerData.verificationStatus': VerificationStatus.PENDING,
    };

    if (cursor) {
      filter['_id'] = { $gt: cursor };
    }

    const farmers = await User.find(filter)
      .select(
        'firstName lastName phoneNumber county farmerData.documentType farmerData.documentImageUrl farmerData.documentNumber createdAt'
      )
      .sort({ _id: 1 })
      .limit(limit + 1)
      .lean();

    const hasMore = farmers.length > limit;
    const page = hasMore ? farmers.slice(0, limit) : farmers;
    const nextCursor = hasMore ? (page.at(-1)?._id?.toString() ?? null) : null;

    const total = await User.countDocuments(filter);

    const data = page.map((farmer) => ({
      userId: String(farmer._id),
      firstName: farmer.firstName,
      lastName: farmer.lastName,
      phoneNumber: farmer.phoneNumber,
      county: farmer.county,
      documentType: farmer.farmerData?.documentType ?? null,
      documentImageUrl: farmer.farmerData?.documentImageUrl ?? null,
      documentNumber: farmer.farmerData?.documentNumber ?? null,
      submittedAt: (farmer.createdAt as Date).toISOString(),
    }));

    return NextResponse.json({ data, nextCursor, total });
  } catch (error) {
    return handleApiError(error);
  }
}
