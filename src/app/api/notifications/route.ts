import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/notifications — the signed-in user's in-app inbox.
// Auth: any authenticated role. Returns the most recent notifications plus the
// current unread count. Query: ?limit (1-100, default 30), ?unread=true to
// return only unread.
// ---------------------------------------------------------------------------

const ALL_ROLES = Object.values(Role);

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, ...ALL_ROLES);

    await connectDB();

    const userId = session!.user.id;
    const url = new URL(req.url);
    const limitRaw = Number(url.searchParams.get('limit') ?? '30');
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100) : 30;
    const unreadOnly = url.searchParams.get('unread') === 'true';

    const { default: Notification } = await import('@/lib/models/Notification.model');

    const filter: Record<string, unknown> = { userId };
    if (unreadOnly) filter.readAt = null;

    const [items, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ userId, readAt: null }),
    ]);

    return NextResponse.json({ data: { items, unreadCount } });
  } catch (error) {
    return handleApiError(error);
  }
}
