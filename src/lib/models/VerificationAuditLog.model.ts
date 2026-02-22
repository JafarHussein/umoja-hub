import mongoose, { Schema } from 'mongoose';
import { LecturerDecision } from '@/types';

// APPEND-ONLY — no timestamps: true, recordedAt is immutable
const verificationAuditLogSchema = new Schema({
  engagementId: { type: Schema.Types.ObjectId, ref: 'ProjectEngagement', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lecturerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  decision: { type: String, enum: Object.values(LecturerDecision), required: true },
  documentHashes: {
    problemBreakdown: { type: String },
    approachPlan: { type: String },
    finalReflection: { type: String },
  },
  githubSnapshot: {
    commitCount: { type: Number },
    lastCommitHash: { type: String },
    commitTimelineHash: { type: String },
  },
  reviewScores: {
    problemUnderstanding: { type: Number },
    solutionQuality: { type: Number },
    processQuality: { type: Number },
    aiUsage: { type: Number },
  },
  recordedAt: { type: Date, default: Date.now },
});

verificationAuditLogSchema.index({ engagementId: 1 });
verificationAuditLogSchema.index({ studentId: 1 });
verificationAuditLogSchema.index({ recordedAt: -1 });

verificationAuditLogSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

const VerificationAuditLog =
  mongoose.models.VerificationAuditLog ??
  mongoose.model('VerificationAuditLog', verificationAuditLogSchema);

export default VerificationAuditLog;
