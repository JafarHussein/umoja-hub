import mongoose, { Schema } from 'mongoose';
import { ProjectTrack, ProjectStatus } from '@/types';

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
    // The engineering interest the brief was shaped around, and the Kenyan
    // problem domain it was set in. Both are recorded so the next project can
    // move on rather than repeating: a degree spent in one industry is not the
    // breadth this exists to give.
    //
    // A `tier` stood here — a difficulty the student picked for themselves, and
    // the only thing besides the track that decided what they were given. It is
    // gone: the units decide what the work must exercise.
    interest: { type: String, trim: true },
    industryName: { type: String, trim: true },
    // Set when a lecturer's own project is what the student is working on. The
    // project exists independently of this engagement, which is what lets a
    // lecturer close an offer without disturbing work already under way.
    assignmentId: { type: Schema.Types.ObjectId, ref: 'ProjectAssignment' },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.BRIEF_GENERATED,
    },
    brief: { type: Schema.Types.Mixed },
    briefContextId: { type: Schema.Types.ObjectId, ref: 'BriefContextLibrary' },
    // Advances every time the student resumes work after a lecturer asks for
    // revisions. Reviews are recorded against it, so a project can go round the
    // loop as many times as it needs to without overwriting its own history.
    revisionNumber: { type: Number, default: 0, min: 0 },
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

export interface ProjectEngagementDoc {
  studentId: mongoose.Types.ObjectId;
  track: string;
  interest?: string;
  industryName?: string;
  assignmentId?: mongoose.Types.ObjectId;
  status: string;
  brief?: Record<string, unknown>;
  briefContextId?: mongoose.Types.ObjectId;
  revisionNumber: number;
  githubRepoUrl?: string;
  githubRepoName?: string;
  issueUrl?: string;
  documents: {
    problemBreakdown?: { content: string; hash: string; submittedAt: Date };
    approachPlan?: { content: string; hash: string; submittedAt: Date };
    blockerLog: unknown[];
    aiUsageLog: unknown[];
    finalReflection?: { content: string; hash: string; submittedAt: Date };
  };
  peerReviewId?: mongoose.Types.ObjectId;
  lecturerReviewId?: mongoose.Types.ObjectId;
  verificationUrl?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectEngagement =
  (mongoose.models['ProjectEngagement'] as mongoose.Model<ProjectEngagementDoc>) ??
  mongoose.model<ProjectEngagementDoc>('ProjectEngagement', projectEngagementSchema);

export default ProjectEngagement;
