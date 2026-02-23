import mongoose, { Schema } from 'mongoose';
import { FarmerTrustTier } from '@/types';

const farmerTrustScoreSchema = new Schema(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    verificationScore: { type: Number, default: 0, max: 40 },
    transactionScore: {
      completedOrders: { type: Number, default: 0 },
      totalVolumeKES: { type: Number, default: 0 },
      scoreContribution: { type: Number, default: 0, max: 25 },
    },
    ratingScore: {
      averageRating: { type: Number, default: 0 },
      totalRatings: { type: Number, default: 0 },
      scoreContribution: { type: Number, default: 0, max: 20 },
    },
    reliabilityScore: {
      onTimeConfirmationRate: { type: Number, default: 1 },
      disputeCount: { type: Number, default: 0 },
      disputesRuledAgainst: { type: Number, default: 0 },
      scoreContribution: { type: Number, default: 0, max: 15 },
    },
    compositeScore: { type: Number, default: 0, max: 100 },
    tier: {
      type: String,
      enum: Object.values(FarmerTrustTier),
      default: FarmerTrustTier.NEW,
    },
    lastCalculatedAt: { type: Date },
  },
  { timestamps: true }
);

farmerTrustScoreSchema.index({ farmerId: 1 }, { unique: true });
farmerTrustScoreSchema.index({ compositeScore: -1, tier: 1 });

farmerTrustScoreSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type FarmerTrustScoreDoc = mongoose.InferSchemaType<typeof farmerTrustScoreSchema>;
const FarmerTrustScore: mongoose.Model<FarmerTrustScoreDoc> =
  (mongoose.models['FarmerTrustScore'] as mongoose.Model<FarmerTrustScoreDoc>) ??
  mongoose.model('FarmerTrustScore', farmerTrustScoreSchema);

export default FarmerTrustScore;
