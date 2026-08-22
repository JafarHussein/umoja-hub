import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/education/programmes — the published curriculum of the caller's
// institution, if it has published one.
// Auth: STUDENT
//
// Returns `{ data: [] }` rather than a 404 when the institution has published
// nothing, or when the student has no institution on record. That is not an
// error state: a student at a university that has never heard of UmojaHub must
// still be able to record what they are studying, and the interface reads an
// empty list as "type it out yourself".
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    await connectDB();

    const { default: User } = await import('@/lib/models/User.model');
    const student = await User.findById(session!.user.id)
      .select('studentData.institutionId')
      .lean();

    const institutionId = student?.studentData?.institutionId;
    if (!institutionId) return NextResponse.json({ data: [] });

    const { default: AcademicProgramme } = await import('@/lib/models/AcademicProgramme.model');
    const { default: CurriculumUnit } = await import('@/lib/models/CurriculumUnit.model');

    const programmes = await AcademicProgramme.find({ institutionId } as object)
      .sort({ name: 1 })
      .lean();

    if (programmes.length === 0) return NextResponse.json({ data: [] });

    const units = await CurriculumUnit.find({
      programmeId: { $in: programmes.map((p) => p._id) },
    } as object)
      .sort({ year: 1, semester: 1, code: 1 })
      .lean();

    const unitsByProgramme = new Map<string, typeof units>();
    for (const unit of units) {
      const key = String(unit.programmeId);
      const bucket = unitsByProgramme.get(key);
      if (bucket) bucket.push(unit);
      else unitsByProgramme.set(key, [unit]);
    }

    const data = programmes.map((programme) => ({
      _id: String(programme._id),
      name: programme.name,
      discipline: programme.discipline,
      durationYears: programme.durationYears,
      semestersPerYear: programme.semestersPerYear,
      units: (unitsByProgramme.get(String(programme._id)) ?? []).map((unit) => ({
        _id: String(unit._id),
        code: unit.code,
        title: unit.title,
        year: unit.year,
        semester: unit.semester,
        knowledgeAreas: unit.knowledgeAreas,
      })),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
