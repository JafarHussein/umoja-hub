import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { enrolmentUpdateSchema } from '@/lib/validation/academicSchema';
import { resolveEnrolment, toAcademicContext } from '@/lib/education/academicContext';
import type { EnrolmentRecord } from '@/lib/education/academicContext';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, UserStatus } from '@/types';

// ---------------------------------------------------------------------------
// The student's own academic record — what they are studying this semester.
// Auth: STUDENT (their own record only; there is no path to anybody else's)
// ---------------------------------------------------------------------------

// GET — the caller's enrolment as the Hub reads it, or `{ data: null }` when
// they have not recorded one. Never a 404: not having declared yet is a normal
// state, not a missing resource.
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    await connectDB();

    const { default: StudentEnrolment } = await import('@/lib/models/StudentEnrolment.model');
    const enrolment = await StudentEnrolment.findOne({
      studentId: session!.user.id,
    } as object).lean();

    if (!enrolment) return NextResponse.json({ data: null });

    return NextResponse.json({
      data: {
        programmeId: enrolment.programmeId ? String(enrolment.programmeId) : null,
        context: toAcademicContext(enrolment as EnrolmentRecord),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT — record or replace the caller's enrolment.
//
// Replace, not merge: a semester ends and the units change wholesale, and a
// merge would leave last semester's units quietly attached to this semester's
// work.
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const body: unknown = await req.json();
    const parsed = enrolmentUpdateSchema.safeParse(body);

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

    const studentId = session!.user.id;
    const { default: User } = await import('@/lib/models/User.model');
    const student = await User.findById(studentId).select('status studentData.institutionId').lean();

    if (student?.status !== UserStatus.ACTIVE) {
      throw new AppError('Your account has been suspended.', 403, 'ACCOUNT_SUSPENDED');
    }

    // Provenance is decided from the data, never taken from the request — see
    // `resolveEnrolment`. A claim that grades itself is not evidence.
    const resolved = await resolveEnrolment(parsed.data, student.studentData?.institutionId);

    const { default: StudentEnrolment } = await import('@/lib/models/StudentEnrolment.model');
    const enrolment = await StudentEnrolment.findOneAndUpdate(
      { studentId } as object,
      {
        $set: {
          studentId,
          programmeName: resolved.programmeName,
          discipline: resolved.discipline,
          currentYear: parsed.data.currentYear,
          currentSemester: parsed.data.currentSemester,
          currentUnits: resolved.currentUnits,
          completedUnits: resolved.completedUnits,
          provenance: resolved.provenance,
          provenanceRecordedAt: new Date(),
          ...(resolved.programmeId ? { programmeId: resolved.programmeId } : {}),
          ...(resolved.institutionId ? { institutionId: resolved.institutionId } : {}),
        },
        ...(resolved.programmeId ? {} : { $unset: { programmeId: '' } }),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    logger.info('education/enrolment', 'Enrolment recorded', {
      studentId,
      provenance: resolved.provenance,
      unitCount: resolved.currentUnits.length,
    });

    return NextResponse.json({
      data: {
        programmeId: resolved.programmeId ? String(resolved.programmeId) : null,
        context: toAcademicContext(enrolment as EnrolmentRecord | null),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
