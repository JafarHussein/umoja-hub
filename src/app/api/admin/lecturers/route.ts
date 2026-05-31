import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/admin/lecturers — list all users with role === LECTURER
// Auth: ADMIN
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    await connectDB();

    const { default: User } = await import('@/lib/models/User.model');

    const lecturers = await User.find({ role: Role.LECTURER } as object)
      .select('firstName lastName email county lecturerData.isVerified lecturerData.universityAffiliation createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: lecturers });
  } catch (error) {
    return handleApiError(error);
  }
}
