import mongoose, { Schema } from 'mongoose';
import {
  AcademicDiscipline,
  AcademicProvenance,
  KnowledgeArea,
  MAX_CURRENT_UNITS,
  MAX_PROGRAMME_YEARS,
  MAX_SEMESTERS_PER_YEAR,
} from '@/types';

// ---------------------------------------------------------------------------
// StudentEnrolment — where one student stands right now.
//
// One document per student, replaced as they move through the degree. The units
// are stored as *snapshots* rather than references: a curriculum can be revised
// or a programme retired, and neither may rewrite what a student was studying
// when their project was set.
//
// `provenance` is load-bearing and is shown in the interface. "You told us
// this" reads differently from "your institution published this", and a student
// must always know which one is on screen. A system that cannot tell a claim
// from a fact will eventually report the claim as a fact — the same defect as
// the verification funnel that had buyers inventing registration numbers.
//
// There is deliberately no grade or performance field. The directive permits
// performance data where available, but no workflow may depend on it, and a
// field nothing consumes is an invitation to collect the most sensitive data an
// institution holds for no reason.
// ---------------------------------------------------------------------------

const enrolledUnitSchema = new Schema(
  {
    // Present when the unit came from a published curriculum; absent when the
    // student typed it themselves.
    unitId: { type: Schema.Types.ObjectId, ref: 'CurriculumUnit' },
    code: { type: String, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    knowledgeAreas: {
      type: [{ type: String, enum: Object.values(KnowledgeArea) }],
      required: true,
      validate: {
        validator: (areas: string[]) => areas.length > 0,
        message: 'Every unit must map onto at least one knowledge area.',
      },
    },
  },
  { _id: false }
);

const studentEnrolmentSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    programmeId: { type: Schema.Types.ObjectId, ref: 'AcademicProgramme' },
    programmeName: { type: String, required: true, trim: true },
    discipline: { type: String, enum: Object.values(AcademicDiscipline), required: true },
    currentYear: { type: Number, required: true, min: 1, max: MAX_PROGRAMME_YEARS },
    currentSemester: { type: Number, required: true, min: 1, max: MAX_SEMESTERS_PER_YEAR },
    currentUnits: {
      type: [enrolledUnitSchema],
      required: true,
      validate: {
        validator: (units: unknown[]) => units.length > 0 && units.length <= MAX_CURRENT_UNITS,
        message: `Record between 1 and ${MAX_CURRENT_UNITS} current units.`,
      },
    },
    completedUnits: { type: [enrolledUnitSchema], default: [] },
    provenance: {
      type: String,
      enum: Object.values(AcademicProvenance),
      required: true,
      default: AcademicProvenance.SELF_DECLARED,
    },
    provenanceRecordedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

studentEnrolmentSchema.index({ institutionId: 1 });
studentEnrolmentSchema.index({ programmeId: 1 });
studentEnrolmentSchema.index({ 'currentUnits.knowledgeAreas': 1 });

studentEnrolmentSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type StudentEnrolmentDoc = mongoose.InferSchemaType<typeof studentEnrolmentSchema>;
const StudentEnrolment: mongoose.Model<StudentEnrolmentDoc> =
  (mongoose.models['StudentEnrolment'] as mongoose.Model<StudentEnrolmentDoc>) ??
  mongoose.model('StudentEnrolment', studentEnrolmentSchema);

export default StudentEnrolment;
