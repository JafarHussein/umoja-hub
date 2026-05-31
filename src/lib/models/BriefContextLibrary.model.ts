import mongoose, { Schema } from 'mongoose';
import { StudentTier } from '@/types';

export interface BriefContextLibraryDoc {
  version: number;
  updatedBy: mongoose.Types.ObjectId;
  contexts: Array<{
    id: string;
    industryName: string;
    description: string;
    clientPersonaTemplate: {
      businessTypes: string[];
      counties: string[];
      contexts: string[];
    };
    problemDomains: string[];
    kenyanConstraints: string[];
    exampleProjects: string[];
    targetTiers: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

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
  (mongoose.models['BriefContextLibrary'] as mongoose.Model<BriefContextLibraryDoc>) ??
  mongoose.model<BriefContextLibraryDoc>('BriefContextLibrary', briefContextLibrarySchema);

export default BriefContextLibrary;
