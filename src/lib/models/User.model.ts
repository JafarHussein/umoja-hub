import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  Role,
  UserStatus,
  VerificationStatus,
  DocumentType,
  StudentTier,
  OnboardingStage,
  OAuthProvider,
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
    // Onboarding Stage 3 (AUTH-05) — Cloudinary URL of a land ownership token.
    landOwnershipToken: { type: String },
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
    // Institutional-email verification (AUTH-05): a university-domain address,
    // confirmed via a 6-digit pin, plus the academic registration number.
    institutionalEmail: { type: String, lowercase: true, trim: true },
    institutionalEmailVerified: { type: Boolean, default: false },
    academicRegistrationNumber: { type: String, trim: true },
  },
  { _id: false }
);

const lecturerDataSchema = new Schema(
  {
    universityAffiliation: { type: String },
    isVerified: { type: Boolean, default: false },
    // Onboarding identity (AUTH-05) — department, staff ID, and the Cloudinary
    // URL of a faculty credential letter for the verification queue.
    departmentAssignment: { type: String, trim: true },
    academicStaffId: { type: String, trim: true },
    facultyCredentialLetterUrl: { type: String },
  },
  { _id: false }
);

// Buyer KYC (BE-09). The verification fields below back the buyer-verification
// admin queue; AUTH-01 extends this sub-document with the onboarding identity
// fields (organizationName, businessRegistrationNumber, corporatePaybill,
// procurementScale).
const buyerDataSchema = new Schema(
  {
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.UNSUBMITTED,
    },
    isVerified: { type: Boolean, default: false },
    taxComplianceCertificate: { type: String },
    // Onboarding identity (AUTH-05) — organisation profile + corporate M-Pesa
    // paybill and self-declared procurement scale.
    organizationName: { type: String, trim: true },
    businessRegistrationNumber: { type: String, trim: true },
    corporatePaybill: { type: String, trim: true },
    procurementScale: { type: String, trim: true },
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
    // Nullable during onboarding (Decision 02-A): an OAuth user has no role
    // until they pick one at ROLE_SELECTION. null is an explicit enum member.
    role: { type: String, enum: [...Object.values(Role), null], default: null },
    county: { type: String, required: true },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    // Defaults to COMPLETED so every pre-OAuth creation path (credentials
    // register, seeds) is correctly onboarded; the OAuth flow (AUTH-02/AUTH-05)
    // explicitly writes the earlier stages on account creation.
    onboardingStage: {
      type: String,
      enum: Object.values(OnboardingStage),
      default: OnboardingStage.COMPLETED,
    },
    oauthProvider: { type: String, enum: Object.values(OAuthProvider), default: undefined },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpiry: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
    farmerData: { type: farmerDataSchema, default: undefined },
    studentData: { type: studentDataSchema, default: undefined },
    lecturerData: { type: lecturerDataSchema, default: undefined },
    buyerData: { type: buyerDataSchema, default: undefined },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ county: 1 });
userSchema.index({ 'farmerData.isVerified': 1 });
userSchema.index({ 'buyerData.verificationStatus': 1 });

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
  role: string | null;
  county: string;
  status: string;
  onboardingStage: string;
  oauthProvider?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
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
    landOwnershipToken?: string;
  };
  studentData?: {
    currentTier: string;
    githubUsername?: string;
    primaryInterest?: string;
    techStackPreferences: string[];
    universityAffiliation?: string;
    completedProjectCount: number;
    institutionalEmail?: string;
    institutionalEmailVerified: boolean;
    academicRegistrationNumber?: string;
  };
  lecturerData?: {
    universityAffiliation?: string;
    isVerified: boolean;
    departmentAssignment?: string;
    academicStaffId?: string;
    facultyCredentialLetterUrl?: string;
  };
  buyerData?: {
    verificationStatus: string;
    isVerified: boolean;
    taxComplianceCertificate?: string;
    organizationName?: string;
    businessRegistrationNumber?: string;
    corporatePaybill?: string;
    procurementScale?: string;
  };
}

const User: Model<IUserDocument> =
  (mongoose.models['User'] as Model<IUserDocument>) ??
  mongoose.model<IUserDocument>('User', userSchema);

export default User;
