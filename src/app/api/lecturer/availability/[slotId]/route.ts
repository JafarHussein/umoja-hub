import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, SlotStatus } from '@/types';

// ---------------------------------------------------------------------------
// DELETE /api/lecturer/availability/[slotId] — withdraw an offered time.
//
// Withdrawing, not deleting: a slot somebody has booked is an appointment, and
// removing it silently would leave a student holding a demonstration whose time
// no longer exists. A booked slot must be handled through the demonstration
// itself — decline it or cancel it, both of which tell the student why.
//
// Auth: LECTURER, owner of the slot.
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.LECTURER);

    const { slotId } = await params;
    if (!mongoose.isValidObjectId(slotId)) {
      throw new AppError('Slot not found.', 404, 'NOT_FOUND');
    }

    await connectDB();
    const lecturerId = session!.user.id;

    const { default: DemonstrationSlot } = await import('@/lib/models/DemonstrationSlot.model');

    // Ownership is in the query, so another lecturer's slot is
    // indistinguishable from one that does not exist.
    const slot = await DemonstrationSlot.findOne({ _id: slotId, lecturerId } as object).lean();
    if (!slot) throw new AppError('Slot not found.', 404, 'NOT_FOUND');

    if (slot.status === SlotStatus.BOOKED) {
      throw new AppError(
        'A student has booked that time. Decline or cancel the demonstration instead, so they are told why.',
        409,
        'SLOT_IS_BOOKED'
      );
    }

    await DemonstrationSlot.updateOne({ _id: slotId, lecturerId } as object, {
      $set: { status: SlotStatus.WITHDRAWN },
    });

    logger.info('lecturer/availability', 'Demonstration slot withdrawn', { lecturerId, slotId });

    return NextResponse.json({ data: { slotId, status: SlotStatus.WITHDRAWN } });
  } catch (error) {
    return handleApiError(error);
  }
}
