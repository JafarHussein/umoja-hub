import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// PATCH /api/notifications/[id] — mark one of the user's own notifications read.
// Auth: any authenticated role. Ownership is enforced by the userId filter, so a
// user can never mark another user's notification read.
// ---------------------------------------------------------------------------

const ALL_ROLES = Object.values(Role);

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, ...ALL_ROLES);

    await connectDB();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid notification id', 400, 'INVALID_ID');
    }

    const userId = session!.user.id;
    const { default: Notification } = await import('@/lib/models/Notification.model');

    const updated = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { $set: { readAt: new Date() } },
      { new: true }
    ).lean();

    if (!updated) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
