import {
  slotBookingRejection,
  slotPublishRejection,
  slotsOverlap,
  canCompleteDemonstration,
  slotEndsAt,
  MIN_BOOKING_LEAD_MINUTES,
  ACTIVE_DEMONSTRATION_STATUSES,
  RELEASED_DEMONSTRATION_STATUSES,
} from '../scheduling';
import { DemonstrationStatus } from '@/types';

// ---------------------------------------------------------------------------
// The rules an appointment has to obey.
//
// These live outside the routes so the student's screen and the API cannot
// disagree about them: a UI that hides a past slot while the API would accept
// one is a UI lying about the rule rather than enforcing it.
// ---------------------------------------------------------------------------

const NOW = new Date('2026-09-01T09:00:00.000Z');
const hoursFromNow = (h: number): Date => new Date(NOW.getTime() + h * 60 * 60 * 1000);

describe('slotBookingRejection', () => {
  it('accepts a slot far enough ahead', () => {
    expect(
      slotBookingRejection({ startsAt: hoursFromNow(48), durationMinutes: 45, status: 'OPEN' }, NOW)
    ).toBeNull();
  });

  it('refuses a slot in the past', () => {
    expect(
      slotBookingRejection({ startsAt: hoursFromNow(-1), durationMinutes: 45, status: 'OPEN' }, NOW)
    ).toBe('SLOT_IN_PAST');
  });

  it('refuses a slot starting right now', () => {
    expect(
      slotBookingRejection({ startsAt: NOW, durationMinutes: 45, status: 'OPEN' }, NOW)
    ).toBe('SLOT_IN_PAST');
  });

  // A demonstration booked for four minutes from now is not one anybody
  // attends, and the lecturer needs time to have read the report.
  it('refuses a slot inside the booking lead time', () => {
    const tooSoon = new Date(NOW.getTime() + (MIN_BOOKING_LEAD_MINUTES - 5) * 60 * 1000);
    expect(
      slotBookingRejection({ startsAt: tooSoon, durationMinutes: 45, status: 'OPEN' }, NOW)
    ).toBe('SLOT_TOO_SOON');
  });

  it('refuses a slot somebody else has taken', () => {
    expect(
      slotBookingRejection(
        { startsAt: hoursFromNow(48), durationMinutes: 45, status: 'BOOKED' },
        NOW
      )
    ).toBe('SLOT_NOT_OPEN');
  });

  it('refuses a slot with an impossible length', () => {
    expect(
      slotBookingRejection({ startsAt: hoursFromNow(48), durationMinutes: 5, status: 'OPEN' }, NOW)
    ).toBe('SLOT_DURATION_INVALID');
    expect(
      slotBookingRejection({ startsAt: hoursFromNow(48), durationMinutes: 600, status: 'OPEN' }, NOW)
    ).toBe('SLOT_DURATION_INVALID');
  });
});

describe('slotPublishRejection', () => {
  it('accepts a sensible future slot', () => {
    expect(slotPublishRejection(hoursFromNow(24), 45, NOW)).toBeNull();
  });

  // A lecturer publishing yesterday's availability produces a slot that can
  // never be booked and sits on the student's screen looking like an option.
  it('refuses a slot in the past', () => {
    expect(slotPublishRejection(hoursFromNow(-2), 45, NOW)).toBe('SLOT_IN_PAST');
  });

  it('refuses an impossible length', () => {
    expect(slotPublishRejection(hoursFromNow(24), 1, NOW)).toBe('SLOT_DURATION_INVALID');
  });

  // Publishing has no lead-time rule — a lecturer offering a slot in ninety
  // minutes is offering a real slot.
  it('does not impose the booking lead time on publishing', () => {
    expect(slotPublishRejection(new Date(NOW.getTime() + 90 * 60 * 1000), 30, NOW)).toBeNull();
  });
});

describe('slotsOverlap', () => {
  const at = (h: number, mins: number) => ({
    startsAt: hoursFromNow(h),
    durationMinutes: mins,
    status: 'OPEN',
  });

  // The unique index stops an identical start time. It does not stop this,
  // which is the same double-booking by a different route.
  it('catches a partial overlap the unique index would miss', () => {
    expect(slotsOverlap(at(10, 60), at(10.5, 60))).toBe(true);
  });

  it('catches one slot wholly inside another', () => {
    expect(slotsOverlap(at(10, 120), at(10.5, 30))).toBe(true);
  });

  it('allows back-to-back slots', () => {
    expect(slotsOverlap(at(10, 60), at(11, 60))).toBe(false);
  });

  it('allows slots on different days', () => {
    expect(slotsOverlap(at(10, 60), at(34, 60))).toBe(false);
  });
});

describe('canCompleteDemonstration', () => {
  // A demonstration marked complete in advance is a record of a meeting that
  // has not taken place, and the value of the whole exercise rests on the
  // record being true.
  it('refuses to complete a session that has not started', () => {
    expect(canCompleteDemonstration(hoursFromNow(2), DemonstrationStatus.SCHEDULED, NOW)).toBe(
      false
    );
  });

  it('allows completion once the session is due', () => {
    expect(canCompleteDemonstration(hoursFromNow(-1), DemonstrationStatus.SCHEDULED, NOW)).toBe(
      true
    );
  });

  it('allows completion exactly at the start time', () => {
    expect(canCompleteDemonstration(NOW, DemonstrationStatus.SCHEDULED, NOW)).toBe(true);
  });

  it('refuses to complete anything that is not scheduled', () => {
    expect(canCompleteDemonstration(hoursFromNow(-1), DemonstrationStatus.REQUESTED, NOW)).toBe(
      false
    );
    expect(canCompleteDemonstration(hoursFromNow(-1), DemonstrationStatus.CANCELLED, NOW)).toBe(
      false
    );
    expect(canCompleteDemonstration(hoursFromNow(-1), DemonstrationStatus.EVALUATED, NOW)).toBe(
      false
    );
  });
});

describe('slot occupancy', () => {
  it('ends a slot after its duration', () => {
    expect(slotEndsAt({ startsAt: NOW, durationMinutes: 45, status: 'OPEN' }).toISOString()).toBe(
      '2026-09-01T09:45:00.000Z'
    );
  });

  // A student may hold exactly one live demonstration. Without that rule they
  // could request every slot a lecturer published.
  it('counts a demonstration as live until it is declined or cancelled', () => {
    expect(ACTIVE_DEMONSTRATION_STATUSES).toContain(DemonstrationStatus.REQUESTED);
    expect(ACTIVE_DEMONSTRATION_STATUSES).toContain(DemonstrationStatus.SCHEDULED);
    expect(ACTIVE_DEMONSTRATION_STATUSES).toContain(DemonstrationStatus.COMPLETED);
    expect(ACTIVE_DEMONSTRATION_STATUSES).not.toContain(DemonstrationStatus.CANCELLED);
    expect(ACTIVE_DEMONSTRATION_STATUSES).not.toContain(DemonstrationStatus.DECLINED);
  });

  it('releases the slot only when declined or cancelled', () => {
    expect(RELEASED_DEMONSTRATION_STATUSES).toEqual(
      expect.arrayContaining([DemonstrationStatus.DECLINED, DemonstrationStatus.CANCELLED])
    );
    // An evaluated demonstration keeps its slot: the appointment happened, and
    // reopening the time would misrepresent the lecturer's day.
    expect(RELEASED_DEMONSTRATION_STATUSES).not.toContain(DemonstrationStatus.EVALUATED);
  });
});
