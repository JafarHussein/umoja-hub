import mongoose, { Schema } from 'mongoose';
import { LecturerDecision } from '@/types';

const lecturerReviewSchema = new Schema(
  {
    engagementId: { type: Schema.Types.ObjectId, ref: 'ProjectEngagement', required: true },
    lecturerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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

lecturerReviewSchema.index({ engagementId: 1 });
lecturerReviewSchema.index({ lecturerId: 1 });

lecturerReviewSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

const LecturerReview =
  mongoose.models.LecturerReview ?? mongoose.model('LecturerReview', lecturerReviewSchema);

export default LecturerReview;
