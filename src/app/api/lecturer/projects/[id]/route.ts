import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { projectAssignmentUpdateSchema } from '@/lib/validation/educationSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, AssignmentStatus } from '@/types';

// ---------------------------------------------------------------------------
// PATCH /api/lecturer/projects/[id] — edit or open/close one of the lecturer's
// own projects.
// Auth: LECTURER, credential-verified, owner of the project
//
// Closing is not deleting. Work already started under a project keeps its
// brief and its history; closing only stops anybody new taking it up.
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.LECTURER);

    const { id } = await params;
    const body: unknown = await req.json();
    const parsed = projectAssignmentUpdateSchema.safeParse(body);

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

    const { default: User } = await import('@/lib/models/User.model');
    const lecturer = await User.findById(session!.user.id)
      .select('lecturerData.isVerified')
      .lean();

    if (!lecturer?.lecturerData?.isVerified) {
      throw new AppError(
        'Lecturer verification required before you can change projects.',
        403,
        'LECTURER_NOT_VERIFIED'
      );
    }

    const { default: ProjectAssignment } = await import('@/lib/models/ProjectAssignment.model');

    // Scoped to the owner in the query itself, so somebody else's project is
    // indistinguishable from one that does not exist.
    const assignment = await ProjectAssignment.findOne({
      _id: id,
      lecturerId: session!.user.id,
    } as object);

    if (!assignment) {
      throw new AppError('Project not found.', 404, 'NOT_FOUND');
    }

    // A project that students are already working on cannot have its brief
    // rewritten underneath them — the work was started against what it said.
    // Its status can still change, which is how an offer is withdrawn.
    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
    const taken = await ProjectEngagement.countDocuments({ assignmentId: id } as object);
    const changesBrief = Object.keys(parsed.data).some((k) => k !== 'status');

    if (taken > 0 && changesBrief) {
      throw new AppError(
        `${taken} student${taken === 1 ? ' has' : 's have'} already started this project, so its brief can no longer change. You can still close it.`,
        409,
        'ASSIGNMENT_IN_USE'
      );
    }

    Object.assign(assignment, parsed.data);
    await assignment.save();

    logger.info('lecturer/projects', 'Project updated', {
      lecturerId: session!.user.id,
      assignmentId: id,
      status: assignment.status,
      closed: assignment.status === AssignmentStatus.CLOSED,
    });

    return NextResponse.json({ data: assignment });
  } catch (error) {
    return handleApiError(error);
  }
}
