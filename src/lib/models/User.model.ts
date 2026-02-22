import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  Role,
  UserStatus,
  VerificationStatus,
  DocumentType,
  StudentTier,
} from '@/types';

const farmerDataSchema = new Schema(
  {
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.UNSUBMITTED,
    },
    isVerified: { type: Boolean, default: false },
    documentType: { type: String, enum: Object.values(DocumentType) },
    documentImageUrl: { type: String },
    documentNumber: { type: String },
    cropsGrown: [{ type: String }],
    livestockKept: [{ type: String }],
    farmSizeAcres: { type: Number },
    primaryLanguage: { type: String },
  },
  { _id: false }
);

const studentDataSchema = new Schema(
  {
    currentTier: {
      type: String,
      enum: Object.values(StudentTier),
      default: StudentTier.BEGINNER,
    },
    githubUsername: { type: String },
    primaryInterest: { type: String },
    techStackPreferences: [{ type: String }],
    universityAffiliation: { type: String },
    completedProjectCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const lecturerDataSchema = new Schema(
  {
    universityAffiliation: { type: String },
    isVerified: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    hashedPassword: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(Role), required: true },
    county: { type: String, required: true },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    farmerData: { type: farmerDataSchema, default: undefined },
    studentData: { type: studentDataSchema, default: undefined },
    lecturerData: { type: lecturerDataSchema, default: undefined },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ county: 1 });
userSchema.index({ 'farmerData.isVerified': 1 });

userSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    delete ret.hashedPassword;
    return ret;
  },
});

// Mongoose document interface — used to properly type the model for queries.
// The full API-facing interface lives in src/types/foodhub.ts.
export interface IUserDocument extends Document {
  email: string;
  hashedPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  county: string;
  status: string;
  farmerData?: {
    verificationStatus: string;
    isVerified: boolean;
    documentType?: string;
    documentImageUrl?: string;
    documentNumber?: string;
    cropsGrown: string[];
    livestockKept: string[];
    farmSizeAcres?: number;
    primaryLanguage?: string;
  };
  studentData?: {
    currentTier: string;
    githubUsername?: string;
    primaryInterest?: string;
    techStackPreferences: string[];
    universityAffiliation?: string;
    completedProjectCount: number;
  };
  lecturerData?: {
    universityAffiliation?: string;
    isVerified: boolean;
  };
}

const User: Model<IUserDocument> =
  (mongoose.models['User'] as Model<IUserDocument>) ??
  mongoose.model<IUserDocument>('User', userSchema);

export default User;
