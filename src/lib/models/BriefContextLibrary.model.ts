import mongoose, { Schema } from 'mongoose';
import { StudentTier } from '@/types';

const clientPersonaTemplateSchema = new Schema(
  {
    businessTypes: [{ type: String }],
    counties: [{ type: String }],
    contexts: [{ type: String }],
  },
  { _id: false }
);

const briefContextItemSchema = new Schema(
  {
    id: { type: String, required: true },
    industryName: { type: String, required: true },
    description: { type: String, required: true },
    clientPersonaTemplate: { type: clientPersonaTemplateSchema },
    problemDomains: [{ type: String }],
    kenyanConstraints: [{ type: String }],
    exampleProjects: [{ type: String }],
    targetTiers: [{ type: String, enum: Object.values(StudentTier) }],
  },
  { _id: false }
);

const briefContextLibrarySchema = new Schema(
  {
    version: { type: Number, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contexts: [briefContextItemSchema],
  },
  { timestamps: true }
);

briefContextLibrarySchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

const BriefContextLibrary =
  mongoose.models.BriefContextLibrary ??
  mongoose.model('BriefContextLibrary', briefContextLibrarySchema);

export default BriefContextLibrary;
