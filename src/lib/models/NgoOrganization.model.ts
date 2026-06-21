import mongoose, { Schema } from 'mongoose';

// ---------------------------------------------------------------------------
// NgoOrganization — a development / agricultural NGO that sponsors farmer
// cooperatives. Linked to the cooperatives it supports via
// FarmerGroup.sponsoredByNgoId. Administered by an NGO-role account. This is a
// profile/relationship record, not a financial actor — escrow and payments
// remain strictly between buyers, farmers, and the platform.
// ---------------------------------------------------------------------------

const ngoOrganizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    focusAreas: [{ type: String }],
    countiesServed: [{ type: String }],
    description: { type: String, trim: true, maxlength: 1000 },
    website: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    // The NGO-role account that administers this organisation, if any.
    adminUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ngoOrganizationSchema.index({ name: 1 });
ngoOrganizationSchema.index({ countiesServed: 1 });

ngoOrganizationSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type NgoOrganizationDoc = mongoose.InferSchemaType<typeof ngoOrganizationSchema>;
const NgoOrganization: mongoose.Model<NgoOrganizationDoc> =
  (mongoose.models['NgoOrganization'] as mongoose.Model<NgoOrganizationDoc>) ??
  mongoose.model('NgoOrganization', ngoOrganizationSchema);

export default NgoOrganization;
