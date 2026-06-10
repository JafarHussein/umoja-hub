import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { groupMemberSchema } from '@/lib/validation/groupSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, MAX_GROUP_MEMBERS } from '@/types';

type Params = { params: Promise<{ groupId: string }> };

// ---------------------------------------------------------------------------
// GET /api/groups/[groupId] — Group details
// Auth: FARMER (must be member) | ADMIN
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const { groupId } = await params;
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER, Role.ADMIN);

    await connectDB();

    const { default: FarmerGroup } = await import('@/lib/models/FarmerGroup.model');

    const group = await FarmerGroup.findById(groupId).lean();
    if (!group) {
      throw new AppError('Group not found.', 404, 'DB_NOT_FOUND');
    }

    if (session!.user.role !== Role.ADMIN) {
      const isMember = (group.members as unknown[]).some((m) => String(m) === session!.user.id);
      if (!isMember) {
        throw new AppError('You are not a member of this group.', 403, 'AUTH_FORBIDDEN');
      }
    }

    return NextResponse.json({ data: group });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/groups/[groupId] — Add or remove a group member
// Auth: FARMER (group creator) | ADMIN
// Body: { action: 'ADD' | 'REMOVE', userId: string }
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const { groupId } = await params;
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER, Role.ADMIN);

    const body: unknown = await req.json();
    const parsed = groupMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, userId: targetUserId } = parsed.data;
    const isAdmin = session!.user.role === Role.ADMIN;

    if (!mongoose.isValidObjectId(targetUserId)) {
      throw new AppError('Invalid user ID.', 400, 'VALIDATION_FAILED');
    }
    const targetId = new mongoose.Types.ObjectId(targetUserId);

    await connectDB();

    const { default: FarmerGroup } = await import('@/lib/models/FarmerGroup.model');

    const group = await FarmerGroup.findById(groupId).lean();
    if (!group || group.status !== 'ACTIVE') {
      throw new AppError('Group not found or inactive.', 404, 'DB_NOT_FOUND');
    }

    if (!isAdmin && String(group.createdBy) !== session!.user.id) {
      throw new AppError(
        'Only the group creator or an admin can manage members.',
        403,
        'AUTH_FORBIDDEN'
      );
    }

    const isMember = (group.members as unknown[]).some((m) => String(m) === targetUserId);

    let update: Record<string, unknown>;

    if (action === 'ADD') {
      if (isMember) {
        throw new AppError('User is already a member of this group.', 409, 'ALREADY_MEMBER');
      }
      if ((group.memberCount as number) >= MAX_GROUP_MEMBERS) {
        throw new AppError(
          `Group has reached the maximum of ${MAX_GROUP_MEMBERS} members.`,
          400,
          'VALIDATION_MAX_GROUP_MEMBERS'
        );
      }
      const { default: User } = await import('@/lib/models/User.model');
      const targetUser = await User.findById(targetId)
        .select('role farmerData.isVerified')
        .lean();
      if (!targetUser || targetUser.role !== Role.FARMER) {
        throw new AppError('User not found or is not a farmer.', 404, 'DB_NOT_FOUND');
      }
      // Group participation is restricted to verified farmers — the published
      // cooperative methodology promises this gate; enforce it server-side.
      if (!targetUser.farmerData?.isVerified) {
        throw new AppError(
          'Only verified farmers can be added to a group.',
          403,
          'FARMER_NOT_VERIFIED'
        );
      }
      update = { $addToSet: { members: targetId }, $inc: { memberCount: 1 } };
    } else {
      if (!isMember) {
        throw new AppError('User is not a member of this group.', 404, 'DB_NOT_FOUND');
      }
      if (String(group.createdBy) === targetUserId) {
        throw new AppError('Cannot remove the group creator.', 409, 'CANNOT_REMOVE_CREATOR');
      }
      update = { $pull: { members: targetId }, $inc: { memberCount: -1 } };
    }

    const updated = await FarmerGroup.findByIdAndUpdate(groupId, update, { new: true });

    logger.info('groups', `Member ${action}`, {
      requestId,
      groupId,
      targetUserId,
      actorId: session!.user.id,
      newMemberCount: updated?.memberCount,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
