import mongoose, { Schema } from 'mongoose';
import { KnowledgeArea, MAX_PROGRAMME_YEARS, MAX_SEMESTERS_PER_YEAR } from '@/types';

// ---------------------------------------------------------------------------
// CurriculumUnit — one unit within one programme.
//
// `code` and `title` are the institution's own words and are never reasoned
// about; `knowledgeAreas` is the mapping onto the platform taxonomy and is the
// only field anything downstream reads. That split is what makes onboarding a
// new university a mapping exercise instead of an integration.
//
// At least one knowledge area is required: an unmapped unit is invisible to
// everything the Hub does with academic context, and a silently invisible
// record is worse than a rejected one.
// ---------------------------------------------------------------------------

const curriculumUnitSchema = new Schema(
  {
    programmeId: { type: Schema.Types.ObjectId, ref: 'AcademicProgramme', required: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1, max: MAX_PROGRAMME_YEARS },
    semester: { type: Number, required: true, min: 1, max: MAX_SEMESTERS_PER_YEAR },
    knowledgeAreas: {
      type: [{ type: String, enum: Object.values(KnowledgeArea) }],
      required: true,
      validate: {
        validator: (areas: string[]) => areas.length > 0,
        message: 'A curriculum unit must map onto at least one knowledge area.',
      },
    },
  },
  { timestamps: true }
);

curriculumUnitSchema.index({ programmeId: 1, code: 1 }, { unique: true });
curriculumUnitSchema.index({ programmeId: 1, year: 1, semester: 1 });
curriculumUnitSchema.index({ knowledgeAreas: 1 });

curriculumUnitSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type CurriculumUnitDoc = mongoose.InferSchemaType<typeof curriculumUnitSchema>;
const CurriculumUnit: mongoose.Model<CurriculumUnitDoc> =
  (mongoose.models['CurriculumUnit'] as mongoose.Model<CurriculumUnitDoc>) ??
  mongoose.model('CurriculumUnit', curriculumUnitSchema);

export default CurriculumUnit;
