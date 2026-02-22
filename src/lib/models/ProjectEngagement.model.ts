import mongoose, { Schema } from 'mongoose';
import { ProjectTrack, ProjectStatus, StudentTier } from '@/types';

const processDocumentSchema = new Schema(
  {
    content: { type: String },
    hash: { type: String },
    submittedAt: { type: Date },
  },
  { _id: false }
);

const blockerLogEntrySchema = new Schema(
  {
    stuckOn: { type: String, required: true },
    resolution: { type: String, required: true },
    durationHours: { type: Number, required: true },
    loggedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const aiUsageLogEntrySchema = new Schema(
  {
    toolUsed: { type: String, required: true },
    prompt: { type: String, required: true },
    outputReceived: { type: String, required: true },
    studentAction: { type: String, required: true },
    loggedAt: { type: Date, default: Date.now },
    source: { type: String, required: true },
  },
  { _id: false }
);

const githubSnapshotSchema = new Schema(
  {
    commitCount: { type: Number },
    lastCommitHash: { type: String },
    commitTimelineHash: { type: String },
    snapshotAt: { type: Date },
  },
  { _id: false }
);

const projectEngagementSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    track: { type: String, enum: Object.values(ProjectTrack), required: true },
    tier: { type: String, enum: Object.values(StudentTier), required: true },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.BRIEF_GENERATED,
    },
    brief: { type: Schema.Types.Mixed },
    briefContextId: { type: Schema.Types.ObjectId, ref: 'BriefContextLibrary' },
    githubRepoUrl: { type: String },
    githubRepoName: { type: String },
    issueUrl: { type: String },
    documents: {
      problemBreakdown: { type: processDocumentSchema },
      approachPlan: { type: processDocumentSchema },
      blockerLog: [blockerLogEntrySchema],
      aiUsageLog: [aiUsageLogEntrySchema],
      finalReflection: { type: processDocumentSchema },
    },
    githubSnapshot: { type: githubSnapshotSchema, default: () => ({}) },
    peerReviewId: { type: Schema.Types.ObjectId, ref: 'PeerReview' },
    lecturerReviewId: { type: Schema.Types.ObjectId, ref: 'LecturerReview' },
    verificationUrl: { type: String },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

projectEngagementSchema.index({ studentId: 1, status: 1 });
projectEngagementSchema.index({ status: 1 });
projectEngagementSchema.index({ verificationUrl: 1 });

projectEngagementSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

const ProjectEngagement =
  mongoose.models.ProjectEngagement ??
  mongoose.model('ProjectEngagement', projectEngagementSchema);

export default ProjectEngagement;
