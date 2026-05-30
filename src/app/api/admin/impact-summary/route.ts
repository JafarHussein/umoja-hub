import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/admin/impact-summary — Most recent platform impact snapshot
// Auth: ADMIN
// Returns the singleton PlatformImpactSummary written by the impact-summary
// cron, augmented with two live counts (totalFarmers, totalOrders) that the
// cron does not cache.
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const [
      { default: PlatformImpactSummary },
      { default: User },
      { default: Order },
    ] = await Promise.all([
      import('@/lib/models/PlatformImpactSummary.model'),
      import('@/lib/models/User.model'),
      import('@/lib/models/Order.model'),
    ]);

    const [snapshot, totalFarmers, totalOrders] = await Promise.all([
      PlatformImpactSummary.findOne().lean(),
      User.countDocuments({ role: Role.FARMER }),
      Order.countDocuments({}),
    ]);

    if (!snapshot) {
      return NextResponse.json({ summary: null });
    }

    return NextResponse.json({
      summary: {
        totalFarmers,
        verifiedFarmers: snapshot.food?.verifiedFarmerCount ?? 0,
        totalBuyers: snapshot.food?.activeBuyerCount ?? 0,
        totalOrders,
        completedOrders: snapshot.food?.completedOrderCount ?? 0,
        totalRevenueKES: snapshot.food?.totalTransactionVolumeKES ?? 0,
        countiesCovered: snapshot.food?.countiesRepresented ?? 0,
        generatedAt: snapshot.computedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
