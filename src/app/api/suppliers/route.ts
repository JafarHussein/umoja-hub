import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import VerifiedSupplier from '@/lib/models/VerifiedSupplier.model';
import { handleApiError } from '@/lib/utils';
import { SupplierVerificationStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/suppliers — Public paginated VERIFIED supplier directory
// Filters: county, category
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const county = searchParams.get('county');
    const category = searchParams.get('category');
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

    const query: Record<string, unknown> = {
      verificationStatus: SupplierVerificationStatus.VERIFIED,
    };

    if (county) query['county'] = county;
    if (category) query['inputCategories'] = category;
    if (cursor) query['_id'] = { $lt: cursor };

    await connectDB();

    const suppliers = await VerifiedSupplier.find(query as object)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .select(
        'businessName contactPhone contactEmail county physicalAddress inputCategories registrations verifiedAt'
      )
      .lean();

    const hasMore = suppliers.length > limit;
    const results = hasMore ? suppliers.slice(0, limit) : suppliers;
    const nextCursor = hasMore
      ? String((results[results.length - 1] as { _id: unknown })?._id)
      : null;

    return NextResponse.json({ data: results, nextCursor, hasMore });
  } catch (error) {
    return handleApiError(error);
  }
}
