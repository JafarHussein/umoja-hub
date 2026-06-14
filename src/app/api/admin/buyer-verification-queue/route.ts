import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User.model';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role, VerificationStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/admin/buyer-verification-queue — Paginated list of buyers awaiting
// KYC review (buyerData.verificationStatus === PENDING). (BE-09)
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
      role: Role.BUYER,
      'buyerData.verificationStatus': VerificationStatus.PENDING,
    };

    if (cursor) {
      filter['_id'] = { $gt: cursor };
    }

    const buyers = await User.find(filter)
      .select(
        'firstName lastName phoneNumber county buyerData.taxComplianceCertificate createdAt'
      )
      .sort({ _id: 1 })
      .limit(limit + 1)
      .lean();

    const hasMore = buyers.length > limit;
    const page = hasMore ? buyers.slice(0, limit) : buyers;
    const nextCursor = hasMore ? (page.at(-1)?._id?.toString() ?? null) : null;

    const total = await User.countDocuments(filter);

    const data = page.map((buyer) => ({
      userId: String(buyer._id),
      firstName: buyer.firstName,
      lastName: buyer.lastName,
      phoneNumber: buyer.phoneNumber,
      county: buyer.county,
      taxComplianceCertificate: buyer.buyerData?.taxComplianceCertificate ?? null,
      submittedAt: (buyer.createdAt as Date).toISOString(),
    }));

    return NextResponse.json({ data, nextCursor, total });
  } catch (error) {
    return handleApiError(error);
  }
}
