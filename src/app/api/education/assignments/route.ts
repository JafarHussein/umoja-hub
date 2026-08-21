import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { loadAcademicContext } from '@/lib/education/academicContext';
import { isEligible, overlappingAreas, takenCount } from '@/lib/education/assignment';
import type { AssignmentRecord } from '@/lib/education/assignment';
import { knowledgeAreaLabels } from '@/lib/education/knowledgeAreas';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role, AssignmentStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/education/assignments — the projects this student's lecturers have
// set that are open to them.
// Auth: STUDENT
//
// Returns `{ data: [] }` when there are none. That is the ordinary case at an
// institution whose lecturers have not set any work, and the interface reads an
// empty list as "this track is not available to you yet" rather than an error.
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    await connectDB();

    const studentId = session!.user.id;
    const { default: User } = await import('@/lib/models/User.model');
    const student = await User.findById(studentId).select('studentData.institutionId').lean();
    const institutionId = student?.studentData?.institutionId;

    const academic = await loadAcademicContext(studentId);

    const { default: ProjectAssignment } = await import('@/lib/models/ProjectAssignment.model');

    // Two ways in: an open project at this student's institution, or one they
    // were named on. The named case ignores institution and semester entirely —
    // a lecturer naming a student is the strongest signal there is.
    const or: Record<string, unknown>[] = [{ assignedStudentIds: studentId }];
    if (institutionId) or.push({ institutionId });

    const candidates = (await ProjectAssignment.find({
      status: AssignmentStatus.OPEN,
      $or: or,
    } as object)
      .populate('lecturerId', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .lean()) as unknown as Array<AssignmentRecord & { lecturerId: unknown }>;

    const eligible = candidates.filter((a) =>
      isEligible(a, { studentId, institutionId, academic })
    );

    const data = await Promise.all(
      eligible.map(async (a) => {
        const taken = a.capacity ? await takenCount(a._id) : 0;
        const ref = a.lecturerId as { firstName?: string; lastName?: string } | null;
        return {
          _id: String(a._id),
          title: a.title,
          problemStatement: a.problemStatement,
          coreRequirements: a.coreRequirements,
          deliverables: a.deliverables ?? [],
          technicalConstraints: a.technicalConstraints ?? [],
          exercises: knowledgeAreaLabels(a.knowledgeAreas),
          // Named separately from `exercises`: what the lecturer says it covers
          // is their claim, and how much of it the student is actually studying
          // is a different fact worth showing next to it.
          matchesYourUnits: academic ? knowledgeAreaLabels(overlappingAreas(a, academic)) : [],
          setBy: `${ref?.firstName ?? ''} ${ref?.lastName ?? ''}`.trim() || 'Your lecturer',
          targetYear: a.targetYear,
          targetSemester: a.targetSemester,
          full: a.capacity ? taken >= a.capacity : false,
        };
      })
    );

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
