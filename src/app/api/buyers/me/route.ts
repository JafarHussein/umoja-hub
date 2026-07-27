import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError } from '@/lib/utils';

// ---------------------------------------------------------------------------
// GET /api/buyers/me — the signed-in user's home county (Marketplace Rebuild,
// Stage 5). Read-only and minimal: it exists solely so the marketplace "Near
// me" filter can resolve the buyer's locality client-side without widening the
// auth session. Any authenticated role may call it; anonymous callers get 401
// and the UI falls back to a disabled toggle.
// ---------------------------------------------------------------------------

interface IUserCountyLean {
  county?: string;
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
      .select('county')
      .lean()) as IUserCountyLean | null;

    return NextResponse.json({ data: { county: user?.county ?? null } });
  } catch (error) {
    return handleApiError(error);
  }
}
