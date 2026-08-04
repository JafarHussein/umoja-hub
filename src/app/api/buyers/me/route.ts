import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError } from '@/lib/utils';

// ---------------------------------------------------------------------------
// GET /api/buyers/me — the signed-in user's own marketplace-facing facts.
// Read-only and deliberately narrow: it exists so client screens can resolve
// facts that do not belong in the auth session. Any authenticated role may call
// it; anonymous callers get 401 and each caller falls back gracefully.
//
//   county     — the marketplace "Near me" filter (Marketplace Rebuild, Stage 5)
//   buyerType  — individual vs business, which decides what the verification
//                screen asks a buyer to upload. Without it that screen asked
//                every buyer for a KRA tax compliance certificate.
// ---------------------------------------------------------------------------

interface IUserLean {
  county?: string;
  buyerData?: { buyerType?: string };
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }

    await connectDB();
    const { default: User } = await import('@/lib/models/User.model');

    const user = (await User.findById(session.user.id)
      .select('county buyerData.buyerType')
      .lean()) as IUserLean | null;

    return NextResponse.json({
      data: {
        county: user?.county ?? null,
        buyerType: user?.buyerData?.buyerType ?? null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
