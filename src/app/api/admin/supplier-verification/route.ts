import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import VerifiedSupplier from '@/lib/models/VerifiedSupplier.model';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role, SupplierVerificationStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/admin/supplier-verification — Paginated PENDING supplier queue
// Auth: ADMIN
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

    const query: Record<string, unknown> = {
      verificationStatus: SupplierVerificationStatus.PENDING,
    };

    if (cursor) query['_id'] = { $lt: cursor };

    await connectDB();

    const suppliers = await VerifiedSupplier.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = suppliers.length > limit;
    const results = hasMore ? suppliers.slice(0, limit) : suppliers;
    const nextCursor = hasMore
      ? String((results[results.length - 1] as { _id: unknown })?._id)
      : null;

    return NextResponse.json({
      data: results,
      nextCursor,
      hasMore,
      meta: { queueSize: await VerifiedSupplier.countDocuments({ verificationStatus: SupplierVerificationStatus.PENDING }) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
