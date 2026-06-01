import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/admin/farmers/[farmerId] — Fetch single farmer for admin review
// Auth: ADMIN
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ farmerId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const { farmerId } = await params;

    await connectDB();

    const { default: User } = await import('@/lib/models/User.model');

    const farmer = await User.findOne({ _id: farmerId, role: Role.FARMER })
      .select('firstName lastName email phoneNumber county status isEmailVerified farmerData createdAt')
      .lean();

    if (!farmer) {
      throw new AppError('Farmer not found.', 404, 'DB_NOT_FOUND');
    }

    return NextResponse.json({ data: farmer });
  } catch (error) {
    return handleApiError(error);
  }
}
