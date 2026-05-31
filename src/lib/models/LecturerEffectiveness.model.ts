import mongoose, { Schema } from 'mongoose';

export interface LecturerEffectivenessDoc {
  lecturerId: mongoose.Types.ObjectId;
  totalReviews: number;
  verifiedCount: number;
  deniedCount: number;
  revisionCount: number;
  averageScoresGiven: {
    problemUnderstanding: number;
    solutionQuality: number;
    processQuality: number;
    aiUsage: number;
    overall: number;
  };
  averageCommentWordCount: number;
  lastReviewAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const lecturerEffectivenessSchema = new Schema(
  {
    lecturerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalReviews: { type: Number, default: 0 },
    verifiedCount: { type: Number, default: 0 },
    deniedCount: { type: Number, default: 0 },
    revisionCount: { type: Number, default: 0 },
    averageScoresGiven: {
      problemUnderstanding: { type: Number, default: 0 },
      solutionQuality: { type: Number, default: 0 },
      processQuality: { type: Number, default: 0 },
      aiUsage: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },
    averageCommentWordCount: { type: Number, default: 0 },
    lastReviewAt: { type: Date },
  },
  { timestamps: true }
);

lecturerEffectivenessSchema.index({ lecturerId: 1 }, { unique: true });

lecturerEffectivenessSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

const LecturerEffectiveness =
  (mongoose.models['LecturerEffectiveness'] as mongoose.Model<LecturerEffectivenessDoc>) ??
  mongoose.model<LecturerEffectivenessDoc>('LecturerEffectiveness', lecturerEffectivenessSchema);

export default LecturerEffectiveness;
