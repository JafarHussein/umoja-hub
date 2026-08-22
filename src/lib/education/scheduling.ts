import {
  DemonstrationStatus,
  DEMONSTRATION_MIN_MINUTES,
  DEMONSTRATION_MAX_MINUTES,
} from '@/types';

// ---------------------------------------------------------------------------
// The rules a demonstration appointment has to obey.
//
// Kept here rather than in the routes so they can be tested without a database
// and so the student's screen and the API cannot disagree about them — a UI
// that hides a past slot while the API would accept one is a UI that is lying
// about the rule rather than enforcing it.
//
// This is not a calendar. There is no recurrence, no timezone negotiation, no
// invitations and no video hosting: the platform manages the academic
// appointment and nothing else.
// ---------------------------------------------------------------------------

/**
 * How far ahead a slot must be to be bookable.
 *
 * A demonstration booked for four minutes from now is not a demonstration
 * anybody attends. The lecturer needs enough warning to have read the report,
 * which is the entire reason the report is reviewed first.
 */
export const MIN_BOOKING_LEAD_MINUTES = 60;

export interface SlotLike {
  startsAt: Date;
  durationMinutes: number;
  status: string;
}

export type SlotRejection =
  | 'SLOT_IN_PAST'
  | 'SLOT_TOO_SOON'
  | 'SLOT_NOT_OPEN'
  | 'SLOT_DURATION_INVALID';

/** Why this slot cannot be booked, or null when it can. */
export function slotBookingRejection(slot: SlotLike, now: Date = new Date()): SlotRejection | null {
  if (slot.startsAt.getTime() <= now.getTime()) return 'SLOT_IN_PAST';
  if (slot.startsAt.getTime() - now.getTime() < MIN_BOOKING_LEAD_MINUTES * 60 * 1000) {
    return 'SLOT_TOO_SOON';
  }
  if (slot.status !== 'OPEN') return 'SLOT_NOT_OPEN';
  if (
    slot.durationMinutes < DEMONSTRATION_MIN_MINUTES ||
    slot.durationMinutes > DEMONSTRATION_MAX_MINUTES
  ) {
    return 'SLOT_DURATION_INVALID';
  }
  return null;
}

export const SLOT_REJECTION_MESSAGE: Record<SlotRejection, string> = {
  SLOT_IN_PAST: 'That time has already passed. Choose a slot in the future.',
  SLOT_TOO_SOON: `A demonstration must be booked at least ${MIN_BOOKING_LEAD_MINUTES} minutes ahead, so your lecturer has time to read your report first.`,
  SLOT_NOT_OPEN: 'That slot has just been taken. Choose another one.',
  SLOT_DURATION_INVALID: 'That slot has an invalid length.',
};

/**
 * A demonstration that is still live — occupying the student's project and the
 * lecturer's slot.
 *
 * A student may hold exactly one of these at a time. Without that rule a
 * student could request every slot a lecturer published and hold the whole
 * cohort's capacity hostage.
 */
export const ACTIVE_DEMONSTRATION_STATUSES: string[] = [
  DemonstrationStatus.REQUESTED,
  DemonstrationStatus.SCHEDULED,
  DemonstrationStatus.COMPLETED,
];

/** Statuses in which a demonstration has finished with the slot. */
export const RELEASED_DEMONSTRATION_STATUSES: string[] = [
  DemonstrationStatus.DECLINED,
  DemonstrationStatus.CANCELLED,
];

/**
 * Whether a lecturer may publish a slot at this time.
 *
 * The past is rejected here as well as at booking: a lecturer publishing
 * yesterday's availability produces a slot that can never be booked and sits on
 * the student's screen looking like an option.
 */
export function slotPublishRejection(
  startsAt: Date,
  durationMinutes: number,
  now: Date = new Date()
): SlotRejection | null {
  if (startsAt.getTime() <= now.getTime()) return 'SLOT_IN_PAST';
  if (durationMinutes < DEMONSTRATION_MIN_MINUTES || durationMinutes > DEMONSTRATION_MAX_MINUTES) {
    return 'SLOT_DURATION_INVALID';
  }
  return null;
}

/**
 * Whether two slots for the same lecturer overlap.
 *
 * The unique index on (lecturerId, startsAt) stops an identical start time; it
 * does not stop 10:00–11:00 and 10:30–11:30, which is the same double-booking
 * by a different route.
 */
export function slotsOverlap(a: SlotLike, b: SlotLike): boolean {
  const aStart = a.startsAt.getTime();
  const aEnd = aStart + a.durationMinutes * 60 * 1000;
  const bStart = b.startsAt.getTime();
  const bEnd = bStart + b.durationMinutes * 60 * 1000;
  return aStart < bEnd && bStart < aEnd;
}

/** When a scheduled demonstration ends. */
export function slotEndsAt(slot: SlotLike): Date {
  return new Date(slot.startsAt.getTime() + slot.durationMinutes * 60 * 1000);
}

/**
 * Whether a lecturer may mark this demonstration as having happened.
 *
 * Not before it was due to start. A demonstration completed in advance is a
 * record of a meeting that has not taken place, and the whole value of the
 * demonstration rests on the record being true.
 */
export function canCompleteDemonstration(
  scheduledFor: Date,
  status: string,
  now: Date = new Date()
): boolean {
  return status === DemonstrationStatus.SCHEDULED && now.getTime() >= scheduledFor.getTime();
}
