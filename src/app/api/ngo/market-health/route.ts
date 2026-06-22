import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole } from '@/lib/utils';
import { computeNgoMarketHealth } from '@/lib/intelligence/ngoMarketHealth';
import { Role, KENYAN_COUNTIES } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/ngo/market-health — Aggregate market-health insights
// Auth: NGO (scoped to the counties it serves + its sponsored cooperatives) |
//       ADMIN (all counties).
// Returns food availability, shortage alerts, and price stability. Aggregate
// and anonymised — NGOs remain non-transactional.
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.NGO, Role.ADMIN);

    await connectDB();

    let counties: string[];
    if (session!.user.role === Role.ADMIN) {
      counties = [...KENYAN_COUNTIES];
    } else {
      const { default: NgoOrganization } = await import('@/lib/models/NgoOrganization.model');
      const { default: FarmerGroup } = await import('@/lib/models/FarmerGroup.model');

      const org = await NgoOrganization.findOne({ adminUserId: session!.user.id })
        .select('countiesServed')
        .lean();
      const sponsored = org
        ? await FarmerGroup.find({ sponsoredByNgoId: org._id }).select('county').lean()
        : [];

      counties = [
        ...new Set([...(org?.countiesServed ?? []), ...sponsored.map((g) => g.county)]),
      ];
    }

    const data = await computeNgoMarketHealth(counties);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
