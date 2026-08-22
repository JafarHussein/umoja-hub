import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import {
  demonstrationDeclineSchema,
  demonstrationEvaluationSchema,
} from '@/lib/validation/educationSchema';
import { canCompleteDemonstration } from '@/lib/education/scheduling';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { notify } from '@/lib/notifications/notify';
import {
  Role,
  ProjectStatus,
  SlotStatus,
  SubmissionStatus,
  DemonstrationStatus,
  DemonstrationOutcome,
  NotificationType,
} from '@/types';

// ---------------------------------------------------------------------------
// PATCH /api/lecturer/demonstrations/[id] — everything a lecturer does to one.
//
//   ACCEPT   REQUESTED → SCHEDULED   the time is confirmed
//   DECLINE  REQUESTED → DECLINED    with a reason; the slot goes back
//   COMPLETE SCHEDULED → COMPLETED   it happened
//   EVALUATE COMPLETED → EVALUATED   the outcome, with reasons
//
// Four actions on one route rather than four routes, because all four share the
// same authorisation, the same ownership check and the same lookup, and
// splitting them would mean writing that three more times.
//
// Only a lecturer reaches any of this. A student cannot confirm their own
// demonstration and cannot mark it as having happened — the record has to be
// worth something, and a record the assessed party can write is not.
//
// Auth: LECTURER, credential-verified, owner of the demonstration.
// ---------------------------------------------------------------------------

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('ACCEPT') }),
  z.object({ action: z.literal('DECLINE'), reason: demonstrationDeclineSchema.shape.reason }),
  z.object({ action: z.literal('COMPLETE') }),
  z.object({ action: z.literal('EVALUATE'), evaluation: demonstrationEvaluationSchema }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.LECTURER);

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Demonstration not found.', 404, 'NOT_FOUND');
    }

    const body: unknown = await req.json();
    const parsed = actionSchema.safeParse(body);
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
    const lecturerId = session!.user.id;

    const { default: User } = await import('@/lib/models/User.model');
    const lecturer = await User.findById(lecturerId).select('lecturerData.isVerified').lean();
    if (!lecturer?.lecturerData?.isVerified) {
      throw new AppError(
        'Lecturer verification required.',
        403,
        'LECTURER_NOT_VERIFIED'
      );
    }

    const { default: Demonstration } = await import('@/lib/models/Demonstration.model');
    // Ownership in the query: another lecturer's demonstration is
    // indistinguishable from one that does not exist.
    const demonstration = await Demonstration.findOne({ _id: id, lecturerId } as object).lean();
    if (!demonstration) throw new AppError('Demonstration not found.', 404, 'NOT_FOUND');

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
    const { default: DemonstrationSlot } = await import('@/lib/models/DemonstrationSlot.model');
    const engagementId = String(demonstration.engagementId);
    const studentId = String(demonstration.studentId);

    /** Advance the demonstration only from the status we read. */
    const advance = async (
      from: string,
      set: Record<string, unknown>
    ): Promise<Record<string, unknown>> => {
      const updated = await Demonstration.findOneAndUpdate(
        { _id: id, lecturerId, status: from } as object,
        { $set: set },
        { new: true }
      );
      if (!updated) {
        throw new AppError(
          'That demonstration changed while you were working on it. Reload and try again.',
          409,
          'ORDER_INVALID_STATUS_TRANSITION'
        );
      }
      return updated as unknown as Record<string, unknown>;
    };

    switch (parsed.data.action) {
      // ---- Confirm the time ----
      case 'ACCEPT': {
        if (demonstration.status !== DemonstrationStatus.REQUESTED) {
          throw new AppError(
            'That demonstration is not waiting on you.',
            409,
            'ORDER_INVALID_STATUS_TRANSITION'
          );
        }
        const updated = await advance(DemonstrationStatus.REQUESTED, {
          status: DemonstrationStatus.SCHEDULED,
        });

        await ProjectEngagement.updateOne(
          { _id: engagementId, status: ProjectStatus.READY_FOR_DEMONSTRATION } as object,
          { $set: { status: ProjectStatus.DEMONSTRATION_SCHEDULED } }
        );

        logger.info('lecturer/demonstrations', 'Demonstration confirmed', {
          lecturerId,
          demonstrationId: id,
        });

        void notify({
          userId: studentId,
          type: NotificationType.REVIEW_UPDATE,
          title: 'Your demonstration is confirmed',
          body: `Your lecturer has confirmed your demonstration for ${demonstration.scheduledFor.toUTCString()}. Have the system running and be ready to explain your decisions.`,
          relatedEntity: { kind: 'ProjectEngagement', id: engagementId },
        });

        return NextResponse.json({ data: updated });
      }

      // ---- Decline, with a reason ----
      case 'DECLINE': {
        if (demonstration.status !== DemonstrationStatus.REQUESTED) {
          throw new AppError(
            'That demonstration is not waiting on you.',
            409,
            'ORDER_INVALID_STATUS_TRANSITION'
          );
        }
        const updated = await advance(DemonstrationStatus.REQUESTED, {
          status: DemonstrationStatus.DECLINED,
          declineReason: parsed.data.reason,
        });

        // The slot goes back on the board, scoped to this demonstration so a
        // decline can never reopen a slot somebody else has since taken.
        await DemonstrationSlot.updateOne(
          { _id: demonstration.slotId, demonstrationId: demonstration._id } as object,
          { $set: { status: SlotStatus.OPEN }, $unset: { demonstrationId: '' } }
        );

        // Still ready for one — declining a time is not rejecting the project.
        await ProjectEngagement.updateOne(
          { _id: engagementId, status: ProjectStatus.DEMONSTRATION_SCHEDULED } as object,
          { $set: { status: ProjectStatus.READY_FOR_DEMONSTRATION } }
        );

        void notify({
          userId: studentId,
          type: NotificationType.REVIEW_UPDATE,
          title: 'Your demonstration time was declined',
          body: `Your lecturer could not take that time. Reason given: ${parsed.data.reason} — book another slot when you are ready.`,
          relatedEntity: { kind: 'ProjectEngagement', id: engagementId },
        });

        return NextResponse.json({ data: updated });
      }

      // ---- It happened ----
      case 'COMPLETE': {
        // Not before it was due to start. A demonstration marked complete in
        // advance is a record of a meeting that has not taken place, and the
        // value of the whole exercise rests on the record being true.
        if (!canCompleteDemonstration(demonstration.scheduledFor, demonstration.status)) {
          throw new AppError(
            demonstration.status !== DemonstrationStatus.SCHEDULED
              ? 'Only a scheduled demonstration can be marked as having happened.'
              : 'That demonstration has not started yet.',
            409,
            'DEMONSTRATION_NOT_YET_DUE'
          );
        }
        const updated = await advance(DemonstrationStatus.SCHEDULED, {
          status: DemonstrationStatus.COMPLETED,
          completedAt: new Date(),
        });

        logger.info('lecturer/demonstrations', 'Demonstration marked complete', {
          lecturerId,
          demonstrationId: id,
        });

        return NextResponse.json({ data: updated });
      }

      // ---- The outcome ----
      case 'EVALUATE': {
        if (demonstration.status !== DemonstrationStatus.COMPLETED) {
          throw new AppError(
            'Mark the demonstration as having happened before you evaluate it.',
            409,
            'ORDER_INVALID_STATUS_TRANSITION'
          );
        }

        const evaluation = parsed.data.evaluation;
        const approved = evaluation.outcome === DemonstrationOutcome.APPROVED;

        const updated = await advance(DemonstrationStatus.COMPLETED, {
          status: DemonstrationStatus.EVALUATED,
          evaluation: { ...evaluation, evaluatedAt: new Date() },
        });

        // Approved ends the project. Not approved sends it back into work —
        // never into a terminal failure. A first demonstration that goes badly
        // is a stage in the process, not the end of it.
        await ProjectEngagement.updateOne(
          { _id: engagementId, status: ProjectStatus.DEMONSTRATION_SCHEDULED } as object,
          {
            $set: {
              status: approved ? ProjectStatus.VERIFIED : ProjectStatus.REVISION_REQUIRED,
              ...(approved ? { verifiedAt: new Date() } : {}),
            },
          }
        );

        // A project sent back needs a way to hand in a new report, or the
        // student is told to revise and then refused the means to: an accepted
        // version is one the upload rule refuses to replace.
        if (!approved) {
          const { default: ProjectDocumentation } = await import(
            '@/lib/models/ProjectDocumentation.model'
          );
          await ProjectDocumentation.updateOne(
            { engagementId } as object,
            {
              $set: {
                'versions.$[accepted].status': SubmissionStatus.REVISION_REQUESTED,
              },
            } as object,
            {
              arrayFilters: [
                { 'accepted.status': SubmissionStatus.READY_FOR_DEMONSTRATION },
              ],
            }
          );
        }

        logger.info('lecturer/demonstrations', 'Demonstration evaluated', {
          lecturerId,
          demonstrationId: id,
          outcome: evaluation.outcome,
        });

        void notify({
          userId: studentId,
          type: NotificationType.REVIEW_UPDATE,
          title: approved
            ? 'Your project is complete'
            : 'Your lecturer has asked for more work after your demonstration',
          body: approved
            ? 'Your lecturer has approved your demonstration. The project is complete — you built it, you explained it, and it held up.'
            : 'Your lecturer has asked for changes following your demonstration. Open your project to read what they said, make the changes, and book another demonstration when you are ready.',
          relatedEntity: { kind: 'ProjectEngagement', id: engagementId },
        });

        return NextResponse.json({ data: updated });
      }

      default:
        throw new AppError('Unknown action.', 400, 'VALIDATION_FAILED');
    }
  } catch (error) {
    return handleApiError(error);
  }
}
