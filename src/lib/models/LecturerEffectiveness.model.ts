import mongoose, { Schema } from 'mongoose';

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

type LecturerEffectivenessDoc = mongoose.InferSchemaType<typeof lecturerEffectivenessSchema>;
const LecturerEffectiveness: mongoose.Model<LecturerEffectivenessDoc> =
  (mongoose.models['LecturerEffectiveness'] as mongoose.Model<LecturerEffectivenessDoc>) ??
  mongoose.model('LecturerEffectiveness', lecturerEffectivenessSchema);

export default LecturerEffectiveness;
