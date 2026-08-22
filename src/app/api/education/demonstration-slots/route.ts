import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { MIN_BOOKING_LEAD_MINUTES } from '@/lib/education/scheduling';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role, SlotStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/education/demonstration-slots — times this student could book.
//
// Only open slots, only at their own institution, and only far enough ahead to
// be bookable. The filtering here matches `slotBookingRejection` exactly: a
// screen that offers a slot the API would refuse is a screen lying about the
// rule rather than enforcing it.
//
// Returns `{ data: [] }` when there are none. That is the ordinary case at an
// institution whose lecturers have not offered any times yet, and the interface
// reads it as "nothing is available yet" rather than an error.
//
// Auth: STUDENT.
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

    const earliest = new Date(Date.now() + MIN_BOOKING_LEAD_MINUTES * 60 * 1000);

    const { default: DemonstrationSlot } = await import('@/lib/models/DemonstrationSlot.model');
    const slots = await DemonstrationSlot.find({
      institutionId,
      status: SlotStatus.OPEN,
      startsAt: { $gte: earliest },
    } as object)
      .populate('lecturerId', 'firstName lastName')
      .sort({ startsAt: 1 })
      .limit(100)
      .lean();

    const data = slots.map((s) => {
      const lecturer = s.lecturerId as { firstName?: string; lastName?: string } | null;
      return {
        _id: String(s._id),
        lecturerName:
          `${lecturer?.firstName ?? ''} ${lecturer?.lastName ?? ''}`.trim() || 'A lecturer',
        startsAt: s.startsAt,
        durationMinutes: s.durationMinutes,
        format: s.format,
        notes: s.notes,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
