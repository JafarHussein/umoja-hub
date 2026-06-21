import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// PATCH /api/notifications/read-all — mark every unread notification for the
// signed-in user as read. Auth: any authenticated role.
// ---------------------------------------------------------------------------

const ALL_ROLES = Object.values(Role);

export async function PATCH(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, ...ALL_ROLES);

    await connectDB();

    const userId = session!.user.id;
    const { default: Notification } = await import('@/lib/models/Notification.model');

    const result = await Notification.updateMany(
      { userId, readAt: null },
      { $set: { readAt: new Date() } }
    );

    return NextResponse.json({ data: { modified: result.modifiedCount } });
  } catch (error) {
    return handleApiError(error);
  }
}
