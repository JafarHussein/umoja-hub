import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { latestVersion } from '@/lib/education/report';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role, SubmissionStatus } from '@/types';
import type { ProjectDocumentationDoc } from '@/lib/models/ProjectDocumentation.model';

// ---------------------------------------------------------------------------
// GET /api/lecturer/reports — reports waiting on this lecturer.
//
// Scoped to their own institution's students, the same boundary the rest of the
// Hub enforces. A lecturer belongs to their students; a queue that showed every
// university's work would be one no lecturer could act on.
//
// Auth: LECTURER, credential-verified.
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.LECTURER);

    await connectDB();

    const { default: User } = await import('@/lib/models/User.model');
    const lecturer = await User.findById(session!.user.id)
      .select('lecturerData.isVerified lecturerData.institutionId')
      .lean();

    if (!lecturer?.lecturerData?.isVerified) {
      throw new AppError(
        'Lecturer verification required before you can review reports.',
        403,
        'LECTURER_NOT_VERIFIED'
      );
    }

    const institutionId = lecturer.lecturerData.institutionId;
    // An unscopeable lecturer is shown nothing rather than everything. Widening
    // the queue is the defect the scoping replaced.
    if (!institutionId) return NextResponse.json({ data: [] });

    const cohort = await User.find({
      role: Role.STUDENT,
      'studentData.institutionId': institutionId,
    } as object).distinct('_id');

    const { default: ProjectDocumentation } = await import(
      '@/lib/models/ProjectDocumentation.model'
    );
    const records = (await ProjectDocumentation.find({
      studentId: { $in: cohort },
      'versions.status': SubmissionStatus.SUBMITTED,
    } as object)
      .populate('studentId', 'firstName lastName')
      .lean()) as unknown as Array<ProjectDocumentationDoc & { studentId: unknown }>;

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
    const engagements = await ProjectEngagement.find({
      _id: { $in: records.map((r) => r.engagementId) },
    } as object)
      .select('brief.title brief.academicAnchor track')
      .lean();
    const engagementById = new Map(engagements.map((e) => [String(e._id), e]));

    const data = records
      .map((record) => {
        const pending = latestVersion(record.versions ?? []);
        // The record matched on *some* version being submitted; only the latest
        // one is actually waiting. An older submitted version is history.
        if (!pending || pending.status !== SubmissionStatus.SUBMITTED) return null;

        const student = record.studentId as { firstName?: string; lastName?: string } | null;
        const engagement = engagementById.get(String(record.engagementId)) as
          | {
              track?: string;
              brief?: { title?: string; academicAnchor?: { year?: number; units?: string[] } };
            }
          | undefined;

        return {
          _id: String(record._id),
          engagementId: String(record.engagementId),
          studentName:
            `${student?.firstName ?? ''} ${student?.lastName ?? ''}`.trim() || 'A student',
          projectTitle: engagement?.brief?.title ?? 'Untitled project',
          track: engagement?.track,
          year: engagement?.brief?.academicAnchor?.year,
          units: engagement?.brief?.academicAnchor?.units ?? [],
          // Which pass this is. A lecturer opening a third version should know
          // it is a third version before they open it.
          versionNumber: pending.versionNumber,
          pageCount: pending.pageCount,
          submittedAt: pending.submittedAt,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
