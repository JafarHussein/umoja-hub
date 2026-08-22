import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role, DemonstrationStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/lecturer/demonstrations — this lecturer's demonstrations.
//
// Requests waiting on them, meetings coming up, and meetings that have happened
// but not yet been written up. Ordered by when they are due, because that is
// the order a lecturer's week actually arrives in.
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
      .select('lecturerData.isVerified')
      .lean();

    if (!lecturer?.lecturerData?.isVerified) {
      throw new AppError(
        'Lecturer verification required before you can hold demonstrations.',
        403,
        'LECTURER_NOT_VERIFIED'
      );
    }

    const { default: Demonstration } = await import('@/lib/models/Demonstration.model');
    const demonstrations = await Demonstration.find({
      lecturerId: session!.user.id,
      status: {
        $in: [
          DemonstrationStatus.REQUESTED,
          DemonstrationStatus.SCHEDULED,
          DemonstrationStatus.COMPLETED,
        ],
      },
    } as object)
      .populate('studentId', 'firstName lastName')
      .sort({ scheduledFor: 1 })
      .lean();

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
    const engagements = await ProjectEngagement.find({
      _id: { $in: demonstrations.map((d) => d.engagementId) },
    } as object)
      .select('brief.title brief.academicAnchor githubRepoUrl')
      .lean();
    const engagementById = new Map(engagements.map((e) => [String(e._id), e]));

    const { default: ProjectDocumentation } = await import(
      '@/lib/models/ProjectDocumentation.model'
    );
    const reports = await ProjectDocumentation.find({
      engagementId: { $in: demonstrations.map((d) => d.engagementId) },
    } as object)
      .select('engagementId _id')
      .lean();
    const reportByEngagement = new Map(
      reports.map((r) => [String(r.engagementId), String(r._id)])
    );

    const data = demonstrations.map((d) => {
      const student = d.studentId as { firstName?: string; lastName?: string } | null;
      const engagement = engagementById.get(String(d.engagementId)) as
        | {
            brief?: { title?: string; academicAnchor?: { units?: string[]; year?: number } };
            githubRepoUrl?: string;
          }
        | undefined;

      return {
        _id: String(d._id),
        engagementId: String(d.engagementId),
        // The lecturer opens the report from here. Arriving at a demonstration
        // having read the project is the whole reason the report is reviewed
        // first, so the link to it belongs on this screen.
        reportId: reportByEngagement.get(String(d.engagementId)) ?? null,
        studentName: `${student?.firstName ?? ''} ${student?.lastName ?? ''}`.trim() || 'A student',
        projectTitle: engagement?.brief?.title ?? 'Untitled project',
        units: engagement?.brief?.academicAnchor?.units ?? [],
        githubRepoUrl: engagement?.githubRepoUrl,
        scheduledFor: d.scheduledFor,
        durationMinutes: d.durationMinutes,
        format: d.format,
        location: d.location,
        studentNotes: d.studentNotes,
        status: d.status,
        revisionNumber: d.revisionNumber,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
