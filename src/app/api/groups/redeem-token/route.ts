import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { redeemTokenSchema } from '@/lib/validation/groupSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, MAX_GROUP_MEMBERS } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/groups/redeem-token — Redeem a group join token
// Auth: FARMER (must be verified — FIX-06 gate). Single-use is enforced with an
// atomic guard on `redeemedBy: null`; membership reuses the same
// $addToSet/$inc write path as the admin/creator ADD route. (BE-07)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    const body: unknown = await req.json();
    const parsed = redeemTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const token = parsed.data.token.toUpperCase();
    const farmerId = session!.user.id;

    await connectDB();

    // FIX-06 gate: group participation is restricted to verified farmers.
    const { default: User } = await import('@/lib/models/User.model');
    const farmer = await User.findById(farmerId).select('farmerData.isVerified').lean();
    if (!farmer?.farmerData?.isVerified) {
      throw new AppError(
        'Only verified farmers can join a group.',
        403,
        'FARMER_NOT_VERIFIED'
      );
    }

    const { default: GroupJoinToken } = await import('@/lib/models/GroupJoinToken.model');
    const tokenDoc = await GroupJoinToken.findOne({ token }).lean();
    if (!tokenDoc) {
      throw new AppError('Invalid join token.', 404, 'TOKEN_NOT_FOUND');
    }
    if (tokenDoc.redeemedBy) {
      throw new AppError('This token has already been redeemed.', 409, 'TOKEN_ALREADY_REDEEMED');
    }
    if (tokenDoc.expiresAt.getTime() < Date.now()) {
      throw new AppError('This token has expired.', 410, 'TOKEN_EXPIRED');
    }

    const { default: FarmerGroup } = await import('@/lib/models/FarmerGroup.model');
    const group = await FarmerGroup.findById(tokenDoc.groupId).lean();
    if (!group || group.status !== 'ACTIVE') {
      throw new AppError('The group for this token is no longer active.', 404, 'DB_NOT_FOUND');
    }

    const alreadyMember = (group.members as unknown[]).some((m) => String(m) === farmerId);
    if (alreadyMember) {
      throw new AppError('You are already a member of this group.', 409, 'ALREADY_MEMBER');
    }
    if ((group.memberCount as number) >= MAX_GROUP_MEMBERS) {
      throw new AppError(
        `Group has reached the maximum of ${MAX_GROUP_MEMBERS} members.`,
        400,
        'VALIDATION_MAX_GROUP_MEMBERS'
      );
    }

    // Single-use: atomically claim the token before mutating the roster. A
    // concurrent redemption loses the race here and gets a clean 409.
    const claimed = await GroupJoinToken.findOneAndUpdate(
      { _id: tokenDoc._id, redeemedBy: null },
      { $set: { redeemedBy: farmerId, redeemedAt: new Date() } },
      { new: true }
    ).lean();

    if (!claimed) {
      throw new AppError('This token has already been redeemed.', 409, 'TOKEN_ALREADY_REDEEMED');
    }

    const updated = await FarmerGroup.findByIdAndUpdate(
      tokenDoc.groupId,
      { $addToSet: { members: farmerId }, $inc: { memberCount: 1 } },
      { new: true }
    );

    logger.info('groups/redeem-token', 'Group join token redeemed', {
      requestId,
      groupId: String(tokenDoc.groupId),
      farmerId,
      newMemberCount: updated?.memberCount,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
