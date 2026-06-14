import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/users/me — immutable identity records for the authenticated user.
// Auth: any signed-in role.
//
// Backs UI-12 (Q14): these records are OAuth-sourced (email, provider, GitHub
// username) or captured at onboarding (institutional email, academic numbers).
// They are NOT user-editable — only an administrator can correct them — so this
// endpoint is read-only and the consuming UI carries no edit affordance.
// ---------------------------------------------------------------------------

interface IIdentityRecords {
  email: string;
  oauthProvider: string | null;
  // Student (OAuth-sourced + institutional)
  githubUsername: string | null;
  institutionalEmail: string | null;
  institutionalEmailVerified: boolean;
  academicRegistrationNumber: string | null;
  // Lecturer (institutional)
  departmentAssignment: string | null;
  academicStaffId: string | null;
}

interface IUserIdentityLean {
  email: string;
  oauthProvider?: string;
  studentData?: {
    githubUsername?: string;
    institutionalEmail?: string;
    institutionalEmailVerified?: boolean;
    academicRegistrationNumber?: string;
  };
  lecturerData?: {
    departmentAssignment?: string;
    academicStaffId?: string;
  };
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(
      session,
      Role.FARMER,
      Role.BUYER,
      Role.STUDENT,
      Role.LECTURER,
      Role.ADMIN
    );

    await connectDB();

    const { default: User } = await import('@/lib/models/User.model');

    const user = (await User.findById(session!.user.id)
      .select(
        'email oauthProvider studentData.githubUsername studentData.institutionalEmail studentData.institutionalEmailVerified studentData.academicRegistrationNumber lecturerData.departmentAssignment lecturerData.academicStaffId'
      )
      .lean()) as IUserIdentityLean | null;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const student = user.studentData ?? {};
    const lecturer = user.lecturerData ?? {};

    const identity: IIdentityRecords = {
      email: user.email,
      oauthProvider: user.oauthProvider ?? null,
      githubUsername: student.githubUsername ?? null,
      institutionalEmail: student.institutionalEmail ?? null,
      institutionalEmailVerified: student.institutionalEmailVerified ?? false,
      academicRegistrationNumber: student.academicRegistrationNumber ?? null,
      departmentAssignment: lecturer.departmentAssignment ?? null,
      academicStaffId: lecturer.academicStaffId ?? null,
    };

    return NextResponse.json({ data: identity });
  } catch (error) {
    return handleApiError(error);
  }
}
