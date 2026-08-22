import { NextRequest, NextResponse } from 'next/server';
import type mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { demonstrationSlotSchema } from '@/lib/validation/educationSchema';
import {
  slotPublishRejection,
  slotsOverlap,
  SLOT_REJECTION_MESSAGE,
} from '@/lib/education/scheduling';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, SlotStatus } from '@/types';

// ---------------------------------------------------------------------------
// A lecturer's demonstration availability.
//
// GET  — the slots they have published, with who booked each.
// POST — publish a new one.
//
// This is the whole scheduling system, and it is deliberately small: no
// recurrence, no timezone negotiation, no invitations, no video hosting. The
// platform manages the academic appointment. Where the meeting actually happens
// is a link or a room the lecturer supplies.
//
// Auth: LECTURER, credential-verified.
// ---------------------------------------------------------------------------

async function verifiedLecturer(sessionUserId: string): Promise<{
  institutionId: mongoose.Types.ObjectId;
}> {
  const { default: User } = await import('@/lib/models/User.model');
  const lecturer = await User.findById(sessionUserId)
    .select('lecturerData.isVerified lecturerData.institutionId')
    .lean();

  if (!lecturer?.lecturerData?.isVerified) {
    throw new AppError(
      'Lecturer verification required before you can offer demonstration times.',
      403,
      'LECTURER_NOT_VERIFIED'
    );
  }
  if (!lecturer.lecturerData.institutionId) {
    throw new AppError(
      'Your account has no institution on record, so there is no cohort to offer times to.',
      409,
      'LECTURER_NOT_AFFILIATED'
    );
  }
  return { institutionId: lecturer.lecturerData.institutionId as mongoose.Types.ObjectId };
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.LECTURER);

    await connectDB();
    await verifiedLecturer(session!.user.id);

    const { default: DemonstrationSlot } = await import('@/lib/models/DemonstrationSlot.model');
    const { default: Demonstration } = await import('@/lib/models/Demonstration.model');

    // Past slots are dropped from the lecturer's view once they are a day old.
    // A list that only grows is a list nobody reads.
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const slots = await DemonstrationSlot.find({
      lecturerId: session!.user.id,
      startsAt: { $gte: cutoff },
      status: { $ne: SlotStatus.WITHDRAWN },
    } as object)
      .sort({ startsAt: 1 })
      .lean();

    const demonstrations = await Demonstration.find({
      _id: { $in: slots.map((s) => s.demonstrationId).filter(Boolean) },
    } as object)
      .populate('studentId', 'firstName lastName')
      .lean();
    const demoById = new Map(demonstrations.map((d) => [String(d._id), d]));

    const data = slots.map((s) => {
      const demo = s.demonstrationId ? demoById.get(String(s.demonstrationId)) : undefined;
      const student = demo?.studentId as { firstName?: string; lastName?: string } | undefined;
      return {
        _id: String(s._id),
        startsAt: s.startsAt,
        durationMinutes: s.durationMinutes,
        format: s.format,
        location: s.location,
        notes: s.notes,
        status: s.status,
        ...(demo
          ? {
              demonstration: {
                _id: String(demo._id),
                status: demo.status,
                studentName:
                  `${student?.firstName ?? ''} ${student?.lastName ?? ''}`.trim() || 'A student',
              },
            }
          : {}),
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
    requireRole(session, Role.LECTURER);

    const body: unknown = await req.json();
    const parsed = demonstrationSlotSchema.safeParse(body);
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
    const { institutionId } = await verifiedLecturer(lecturerId);

    const { startsAt, durationMinutes, format, location, notes } = parsed.data;

    const rejection = slotPublishRejection(startsAt, durationMinutes);
    if (rejection) {
      throw new AppError(SLOT_REJECTION_MESSAGE[rejection], 400, rejection);
    }

    const { default: DemonstrationSlot } = await import('@/lib/models/DemonstrationSlot.model');

    // The unique index stops an identical start time. It does not stop
    // 10:00–11:00 overlapping 10:30–11:30, which is the same double-booking by
    // a different route — so the neighbours are checked as well.
    const dayStart = new Date(startsAt.getTime() - 12 * 60 * 60 * 1000);
    const dayEnd = new Date(startsAt.getTime() + 12 * 60 * 60 * 1000);
    const neighbours = await DemonstrationSlot.find({
      lecturerId,
      status: { $ne: SlotStatus.WITHDRAWN },
      startsAt: { $gte: dayStart, $lte: dayEnd },
    } as object).lean();

    const candidate = { startsAt, durationMinutes, status: SlotStatus.OPEN };
    const clash = neighbours.find((n) =>
      slotsOverlap(candidate, {
        startsAt: n.startsAt,
        durationMinutes: n.durationMinutes,
        status: n.status,
      })
    );
    if (clash) {
      throw new AppError(
        'That overlaps a time you have already offered.',
        409,
        'SLOT_OVERLAPS_EXISTING'
      );
    }

    try {
      const slot = await DemonstrationSlot.create({
        lecturerId,
        institutionId,
        startsAt,
        durationMinutes,
        format,
        ...(location ? { location } : {}),
        ...(notes ? { notes } : {}),
        status: SlotStatus.OPEN,
      });

      logger.info('lecturer/availability', 'Demonstration slot published', {
        lecturerId,
        slotId: String(slot._id),
        startsAt: startsAt.toISOString(),
      });

      return NextResponse.json({ data: slot }, { status: 201 });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new AppError(
          'You have already offered that time.',
          409,
          'SLOT_OVERLAPS_EXISTING'
        );
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
