import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { computeCooperativeInsights } from '@/lib/intelligence/cooperativeInsights';
import { Role } from '@/types';

type Params = { params: Promise<{ groupId: string }> };

// ---------------------------------------------------------------------------
// GET /api/groups/[groupId]/price-insights — Cooperative price insights
// Auth: FARMER (must be a member) | ADMIN
// Returns members' crop performance vs the county recommendation, top crops by
// completed-sale value, and per-crop demand trend.
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const { groupId } = await params;
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER, Role.ADMIN);

    await connectDB();
    const { default: FarmerGroup } = await import('@/lib/models/FarmerGroup.model');

    const group = await FarmerGroup.findById(groupId).select('county members').lean();
    if (!group) {
      throw new AppError('Group not found.', 404, 'DB_NOT_FOUND');
    }

    const memberIds = (group.members as unknown[]).map((m) => String(m));

    if (session!.user.role !== Role.ADMIN && !memberIds.includes(session!.user.id)) {
      throw new AppError('You are not a member of this group.', 403, 'AUTH_FORBIDDEN');
    }

    const insights = await computeCooperativeInsights({ county: group.county, memberIds });
    return NextResponse.json({ data: insights });
  } catch (error) {
    return handleApiError(error);
  }
}
