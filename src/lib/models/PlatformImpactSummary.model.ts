import mongoose, { Schema } from 'mongoose';

const platformImpactSummarySchema = new Schema({
  computedAt: { type: Date, required: true },
  food: {
    verifiedFarmerCount: { type: Number, default: 0 },
    activeBuyerCount: { type: Number, default: 0 },
    completedOrderCount: { type: Number, default: 0 },
    totalTransactionVolumeKES: { type: Number, default: 0 },
    averagePlatformPremium: { type: Number, default: 0 },
    activeCropCount: { type: Number, default: 0 },
    countiesRepresented: { type: Number, default: 0 },
    avgTrustScore: { type: Number, default: 0 },
  },
  education: {
    registeredStudentCount: { type: Number, default: 0 },
    verifiedProjectCount: { type: Number, default: 0 },
    activeStudentCount: { type: Number, default: 0 },
    averageProjectScore: { type: Number, default: 0 },
    skillsIssuedCount: { type: Number, default: 0 },
    lecturerCount: { type: Number, default: 0 },
    universitiesRepresented: { type: Number, default: 0 },
  },
});

// No timestamps — singleton upsert, computedAt is the timestamp

platformImpactSummarySchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type PlatformImpactSummaryDoc = mongoose.InferSchemaType<typeof platformImpactSummarySchema>;
const PlatformImpactSummary: mongoose.Model<PlatformImpactSummaryDoc> =
  (mongoose.models['PlatformImpactSummary'] as mongoose.Model<PlatformImpactSummaryDoc>) ??
  mongoose.model('PlatformImpactSummary', platformImpactSummarySchema);

export default PlatformImpactSummary;
