import mongoose, { Schema } from 'mongoose';
import { AcademicDiscipline, MAX_PROGRAMME_YEARS, MAX_SEMESTERS_PER_YEAR } from '@/types';

// ---------------------------------------------------------------------------
// AcademicProgramme — one degree at one institution.
//
// Published by the institution once, and then every student on that programme
// stops typing unit names forever. Scope is CS and IT only; no other faculty is
// modelled, and `discipline` is a closed enum so none can be added by accident.
// ---------------------------------------------------------------------------

const academicProgrammeSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
    name: { type: String, required: true, trim: true },
    discipline: {
      type: String,
      enum: Object.values(AcademicDiscipline),
      required: true,
    },
    durationYears: { type: Number, required: true, min: 1, max: MAX_PROGRAMME_YEARS },
    semestersPerYear: { type: Number, required: true, min: 1, max: MAX_SEMESTERS_PER_YEAR },
  },
  { timestamps: true }
);

// One programme name per institution — two "BSc Computer Science" entries at
// the same university are a data error, not two degrees.
academicProgrammeSchema.index({ institutionId: 1, name: 1 }, { unique: true });
academicProgrammeSchema.index({ discipline: 1 });

academicProgrammeSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type AcademicProgrammeDoc = mongoose.InferSchemaType<typeof academicProgrammeSchema>;
const AcademicProgramme: mongoose.Model<AcademicProgrammeDoc> =
  (mongoose.models['AcademicProgramme'] as mongoose.Model<AcademicProgrammeDoc>) ??
  mongoose.model('AcademicProgramme', academicProgrammeSchema);

export default AcademicProgramme;
