import mongoose, { Schema } from 'mongoose';
import { LecturerDecision } from '@/types';

export interface LecturerReviewDoc {
  engagementId: mongoose.Types.ObjectId;
  lecturerId: mongoose.Types.ObjectId;
  /**
   * Which pass of the engagement this review judged. A review is a step in a
   * cycle, not a single verdict: when a student revises, the engagement's
   * revision number advances and the next review is recorded against it, so
   * the earlier assessment and its feedback survive intact.
   */
  revisionNumber: number;
  decision: string;
  scores: {
    problemUnderstanding: number;
    solutionQuality: number;
    processQuality: number;
    aiUsage: number;
  };
  comments: {
    problemUnderstanding: string;
    solutionQuality: string;
    processQuality: string;
    aiUsage: string;
    overallFeedback?: string;
  };
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const lecturerReviewSchema = new Schema(
  {
    engagementId: { type: Schema.Types.ObjectId, ref: 'ProjectEngagement', required: true },
    lecturerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    revisionNumber: { type: Number, default: 0, min: 0 },
    decision: { type: String, enum: Object.values(LecturerDecision), required: true },
    scores: {
      problemUnderstanding: { type: Number, min: 1, max: 5, required: true },
      solutionQuality: { type: Number, min: 1, max: 5, required: true },
      processQuality: { type: Number, min: 1, max: 5, required: true },
      aiUsage: { type: Number, min: 1, max: 5, required: true },
    },
    comments: {
      problemUnderstanding: { type: String, required: true },
      solutionQuality: { type: String, required: true },
      processQuality: { type: String, required: true },
      aiUsage: { type: String, required: true },
      overallFeedback: { type: String },
    },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// One review per revision — the guard that lets a resubmitted project be
// reviewed again without allowing the same pass to be judged twice.
lecturerReviewSchema.index({ engagementId: 1, revisionNumber: 1 });
lecturerReviewSchema.index({ lecturerId: 1 });

lecturerReviewSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

const LecturerReview =
  (mongoose.models['LecturerReview'] as mongoose.Model<LecturerReviewDoc>) ??
  mongoose.model<LecturerReviewDoc>('LecturerReview', lecturerReviewSchema);

export default LecturerReview;
