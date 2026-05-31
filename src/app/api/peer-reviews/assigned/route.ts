import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role, PeerReviewStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/peer-reviews/assigned — return the reviewer's current ASSIGNED review
// Auth: STUDENT
// Returns { data: PeerReview } or { data: null } if no assignment found
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    await connectDB();

    const reviewerId = session!.user.id;
    const { default: PeerReview } = await import('@/lib/models/PeerReview.model');

    const review = await PeerReview.findOne({
      reviewerId,
      status: PeerReviewStatus.ASSIGNED,
    } as object).lean();

    return NextResponse.json({ data: review ?? null });
  } catch (error) {
    return handleApiError(error);
  }
}
