import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { demonstrationRequestSchema } from '@/lib/validation/educationSchema';
import {
  slotBookingRejection,
  SLOT_REJECTION_MESSAGE,
  ACTIVE_DEMONSTRATION_STATUSES,
} from '@/lib/education/scheduling';
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
// GET  /api/education/demonstrations — this student's demonstrations.
// POST /api/education/demonstrations — request one.
//
// A demonstration can only be requested against a project whose report has been
// accepted. That ordering is the point of the workflow: the lecturer reads the
// report first, so they arrive at the meeting knowing the project, and their
// time — the binding constraint on this entire feature — is spent on work worth
// demonstrating.
//
// Auth: STUDENT.
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    await connectDB();

    const { default: Demonstration } = await import('@/lib/models/Demonstration.model');
    const demonstrations = await Demonstration.find({ studentId: session!.user.id } as object)
      .populate('lecturerId', 'firstName lastName')
      .sort({ scheduledFor: -1 })
      .lean();

    const data = demonstrations.map((d) => {
      const lecturer = d.lecturerId as { firstName?: string; lastName?: string } | null;
      return {
        _id: String(d._id),
        engagementId: String(d.engagementId),
        lecturerName:
          `${lecturer?.firstName ?? ''} ${lecturer?.lastName ?? ''}`.trim() || 'Your lecturer',
        scheduledFor: d.scheduledFor,
        durationMinutes: d.durationMinutes,
        format: d.format,
        location: d.location,
        studentNotes: d.studentNotes,
        status: d.status,
        revisionNumber: d.revisionNumber,
        declineReason: d.declineReason,
        cancelledReason: d.cancelledReason,
        evaluation: d.evaluation,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const body: unknown = await req.json();
    const parsed = demonstrationRequestSchema.safeParse(body);
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
    const { engagementId, slotId, studentNotes } = parsed.data;

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
    const engagement = await ProjectEngagement.findOne({
      _id: engagementId,
      studentId,
    } as object)
      .select('status revisionNumber brief.title')
      .lean();

    if (!engagement) throw new AppError('Project not found.', 404, 'NOT_FOUND');

    const engagementStatus = (engagement as { status: string }).status;
    if (engagementStatus !== ProjectStatus.READY_FOR_DEMONSTRATION) {
      throw new AppError(
        engagementStatus === ProjectStatus.DEMONSTRATION_SCHEDULED
          ? 'You already have a demonstration booked for this project.'
          : 'Your report has to be accepted by a lecturer before you can book a demonstration.',
        409,
        'REPORT_NOT_ACCEPTED'
      );
    }

    const { default: Demonstration } = await import('@/lib/models/Demonstration.model');

    // One live demonstration per student. Without this a student could request
    // every slot a lecturer published and hold the cohort's capacity hostage.
    const existing = await Demonstration.findOne({
      studentId,
      status: { $in: ACTIVE_DEMONSTRATION_STATUSES },
    } as object).lean();

    if (existing) {
      throw new AppError(
        'You already have a demonstration outstanding. Cancel it before booking another.',
        409,
        'DEMONSTRATION_ALREADY_REQUESTED'
      );
    }

    const { default: DemonstrationSlot } = await import('@/lib/models/DemonstrationSlot.model');
    const slot = await DemonstrationSlot.findById(slotId).lean();
    if (!slot) throw new AppError('That time is no longer available.', 404, 'NOT_FOUND');

    // A student may only book at their own institution.
    const { default: User } = await import('@/lib/models/User.model');
    const student = await User.findById(studentId)
      .select('firstName lastName studentData.institutionId')
      .lean();
    const institutionId = student?.studentData?.institutionId;
    if (!institutionId || String(institutionId) !== String(slot.institutionId)) {
      throw new AppError('That time is no longer available.', 404, 'NOT_FOUND');
    }

    const rejection = slotBookingRejection({
      startsAt: slot.startsAt,
      durationMinutes: slot.durationMinutes,
      status: slot.status,
    });
    if (rejection) {
      throw new AppError(SLOT_REJECTION_MESSAGE[rejection], 409, rejection);
    }

    const demonstrationId = new mongoose.Types.ObjectId();

    // The one operation that has to be exactly right.
    //
    // Two students pressing book at the same instant both pass every check
    // above, because both read the slot while it was still open. The database
    // decides it: this update matches only while `status` is still OPEN, so
    // exactly one of them writes and the other is told the slot has gone.
    const claimed = await DemonstrationSlot.findOneAndUpdate(
      { _id: slotId, status: SlotStatus.OPEN } as object,
      { $set: { status: SlotStatus.BOOKED, demonstrationId } },
      { new: true }
    );

    if (!claimed) {
      throw new AppError(SLOT_REJECTION_MESSAGE.SLOT_NOT_OPEN, 409, 'SLOT_NOT_OPEN');
    }

    let demonstration;
    try {
      demonstration = await Demonstration.create({
        _id: demonstrationId,
        engagementId,
        studentId,
        lecturerId: slot.lecturerId,
        slotId,
        scheduledFor: slot.startsAt,
        durationMinutes: slot.durationMinutes,
        format: slot.format,
        ...(slot.location ? { location: slot.location } : {}),
        studentNotes,
        status: DemonstrationStatus.REQUESTED,
        revisionNumber: (engagement as { revisionNumber?: number }).revisionNumber ?? 0,
      });
    } catch (error) {
      // The slot was claimed but the demonstration could not be written. Give
      // the slot back rather than leaving it booked against nothing — an
      // unbookable slot that belongs to no demonstration is invisible wreckage.
      await DemonstrationSlot.updateOne({ _id: slotId, demonstrationId } as object, {
        $set: { status: SlotStatus.OPEN },
        $unset: { demonstrationId: '' },
      });
      throw error;
    }

    logger.info('education/demonstrations', 'Demonstration requested', {
      studentId,
      engagementId,
      slotId,
      demonstrationId: String(demonstrationId),
    });

    const studentName =
      `${student?.firstName ?? ''} ${student?.lastName ?? ''}`.trim() || 'A student';
    const projectTitle =
      (engagement as { brief?: { title?: string } }).brief?.title ?? 'their project';

    void notify({
      userId: studentId,
      type: NotificationType.REVIEW_UPDATE,
      title: 'Demonstration requested',
      body: 'Your request has gone to your lecturer. You will be told as soon as they confirm the time.',
      relatedEntity: { kind: 'ProjectEngagement', id: engagementId },
    });
    void notify({
      userId: String(slot.lecturerId),
      type: NotificationType.REVIEW_UPDATE,
      title: `${studentName} requested a demonstration`,
      body: `${studentName} has asked to demonstrate ${projectTitle} in one of the times you offered. Confirm it or decline with a reason.`,
      relatedEntity: { kind: 'ProjectEngagement', id: engagementId },
    });

    return NextResponse.json({ data: demonstration }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
