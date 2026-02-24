import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import FarmerGroup from '@/lib/models/FarmerGroup.model';
import GroupOrder from '@/lib/models/GroupOrder.model';
import VerifiedSupplier from '@/lib/models/VerifiedSupplier.model';
import { groupOrderSchema } from '@/lib/validation/groupSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, MIN_GROUP_ORDER_MEMBERS, SupplierVerificationStatus } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/groups/[groupId]/orders — Propose a group input purchase order
// Auth: FARMER (must be member of the group)
// Minimum 5 members required per BUSINESS_LOGIC.md
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
): Promise<NextResponse> {
  try {
    const { groupId } = await params;
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    const body: unknown = await req.json();
    const parsed = groupOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify the group exists and the farmer is a member
    const group = await FarmerGroup.findOne({ _id: groupId });
    if (!group || group.status !== 'ACTIVE') {
      throw new AppError('Group not found or inactive.', 404, 'DB_NOT_FOUND');
    }

    const isMember = group.members.some(
      (m: unknown) => String(m) === session!.user.id
    );
    if (!isMember) {
      throw new AppError('You are not a member of this group.', 403, 'AUTH_FORBIDDEN');
    }

    // Enforce minimum members for a group order
    if (group.memberCount < MIN_GROUP_ORDER_MEMBERS) {
      throw new AppError(
        `Group orders require at least ${MIN_GROUP_ORDER_MEMBERS} members. This group has ${group.memberCount}.`,
        400,
        'VALIDATION_MIN_GROUP_ORDER'
      );
    }

    // Verify the supplier exists and is VERIFIED
    const supplier = await VerifiedSupplier.findOne({ _id: parsed.data.supplierId });
    if (!supplier || supplier.verificationStatus !== SupplierVerificationStatus.VERIFIED) {
      throw new AppError('Supplier not found or not verified.', 404, 'DB_NOT_FOUND');
    }

    const groupOrder = await GroupOrder.create({
      groupId,
      proposedBy: session!.user.id,
      supplierId: parsed.data.supplierId,
      inputType: parsed.data.inputType,
      quantityPerMember: parsed.data.quantityPerMember,
      pricePerMember: parsed.data.pricePerMember,
      joiningDeadline: new Date(parsed.data.joiningDeadline),
      minimumMembers: parsed.data.minimumMembers,
      status: 'OPEN',
      participatingMembers: [
        { userId: session!.user.id, paymentStatus: 'PENDING' },
      ],
    });

    logger.info('groups/orders', 'Group order proposed', {
      groupOrderId: groupOrder._id,
      groupId,
      proposedBy: session!.user.id,
    });

    return NextResponse.json({ data: groupOrder }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/groups/[groupId]/orders — List group orders
// Auth: FARMER (must be member of the group)
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
): Promise<NextResponse> {
  try {
    const { groupId } = await params;
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    await connectDB();

    const group = await FarmerGroup.findOne({ _id: groupId }).select('members status').lean();
    if (!group || group.status !== 'ACTIVE') {
      throw new AppError('Group not found or inactive.', 404, 'DB_NOT_FOUND');
    }

    const isMember = (group.members as unknown[]).some(
      (m: unknown) => String(m) === session!.user.id
    );
    if (!isMember) {
      throw new AppError('You are not a member of this group.', 403, 'AUTH_FORBIDDEN');
    }

    const orders = await GroupOrder.find({ groupId } as object)
      .sort({ createdAt: -1 })
      .populate('supplierId', 'businessName county')
      .lean();

    return NextResponse.json({ data: orders });
  } catch (error) {
    return handleApiError(error);
  }
}
