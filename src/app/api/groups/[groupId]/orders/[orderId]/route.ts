import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { groupOrderActionSchema } from '@/lib/validation/groupSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, GroupOrderStatus } from '@/types';

type Params = { params: Promise<{ groupId: string; orderId: string }> };

// ---------------------------------------------------------------------------
// PATCH /api/groups/[groupId]/orders/[orderId]
// Auth: FARMER (JOIN) | ADMIN (CLOSE, FULFILL, CANCEL)
// Body: { action: 'JOIN' | 'CLOSE' | 'FULFILL' | 'CANCEL' }
//
// State machine:
//   JOIN    : OPEN → OPEN  (or auto-advance to MINIMUM_MET when threshold met)
//   JOIN    : MINIMUM_MET → MINIMUM_MET  (late joiners allowed until CLOSE)
//   CLOSE   : MINIMUM_MET → CLOSED       (admin locks for fulfillment)
//   FULFILL : CLOSED      → FULFILLED    (admin confirms supplier delivery)
//   CANCEL  : OPEN | MINIMUM_MET | CLOSED → CANCELLED
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const { groupId, orderId } = await params;
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER, Role.ADMIN);

    const body: unknown = await req.json();
    const parsed = groupOrderActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action } = parsed.data;
    const userId = session!.user.id;
    const isAdmin = session!.user.role === Role.ADMIN;

    if (action !== 'JOIN' && !isAdmin) {
      throw new AppError('Only admins can perform this action.', 403, 'AUTH_FORBIDDEN');
    }
    if (action === 'JOIN' && isAdmin) {
      throw new AppError('Admins cannot join group orders.', 403, 'AUTH_FORBIDDEN');
    }

    await connectDB();

    const { default: FarmerGroup } = await import('@/lib/models/FarmerGroup.model');
    const { default: GroupOrder } = await import('@/lib/models/GroupOrder.model');

    const groupOrder = await GroupOrder.findOne({ _id: orderId, groupId });
    if (!groupOrder) {
      throw new AppError('Group order not found.', 404, 'DB_NOT_FOUND');
    }

    if (action === 'JOIN') {
      const group = await FarmerGroup.findOne({ _id: groupId }).select('members status').lean();
      if (!group || group.status !== 'ACTIVE') {
        throw new AppError('Group not found or inactive.', 404, 'DB_NOT_FOUND');
      }

      const isMember = (group.members as unknown[]).some((m) => String(m) === userId);
      if (!isMember) {
        throw new AppError('You are not a member of this group.', 403, 'AUTH_FORBIDDEN');
      }

      if (
        groupOrder.status !== GroupOrderStatus.OPEN &&
        groupOrder.status !== GroupOrderStatus.MINIMUM_MET
      ) {
        throw new AppError(
          `Cannot join a group order with status ${groupOrder.status}.`,
          409,
          'INVALID_STATE_TRANSITION'
        );
      }

      if (new Date() > groupOrder.joiningDeadline) {
        throw new AppError(
          'The joining deadline for this order has passed.',
          409,
          'GROUP_ORDER_DEADLINE_PASSED'
        );
      }

      const alreadyJoined = (
        groupOrder.participatingMembers as Array<{ userId: unknown }>
      ).some((m) => String(m.userId) === userId);
      if (alreadyJoined) {
        throw new AppError(
          'You are already participating in this order.',
          409,
          'ALREADY_PARTICIPATING'
        );
      }

      const memberUserId = mongoose.isValidObjectId(userId)
        ? new mongoose.Types.ObjectId(userId)
        : userId;

      (groupOrder.participatingMembers as Array<{ userId: unknown; paymentStatus: string }>).push({
        userId: memberUserId,
        paymentStatus: 'PENDING',
      });

      // Auto-advance to MINIMUM_MET once threshold is crossed
      if (
        groupOrder.status === GroupOrderStatus.OPEN &&
        groupOrder.participatingMembers.length >= groupOrder.minimumMembers
      ) {
        groupOrder.status = GroupOrderStatus.MINIMUM_MET;
        logger.info('groups/orders', 'Minimum members met — auto-advancing status', {
          requestId,
          orderId,
          participantCount: groupOrder.participatingMembers.length,
          minimumMembers: groupOrder.minimumMembers,
        });
      }
    } else if (action === 'CLOSE') {
      if (groupOrder.status !== GroupOrderStatus.MINIMUM_MET) {
        throw new AppError(
          `Cannot close an order with status ${groupOrder.status}. Order must have MINIMUM_MET.`,
          409,
          'INVALID_STATE_TRANSITION'
        );
      }
      groupOrder.status = GroupOrderStatus.CLOSED;
    } else if (action === 'FULFILL') {
      if (groupOrder.status !== GroupOrderStatus.CLOSED) {
        throw new AppError(
          `Cannot fulfill an order with status ${groupOrder.status}. Order must be CLOSED.`,
          409,
          'INVALID_STATE_TRANSITION'
        );
      }
      groupOrder.status = GroupOrderStatus.FULFILLED;
    } else if (action === 'CANCEL') {
      if (groupOrder.status === GroupOrderStatus.FULFILLED) {
        throw new AppError('Cannot cancel a fulfilled group order.', 409, 'INVALID_STATE_TRANSITION');
      }
      groupOrder.status = GroupOrderStatus.CANCELLED;
    }

    await groupOrder.save();

    logger.info('groups/orders', 'Group order action applied', {
      requestId,
      action,
      orderId,
      groupId,
      newStatus: groupOrder.status,
      actorId: userId,
    });

    return NextResponse.json({ data: groupOrder });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/groups/[groupId]/orders/[orderId]
// Auth: FARMER (must be group member) | ADMIN
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const { groupId, orderId } = await params;
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER, Role.ADMIN);

    await connectDB();

    const { default: FarmerGroup } = await import('@/lib/models/FarmerGroup.model');
    const { default: GroupOrder } = await import('@/lib/models/GroupOrder.model');

    if (session!.user.role !== Role.ADMIN) {
      const group = await FarmerGroup.findOne({ _id: groupId }).select('members status').lean();
      if (!group || group.status !== 'ACTIVE') {
        throw new AppError('Group not found or inactive.', 404, 'DB_NOT_FOUND');
      }
      const isMember = (group.members as unknown[]).some((m) => String(m) === session!.user.id);
      if (!isMember) {
        throw new AppError('You are not a member of this group.', 403, 'AUTH_FORBIDDEN');
      }
    }

    const groupOrder = await GroupOrder.findOne({ _id: orderId, groupId })
      .populate('supplierId', 'businessName county')
      .populate('participatingMembers.userId', 'firstName lastName')
      .lean();

    if (!groupOrder) {
      throw new AppError('Group order not found.', 404, 'DB_NOT_FOUND');
    }

    return NextResponse.json({ data: groupOrder });
  } catch (error) {
    return handleApiError(error);
  }
}
