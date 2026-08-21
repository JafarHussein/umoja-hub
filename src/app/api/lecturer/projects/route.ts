import { NextRequest, NextResponse } from 'next/server';
import type mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { projectAssignmentSchema } from '@/lib/validation/educationSchema';
import { takenCount } from '@/lib/education/assignment';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, AssignmentAudience } from '@/types';

// ---------------------------------------------------------------------------
// A lecturer's own projects.
// Auth: LECTURER, credential-verified
//
// Verification is the same gate that governs reviewing. Setting work a student
// will spend a semester on is at least as consequential as marking it, so an
// unverified account cannot do it either.
// ---------------------------------------------------------------------------

async function verifiedLecturer(
  sessionUserId: string
): Promise<{ institutionId: mongoose.Types.ObjectId; name: string }> {
  const { default: User } = await import('@/lib/models/User.model');
  const lecturer = await User.findById(sessionUserId)
    .select('firstName lastName lecturerData.isVerified lecturerData.institutionId')
    .lean();

  if (!lecturer?.lecturerData?.isVerified) {
    throw new AppError(
      'Lecturer verification required before you can set projects.',
      403,
      'LECTURER_NOT_VERIFIED'
    );
  }
  if (!lecturer.lecturerData.institutionId) {
    // Without an institution there is no cohort to offer work to, and offering
    // it to everybody is the defect the review queue already had to fix.
    throw new AppError(
      'Your account has no institution on record, so there is no cohort to set work for.',
      409,
      'LECTURER_NOT_AFFILIATED'
    );
  }
  return {
    institutionId: lecturer.lecturerData.institutionId as mongoose.Types.ObjectId,
    name: `${lecturer.firstName ?? ''} ${lecturer.lastName ?? ''}`.trim() || 'Your lecturer',
  };
}

// GET — every project this lecturer has written, with how many students took
// each one up. The count is what tells them whether an offer is working.
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.LECTURER);

    await connectDB();
    await verifiedLecturer(session!.user.id);

    const { default: ProjectAssignment } = await import('@/lib/models/ProjectAssignment.model');
    const assignments = (await ProjectAssignment.find({
      lecturerId: session!.user.id,
    } as object)
      .sort({ updatedAt: -1 })
      .lean()) as unknown as Array<Record<string, unknown> & { _id: mongoose.Types.ObjectId }>;

    const withCounts = await Promise.all(
      assignments.map(async (a) => ({
        ...a,
        _id: String(a._id),
        takenBy: await takenCount(a._id),
      }))
    );

    return NextResponse.json({ data: withCounts });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST — write a new project.
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.LECTURER);

    const body: unknown = await req.json();
    const parsed = projectAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'The submitted data is invalid.',
          code: 'VALIDATION_FAILED',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    await connectDB();
    const lecturer = await verifiedLecturer(session!.user.id);

    if (
      parsed.data.audience === AssignmentAudience.NAMED &&
      parsed.data.assignedStudentIds.length === 0
    ) {
      throw new AppError(
        'A named project needs at least one student on it.',
        400,
        'VALIDATION_FAILED'
      );
    }

    // Named students must be this lecturer's own. A lecturer belongs to their
    // students; setting work for somebody else's is the same boundary the
    // review queue enforces, in the other direction.
    if (parsed.data.assignedStudentIds.length > 0) {
      const { default: User } = await import('@/lib/models/User.model');
      const inCohort = await User.countDocuments({
        _id: { $in: parsed.data.assignedStudentIds },
        role: Role.STUDENT,
        'studentData.institutionId': lecturer.institutionId,
      } as object);

      if (inCohort !== parsed.data.assignedStudentIds.length) {
        throw new AppError(
          'You can only set work for students at your own institution.',
          403,
          'STUDENT_OUTSIDE_COHORT'
        );
      }
    }

    const { capacity, ...rest } = parsed.data;
    const { default: ProjectAssignment } = await import('@/lib/models/ProjectAssignment.model');
    const assignment = await ProjectAssignment.create({
      ...rest,
      // Omitted rather than set to undefined: "no limit" is the absence of a
      // capacity, not a capacity of nothing.
      ...(capacity !== undefined ? { capacity } : {}),
      lecturerId: session!.user.id,
      institutionId: lecturer.institutionId,
    });

    logger.info('lecturer/projects', 'Project set by lecturer', {
      lecturerId: session!.user.id,
      assignmentId: String(assignment._id),
      audience: parsed.data.audience,
      status: parsed.data.status,
    });

    return NextResponse.json({ data: assignment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
