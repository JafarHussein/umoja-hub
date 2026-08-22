import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { demonstrationCancelSchema } from '@/lib/validation/educationSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { notify } from '@/lib/notifications/notify';
import {
  Role,
  ProjectStatus,
  SlotStatus,
  DemonstrationStatus,
  NotificationType,
} from '@/types';

// ---------------------------------------------------------------------------
// PATCH /api/education/demonstrations/[id] — the student cancels.
//
// Cancelling is the only thing a student may do to a demonstration once it is
// requested. They cannot accept it, cannot reschedule it into a different slot,
// and above all **cannot mark it as having happened** — a demonstration is
// evidence that a lecturer watched a system run, and a record a student can
// write themselves is not evidence of anything.
//
// The slot goes back on the board when they cancel. A slot held by an abandoned
// request is capacity nobody can use.
//
// Auth: STUDENT, owner of the demonstration.
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Demonstration not found.', 404, 'NOT_FOUND');
    }

    const body: unknown = await req.json();
    const parsed = demonstrationCancelSchema.safeParse(body);
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

    const { default: Demonstration } = await import('@/lib/models/Demonstration.model');
    const demonstration = await Demonstration.findOne({ _id: id, studentId } as object).lean();
    if (!demonstration) throw new AppError('Demonstration not found.', 404, 'NOT_FOUND');

    const cancellable: string[] = [DemonstrationStatus.REQUESTED, DemonstrationStatus.SCHEDULED];
    if (!cancellable.includes(demonstration.status)) {
      throw new AppError(
        demonstration.status === DemonstrationStatus.EVALUATED ||
        demonstration.status === DemonstrationStatus.COMPLETED
          ? 'That demonstration has already taken place.'
          : 'That demonstration is not active.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const updated = await Demonstration.findOneAndUpdate(
      { _id: id, studentId, status: demonstration.status } as object,
      {
        $set: {
          status: DemonstrationStatus.CANCELLED,
          cancelledReason: parsed.data.reason,
          cancelledBy: studentId,
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new AppError(
        'That demonstration changed while you were cancelling it.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    // Put the slot back. Scoped to this demonstration so a cancellation can
    // never reopen a slot that has since been booked by somebody else.
    const { default: DemonstrationSlot } = await import('@/lib/models/DemonstrationSlot.model');
    await DemonstrationSlot.updateOne(
      { _id: demonstration.slotId, demonstrationId: demonstration._id } as object,
      { $set: { status: SlotStatus.OPEN }, $unset: { demonstrationId: '' } }
    );

    // The project goes back to being ready for one, not back to being unready.
    // The report is still accepted; only the appointment is gone.
    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
    await ProjectEngagement.updateOne(
      {
        _id: demonstration.engagementId,
        status: {
          $in: [ProjectStatus.DEMONSTRATION_SCHEDULED, ProjectStatus.READY_FOR_DEMONSTRATION],
        },
      } as object,
      { $set: { status: ProjectStatus.READY_FOR_DEMONSTRATION } }
    );

    logger.info('education/demonstrations', 'Demonstration cancelled by student', {
      studentId,
      demonstrationId: id,
    });

    void notify({
      userId: String(demonstration.lecturerId),
      type: NotificationType.REVIEW_UPDATE,
      title: 'A demonstration was cancelled',
      body: `A student has cancelled their demonstration. The time is open again. Reason given: ${parsed.data.reason}`,
      relatedEntity: { kind: 'ProjectEngagement', id: String(demonstration.engagementId) },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
