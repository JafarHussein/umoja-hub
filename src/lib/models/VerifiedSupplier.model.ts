import mongoose, { Schema } from 'mongoose';
import { SupplierInputCategory, SupplierVerificationStatus } from '@/types';

const verifiedSupplierSchema = new Schema(
  {
    businessName: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true },
    contactEmail: { type: String },
    county: { type: String, required: true },
    physicalAddress: { type: String },
    inputCategories: [{ type: String, enum: Object.values(SupplierInputCategory) }],
    registrations: {
      kebsNumber: { type: String },
      pcpbNumber: { type: String },
      kephisNumber: { type: String },
    },
    verificationStatus: {
      type: String,
      enum: Object.values(SupplierVerificationStatus),
      default: SupplierVerificationStatus.PENDING,
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

verifiedSupplierSchema.index({ county: 1, verificationStatus: 1 });
verifiedSupplierSchema.index({ inputCategories: 1, verificationStatus: 1 });

verifiedSupplierSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type VerifiedSupplierDoc = mongoose.InferSchemaType<typeof verifiedSupplierSchema>;
const VerifiedSupplier: mongoose.Model<VerifiedSupplierDoc> =
  (mongoose.models['VerifiedSupplier'] as mongoose.Model<VerifiedSupplierDoc>) ??
  mongoose.model('VerifiedSupplier', verifiedSupplierSchema);

export default VerifiedSupplier;
