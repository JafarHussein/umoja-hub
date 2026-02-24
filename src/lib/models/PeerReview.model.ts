import mongoose, { Schema } from 'mongoose';
import { PeerReviewStatus } from '@/types';

const peerReviewSchema = new Schema(
  {
    engagementId: { type: Schema.Types.ObjectId, ref: 'ProjectEngagement', required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submittedAt: { type: Date },
    status: {
      type: String,
      enum: Object.values(PeerReviewStatus),
      default: PeerReviewStatus.ASSIGNED,
    },
    scores: {
      codeQuality: { type: Number, min: 1, max: 5 },
      documentationClarity: { type: Number, min: 1, max: 5 },
    },
    comments: {
      codeQuality: { type: String },
      documentationClarity: { type: String },
    },
  },
  { timestamps: true }
);

peerReviewSchema.index({ engagementId: 1 });
peerReviewSchema.index({ reviewerId: 1, status: 1 });

peerReviewSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type PeerReviewDoc = mongoose.InferSchemaType<typeof peerReviewSchema>;
const PeerReview: mongoose.Model<PeerReviewDoc> =
  (mongoose.models['PeerReview'] as mongoose.Model<PeerReviewDoc>) ??
  mongoose.model('PeerReview', peerReviewSchema);

export default PeerReview;
