import mongoose, { Schema } from 'mongoose';
import {
  DemonstrationStatus,
  DemonstrationFormat,
  DemonstrationOutcome,
  DEMONSTRATION_CRITERIA,
} from '@/types';

// ---------------------------------------------------------------------------
// Demonstration — the appointment, and the record of what happened at it.
//
// The centre of assessment. A report can be fabricated, generated or written by
// somebody else, and marking one tells you about a student's writing. A system
// running under questioning tells you whether they built it and whether they
// understand it. The academic guideline this workflow is modelled on weighted
// the system demonstration at 60 marks of 100 against 30 for documentation; the
// Hub had no concept of a demonstration at all.
//
// The appointment and the evaluation live on one document on purpose. An
// evaluation is the record of an event, and separating them would allow an
// evaluation of a meeting that never happened.
//
// Who may do what is the load-bearing rule here. A student requests and may
// cancel. Only the lecturer schedules, declines, completes or evaluates — a
// student cannot mark their own demonstration as having taken place.
// ---------------------------------------------------------------------------

const evaluationScoreFields = DEMONSTRATION_CRITERIA.reduce(
  (acc, criterion) => {
    acc[criterion] = { type: Number, min: 1, max: 5, required: true };
    return acc;
  },
  {} as Record<string, { type: NumberConstructor; min: number; max: number; required: boolean }>
);

const evaluationCommentFields = DEMONSTRATION_CRITERIA.reduce(
  (acc, criterion) => {
    acc[criterion] = { type: String, required: true, trim: true };
    return acc;
  },
  {} as Record<string, { type: StringConstructor; required: boolean; trim: boolean }>
);

const evaluationSchema = new Schema(
  {
    scores: evaluationScoreFields,
    comments: evaluationCommentFields,
    outcome: { type: String, enum: Object.values(DemonstrationOutcome), required: true },
    /**
     * What the lecturer asked and how the student answered. The questioning is
     * where understanding is actually established, so it is worth a record —
     * and it is what a student reads when told to revise.
     */
    questioningNotes: { type: String, trim: true },
    /**
     * Whether the system failed during the demonstration, and what the student
     * did about it. Recorded separately because a failure is assessed on the
     * response to it, not on the fact of it, and burying that in a score would
     * lose the distinction.
     */
    failureDuringDemonstration: { type: String, trim: true },
    evaluatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const demonstrationSchema = new Schema(
  {
    engagementId: { type: Schema.Types.ObjectId, ref: 'ProjectEngagement', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lecturerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    slotId: { type: Schema.Types.ObjectId, ref: 'DemonstrationSlot', required: true },

    scheduledFor: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    format: { type: String, enum: Object.values(DemonstrationFormat), required: true },
    location: { type: String, trim: true },

    /**
     * What the student says they will show, and what they know is incomplete.
     * Declaring a known gap in advance is professional behaviour and is treated
     * as such — this field exists so there is somewhere to do it.
     */
    studentNotes: { type: String, trim: true },

    status: {
      type: String,
      enum: Object.values(DemonstrationStatus),
      default: DemonstrationStatus.REQUESTED,
      required: true,
    },
    /** Which pass of the project this demonstration was for. */
    revisionNumber: { type: Number, default: 0, min: 0 },

    /** Set when a lecturer declines or either party cancels. Always with a reason. */
    declineReason: { type: String, trim: true },
    cancelledReason: { type: String, trim: true },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },

    completedAt: { type: Date },
    evaluation: { type: evaluationSchema },
  },
  { timestamps: true }
);

demonstrationSchema.index({ studentId: 1, status: 1 });
demonstrationSchema.index({ lecturerId: 1, status: 1, scheduledFor: 1 });
demonstrationSchema.index({ engagementId: 1, revisionNumber: 1 });
demonstrationSchema.index({ status: 1, scheduledFor: 1 });

demonstrationSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

export interface DemonstrationEvaluationValue {
  scores: Record<string, number>;
  comments: Record<string, string>;
  outcome: string;
  questioningNotes?: string;
  failureDuringDemonstration?: string;
  evaluatedAt: Date;
}

export interface DemonstrationDoc {
  _id: mongoose.Types.ObjectId;
  engagementId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  lecturerId: mongoose.Types.ObjectId;
  slotId: mongoose.Types.ObjectId;
  scheduledFor: Date;
  durationMinutes: number;
  format: string;
  location?: string;
  studentNotes?: string;
  status: string;
  revisionNumber: number;
  declineReason?: string;
  cancelledReason?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
  evaluation?: DemonstrationEvaluationValue;
  createdAt: Date;
  updatedAt: Date;
}

const Demonstration =
  (mongoose.models['Demonstration'] as mongoose.Model<DemonstrationDoc>) ??
  mongoose.model<DemonstrationDoc>('Demonstration', demonstrationSchema);

export default Demonstration;
