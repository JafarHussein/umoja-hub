import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import PlatformImpactSummary from '@/lib/models/PlatformImpactSummary.model';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/admin/impact-summary — Read PlatformImpactSummary singleton
// Auth: ADMIN
// The summary is written exclusively by POST /api/cron/impact-summary
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    await connectDB();

    const summary = await PlatformImpactSummary.findOne({}).sort({ computedAt: -1 }).lean();

    if (!summary) {
      return NextResponse.json(
        {
          error: 'No impact summary has been computed yet. Trigger the cron job first.',
          code: 'DB_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: summary });
  } catch (error) {
    return handleApiError(error);
  }
}
