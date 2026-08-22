import mongoose, { Schema } from 'mongoose';
import {
  SubmissionStatus,
  DocumentationOutcome,
  DOCUMENTATION_CHECKLIST,
} from '@/types';

// ---------------------------------------------------------------------------
// ProjectDocumentation — the reports a student has submitted for one project.
//
// The student writes their report in whatever they normally use and uploads the
// finished PDF. UmojaHub provides the standard, receives the document, keeps
// its history, and gives the lecturer somewhere to read and review it. It is
// not a document editor, and nothing here stores the report's prose.
//
// **Versions are never overwritten.** A revision appends; the version it
// replaced is marked superseded and keeps its file and the feedback that
// prompted the change. That history is academic record — it is the only account
// of how the work developed and what the lecturer asked for — and a platform
// that quietly replaced it would destroy the evidence a disagreement would
// later turn on.
// ---------------------------------------------------------------------------

const pageNoteSchema = new Schema(
  {
    /**
     * The page in the submitted PDF this note is about.
     *
     * A plain page reference rather than a coordinate annotation. It is
     * reliable, it survives the student re-exporting the file, and it is what a
     * lecturer says out loud anyway — "page 17, why MongoDB and not Postgres".
     * An annotation layer that drifted from the document would be worse than
     * no annotation at all.
     */
    page: { type: Number, required: true, min: 1 },
    comment: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const checklistEntrySchema = new Schema(
  {
    item: { type: String, enum: [...DOCUMENTATION_CHECKLIST], required: true },
    met: { type: Boolean, required: true },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const documentationReviewSchema = new Schema(
  {
    lecturerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    outcome: { type: String, enum: Object.values(DocumentationOutcome), required: true },

    /**
     * The Hub's four-dimension rubric, unchanged.
     *
     * It is not the same instrument as the checklist below and neither replaces
     * the other. The checklist asks whether the report *contains* what the
     * standard asks for — the structural question the platform used to answer
     * for itself and can no longer answer now that the report arrives as a PDF
     * it does not read. The rubric asks how good what is there actually is.
     * Dropping either would lose a question nothing else in the workflow asks.
     */
    scores: {
      problemUnderstanding: { type: Number, required: true, min: 1, max: 5 },
      solutionQuality: { type: Number, required: true, min: 1, max: 5 },
      processQuality: { type: Number, required: true, min: 1, max: 5 },
      aiUsage: { type: Number, required: true, min: 1, max: 5 },
    },

    /** What the lecturer wants the student to take away. Always required. */
    summary: { type: String, required: true, trim: true },
    // Structured rather than one box, because "general feedback" collapses the
    // difference between what worked and what has to change, and a student
    // reading a single paragraph cannot tell which sentences are instructions.
    strengths: { type: String, trim: true },
    concerns: { type: String, trim: true },
    requiredChanges: { type: String, trim: true },
    /** What the lecturer intends to ask at the demonstration. */
    questionsForDemonstration: { type: String, trim: true },

    pageNotes: { type: [pageNoteSchema], default: [] },
    checklist: { type: [checklistEntrySchema], default: [] },

    reviewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const submissionVersionSchema = new Schema(
  {
    versionNumber: { type: Number, required: true, min: 1 },

    /** What the student called the file. Shown so they recognise their own work. */
    fileName: { type: String, required: true, trim: true },
    /**
     * Cloudinary's handle for the stored PDF.
     *
     * Never sent to a browser. The bytes are streamed back through an
     * authorised route, so every read is a decision the application makes
     * rather than one it made once at upload time.
     */
    publicId: { type: String, required: true },
    bytes: { type: Number, required: true, min: 1 },
    /** Absent when the file did not say. The interface shows "unknown". */
    pageCount: { type: Number, min: 1 },

    submittedAt: { type: Date, required: true, default: Date.now },
    /** Free text from the student — what changed since last time. */
    studentNote: { type: String, trim: true },

    status: {
      type: String,
      enum: Object.values(SubmissionStatus),
      default: SubmissionStatus.SUBMITTED,
      required: true,
    },
    review: { type: documentationReviewSchema },
  },
  { _id: true }
);

const projectDocumentationSchema = new Schema(
  {
    // One record per project, holding every version. The unique index is the
    // guard against a second record being created for a project that has one.
    engagementId: {
      type: Schema.Types.ObjectId,
      ref: 'ProjectEngagement',
      required: true,
      unique: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    versions: { type: [submissionVersionSchema], default: [] },
  },
  { timestamps: true }
);

projectDocumentationSchema.index({ studentId: 1 });
projectDocumentationSchema.index({ 'versions.status': 1, 'versions.submittedAt': 1 });

projectDocumentationSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

export interface DocumentationScores {
  problemUnderstanding: number;
  solutionQuality: number;
  processQuality: number;
  aiUsage: number;
}

export interface DocumentationReviewValue {
  lecturerId: mongoose.Types.ObjectId;
  outcome: string;
  scores: DocumentationScores;
  summary: string;
  strengths?: string;
  concerns?: string;
  requiredChanges?: string;
  questionsForDemonstration?: string;
  pageNotes: Array<{ page: number; comment: string }>;
  checklist: Array<{ item: string; met: boolean; note?: string }>;
  reviewedAt: Date;
}

export interface SubmissionVersionValue {
  _id: mongoose.Types.ObjectId;
  versionNumber: number;
  fileName: string;
  publicId: string;
  bytes: number;
  pageCount?: number;
  submittedAt: Date;
  studentNote?: string;
  status: string;
  review?: DocumentationReviewValue;
}

export interface ProjectDocumentationDoc {
  _id: mongoose.Types.ObjectId;
  engagementId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  versions: SubmissionVersionValue[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectDocumentation =
  (mongoose.models['ProjectDocumentation'] as mongoose.Model<ProjectDocumentationDoc>) ??
  mongoose.model<ProjectDocumentationDoc>('ProjectDocumentation', projectDocumentationSchema);

export default ProjectDocumentation;
