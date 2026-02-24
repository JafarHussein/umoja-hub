import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import FarmerGroup from '@/lib/models/FarmerGroup.model';
import { groupCreationSchema } from '@/lib/validation/groupSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, MAX_GROUP_MEMBERS } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/groups — Create a farmer cooperative group
// Auth: FARMER
// Max 50 members enforced
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    const body: unknown = await req.json();
    const parsed = groupCreationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    // Check farmer is not in too many groups (optional safeguard)
    const farmerGroupCount = await FarmerGroup.countDocuments({
      members: session!.user.id,
      status: 'ACTIVE',
    } as object);

    if (farmerGroupCount >= MAX_GROUP_MEMBERS) {
      throw new AppError(
        'You have reached the maximum number of active groups.',
        400,
        'VALIDATION_MAX_GROUP_SIZE'
      );
    }

    const group = await FarmerGroup.create({
      groupName: parsed.data.groupName,
      county: parsed.data.county,
      createdBy: session!.user.id,
      members: [session!.user.id],
      memberCount: 1,
      status: 'ACTIVE',
    });

    logger.info('groups', 'Farmer group created', {
      groupId: group._id,
      farmerId: session!.user.id,
    });

    return NextResponse.json({ data: group }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/groups — List farmer's groups
// Auth: FARMER
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    await connectDB();

    const groups = await FarmerGroup.find({
      members: session!.user.id,
      status: 'ACTIVE',
    } as object)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: groups });
  } catch (error) {
    return handleApiError(error);
  }
}
