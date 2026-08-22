import mongoose, { Schema } from 'mongoose';
import {
  SlotStatus,
  DemonstrationFormat,
  DEMONSTRATION_MIN_MINUTES,
  DEMONSTRATION_MAX_MINUTES,
} from '@/types';

// ---------------------------------------------------------------------------
// DemonstrationSlot — a time a lecturer has offered.
//
// This is the whole of UmojaHub's scheduling. It is not a calendar: there is no
// recurrence, no timezone negotiation, no invitations, no video hosting. The
// platform's only job is to manage the academic appointment, and a lecturer
// publishing times a student can book is the smallest thing that does it.
//
// Booking is the one operation that has to be exactly right, because two
// students booking the same slot is the failure a scheduling system exists to
// prevent. It is done as a single conditional update against `status: OPEN`
// (see `src/lib/education/scheduling.ts`), so the database decides the winner
// rather than a read-then-write in application code.
// ---------------------------------------------------------------------------

const demonstrationSlotSchema = new Schema(
  {
    lecturerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },

    startsAt: { type: Date, required: true },
    durationMinutes: {
      type: Number,
      required: true,
      min: DEMONSTRATION_MIN_MINUTES,
      max: DEMONSTRATION_MAX_MINUTES,
    },
    format: {
      type: String,
      enum: Object.values(DemonstrationFormat),
      default: DemonstrationFormat.VIDEO_CALL,
      required: true,
    },
    /** Where it happens. A joining link, or a room. Supplied by the lecturer. */
    location: { type: String, trim: true },
    notes: { type: String, trim: true },

    status: {
      type: String,
      enum: Object.values(SlotStatus),
      default: SlotStatus.OPEN,
      required: true,
    },
    /** Set when the slot is taken. Cleared if the demonstration is cancelled. */
    demonstrationId: { type: Schema.Types.ObjectId, ref: 'Demonstration' },
  },
  { timestamps: true }
);

// One lecturer cannot publish the same start time twice — the guard against a
// double-booking created by the lecturer rather than by two students.
demonstrationSlotSchema.index({ lecturerId: 1, startsAt: 1 }, { unique: true });
// The student-facing query: open slots at my institution, soonest first.
demonstrationSlotSchema.index({ institutionId: 1, status: 1, startsAt: 1 });
demonstrationSlotSchema.index({ lecturerId: 1, startsAt: 1, status: 1 });

demonstrationSlotSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

export interface DemonstrationSlotDoc {
  _id: mongoose.Types.ObjectId;
  lecturerId: mongoose.Types.ObjectId;
  institutionId: mongoose.Types.ObjectId;
  startsAt: Date;
  durationMinutes: number;
  format: string;
  location?: string;
  notes?: string;
  status: string;
  demonstrationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DemonstrationSlot =
  (mongoose.models['DemonstrationSlot'] as mongoose.Model<DemonstrationSlotDoc>) ??
  mongoose.model<DemonstrationSlotDoc>('DemonstrationSlot', demonstrationSlotSchema);

export default DemonstrationSlot;
