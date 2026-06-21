import mongoose, { Schema } from 'mongoose';
import { InstitutionType } from '@/types';

// ---------------------------------------------------------------------------
// Institution — a first-class university / college / TVET that hosts students
// and lecturers. Complements the free-text `universityAffiliation` already on
// student/lecturer role-data with a real organisation a lecturer or employer
// can attribute verified work to. Administered by an INSTITUTION-role account.
// ---------------------------------------------------------------------------

const institutionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(InstitutionType), default: InstitutionType.UNIVERSITY },
    county: { type: String, required: true },
    // Email domains used by this institution's students (matches the onboarding
    // institutional-email allowlist convention).
    emailDomains: [{ type: String, lowercase: true, trim: true }],
    accreditationBody: { type: String, trim: true },
    website: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    // The INSTITUTION-role account that administers this organisation, if any.
    adminUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

institutionSchema.index({ name: 1 });
institutionSchema.index({ county: 1 });
institutionSchema.index({ type: 1 });

institutionSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type InstitutionDoc = mongoose.InferSchemaType<typeof institutionSchema>;
const Institution: mongoose.Model<InstitutionDoc> =
  (mongoose.models['Institution'] as mongoose.Model<InstitutionDoc>) ??
  mongoose.model('Institution', institutionSchema);

export default Institution;
