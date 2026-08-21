import mongoose, { Schema } from 'mongoose';
import {
  AssignmentAudience,
  AssignmentStatus,
  KnowledgeArea,
  MAX_PROGRAMME_YEARS,
  MAX_SEMESTERS_PER_YEAR,
} from '@/types';

// ---------------------------------------------------------------------------
// ProjectAssignment — a project a lecturer wrote, offered to their students.
//
// This is the first thing in the Hub that is a project *before* anybody is
// working on it. Until now a project came into existence only as one student's
// engagement, which is why a lecturer could not set work: there was nowhere to
// put a brief that did not already belong to somebody.
//
// The lecturer owns it; a student's engagement points at it. Keeping those
// apart is what will later let one project carry a team, and what lets a
// lecturer close an offer without touching the work already done under it.
//
// `knowledgeAreas` is declared by the lecturer and is how the offer finds the
// right students — the same taxonomy the generated briefs reason in, so a
// lecturer's project and a generated one are comparable work.
// ---------------------------------------------------------------------------

const projectAssignmentSchema = new Schema(
  {
    lecturerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Denormalised from the lecturer so the student-facing query does not have
    // to join through User to answer "is this offered at my university?".
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },

    title: { type: String, required: true, trim: true },
    problemStatement: { type: String, required: true, trim: true },
    coreRequirements: {
      type: [{ type: String, trim: true }],
      required: true,
      validate: {
        validator: (items: string[]) => items.length > 0,
        message: 'A project must say what has to be built.',
      },
    },
    deliverables: { type: [{ type: String, trim: true }], default: [] },
    technicalConstraints: { type: [{ type: String, trim: true }], default: [] },

    knowledgeAreas: {
      type: [{ type: String, enum: Object.values(KnowledgeArea) }],
      required: true,
      validate: {
        validator: (areas: string[]) => areas.length > 0,
        message: 'Say which subjects this project exercises.',
      },
    },
    // Where in the degree this is aimed. Used to offer it to the right cohort,
    // never to refuse a student the lecturer named explicitly.
    targetYear: { type: Number, required: true, min: 1, max: MAX_PROGRAMME_YEARS },
    targetSemester: { type: Number, required: true, min: 1, max: MAX_SEMESTERS_PER_YEAR },

    audience: {
      type: String,
      enum: Object.values(AssignmentAudience),
      required: true,
      default: AssignmentAudience.COHORT,
    },
    // Empty for a cohort offer. For a named assignment these are the only
    // students who can see it at all.
    assignedStudentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    /** How many students may take it up. Null means no limit. */
    capacity: { type: Number, min: 1 },

    status: {
      type: String,
      enum: Object.values(AssignmentStatus),
      required: true,
      default: AssignmentStatus.DRAFT,
    },
  },
  { timestamps: true }
);

projectAssignmentSchema.index({ lecturerId: 1, status: 1 });
projectAssignmentSchema.index({ institutionId: 1, status: 1, targetYear: 1, targetSemester: 1 });
projectAssignmentSchema.index({ assignedStudentIds: 1 });
projectAssignmentSchema.index({ knowledgeAreas: 1 });

projectAssignmentSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type ProjectAssignmentDoc = mongoose.InferSchemaType<typeof projectAssignmentSchema>;
const ProjectAssignment: mongoose.Model<ProjectAssignmentDoc> =
  (mongoose.models['ProjectAssignment'] as mongoose.Model<ProjectAssignmentDoc>) ??
  mongoose.model('ProjectAssignment', projectAssignmentSchema);

export default ProjectAssignment;
