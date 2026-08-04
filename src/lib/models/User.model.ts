import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  Role,
  UserStatus,
  VerificationStatus,
  DocumentType,
  StudentTier,
  OnboardingStage,
  OAuthProvider,
  InstitutionType,
  BuyerType,
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
    // Cooperative membership (V3 role setup). Self-declared at onboarding: a
    // farmer usually knows their cooperative by name long before the platform
    // has a FarmerGroup record for it, so this is free text rather than a
    // reference. When a matching group exists, `cooperativeGroupId` links it.
    cooperativeName: { type: String, trim: true },
    cooperativeGroupId: { type: Schema.Types.ObjectId, ref: 'FarmerGroup' },
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
    // Optional link to a first-class Institution (complements the free-text
    // universityAffiliation above).
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    completedProjectCount: { type: Number, default: 0 },
    // Institutional-email verification (AUTH-05): a university-domain address,
    // confirmed via a 6-digit pin, plus the academic registration number. The
    // pin is stored bcrypt-hashed and excluded from queries by default.
    institutionalEmail: { type: String, lowercase: true, trim: true },
    institutionalEmailVerified: { type: Boolean, default: false },
    institutionalEmailPin: { type: String, select: false },
    institutionalEmailPinExpiry: { type: Date },
    academicRegistrationNumber: { type: String, trim: true },
    // Course of study and expected completion (V3 role setup). The year is a
    // plain number rather than a date — students know the year, not the day,
    // and employers filter on it.
    programme: { type: String, trim: true },
    graduationYear: { type: Number },
  },
  { _id: false }
);

const lecturerDataSchema = new Schema(
  {
    universityAffiliation: { type: String },
    // Optional link to a first-class Institution (complements universityAffiliation).
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    isVerified: { type: Boolean, default: false },
    // Onboarding identity (AUTH-05) — department, staff ID, and the Cloudinary
    // URL of a faculty credential letter for the verification queue.
    departmentAssignment: { type: String, trim: true },
    academicStaffId: { type: String, trim: true },
    facultyCredentialLetterUrl: { type: String },
    // Academic position (V3 role setup) — 'Lecturer', 'Senior Lecturer',
    // 'Professor' and so on. Free text: title ladders differ between Kenyan
    // institutions, and an enum would reject valid ones.
    position: { type: String, trim: true },
  },
  { _id: false }
);

// NGO role-data (additive). An NGO links to its NgoOrganization profile and the
// farmer cooperatives it sponsors are modelled via FarmerGroup.sponsoredByNgoId.
const ngoDataSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'NgoOrganization' },
    organizationName: { type: String, trim: true },
    focusAreas: [{ type: String }],
    countiesServed: [{ type: String }],
  },
  { _id: false }
);

// Employer role-data (additive). Employers discover verified student portfolios.
const employerDataSchema = new Schema(
  {
    companyName: { type: String, trim: true },
    industry: { type: String, trim: true },
    website: { type: String, trim: true },
    hiringInterests: [{ type: String }],
  },
  { _id: false }
);

// Institution role-data (additive). An institution account administers an
// Institution organisation that hosts students and lecturers.
const institutionDataSchema = new Schema(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
    institutionName: { type: String, trim: true },
    institutionType: { type: String, enum: Object.values(InstitutionType) },
    contactRole: { type: String, trim: true },
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
    // Which kind of buyer this is. Everything below branches on it: a BUSINESS
    // has an organisation and a KRA certificate, an INDIVIDUAL has an identity
    // document and neither. Optional because records predating the branch have
    // no value for it — those are migrated, never guessed at read time.
    buyerType: { type: String, enum: Object.values(BuyerType) },
    // BUSINESS verification artefact.
    taxComplianceCertificate: { type: String },
    // INDIVIDUAL verification artefact — same shape the farmer side uses, so the
    // admin review surface reads one document schema for both.
    documentType: { type: String, enum: Object.values(DocumentType) },
    documentImageUrl: { type: String },
    documentNumber: { type: String },
    // Onboarding identity (AUTH-05) — organisation profile + corporate M-Pesa
    // paybill and self-declared procurement scale. BUSINESS buyers only.
    organizationName: { type: String, trim: true },
    businessRegistrationNumber: { type: String, trim: true },
    corporatePaybill: { type: String, trim: true },
    procurementScale: { type: String, trim: true },
    // Sourcing preferences (V3 role setup). These shape what the marketplace
    // surfaces first; they are preferences, never filters — a buyer can always
    // order outside them.
    preferredCounties: [{ type: String }],
    purchaseInterests: [{ type: String }],
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // V2 dual-auth (AUTH_ONBOARDING_FLOW_V2): a unique login handle chosen at
    // onboarding, and the bcrypt password hash for the credentials login path.
    // sparse — legacy/seed users may predate it; hashedPassword is select:false
    // so it never leaves the DB unless explicitly requested.
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    hashedPassword: { type: String, select: false },
    // Credentials-login brute-force lockout (AUTH_ONBOARDING_FLOW_V2 §10).
    // Consecutive failures increment failedLoginAttempts; at the threshold the
    // account is locked until lockedUntil. Both select:false so they never leave
    // the DB unless explicitly requested by the authorize path.
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },
    firstName: { type: String, required: true, trim: true },
    // Optional until onboarding Stage 2 (IDENTITY_INPUT, AUTH-05): a fresh OAuth
    // user has only an email + first name until they complete the funnel.
    lastName: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    // Nullable during onboarding (Decision 02-A): an OAuth user has no role
    // until they pick one at ROLE_SELECTION. null is an explicit enum member.
    role: { type: String, enum: [...Object.values(Role), null], default: null },
    county: { type: String },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    // Defaults to COMPLETED so seed paths are onboarded; the OAuth flow
    // (AUTH-02/AUTH-05) explicitly writes the earlier stages on account creation.
    onboardingStage: {
      type: String,
      enum: Object.values(OnboardingStage),
      default: OnboardingStage.COMPLETED,
    },
    oauthProvider: { type: String, enum: Object.values(OAuthProvider), default: undefined },
    // Provider-asserted at OAuth sign-in (no self-managed verification exists
    // post-AUTH-07).
    isEmailVerified: { type: Boolean, default: false },
    // Optional presentation fields (additive) — a profile photo URL and a short
    // self-description, shown on profile surfaces across roles.
    profilePhotoUrl: { type: String, trim: true },
    bio: { type: String, trim: true },
    farmerData: { type: farmerDataSchema, default: undefined },
    studentData: { type: studentDataSchema, default: undefined },
    lecturerData: { type: lecturerDataSchema, default: undefined },
    buyerData: { type: buyerDataSchema, default: undefined },
    ngoData: { type: ngoDataSchema, default: undefined },
    employerData: { type: employerDataSchema, default: undefined },
    institutionData: { type: institutionDataSchema, default: undefined },
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
    return ret;
  },
});

// Mongoose document interface — used to properly type the model for queries.
// The full API-facing interface lives in src/types/foodhub.ts.
export interface IUserDocument extends Document {
  email: string;
  username?: string;
  hashedPassword?: string;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string | null;
  county: string;
  status: string;
  onboardingStage: string;
  oauthProvider?: string;
  isEmailVerified: boolean;
  profilePhotoUrl?: string;
  bio?: string;
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
    cooperativeName?: string;
    cooperativeGroupId?: mongoose.Types.ObjectId;
  };
  studentData?: {
    currentTier: string;
    githubUsername?: string;
    primaryInterest?: string;
    techStackPreferences: string[];
    universityAffiliation?: string;
    institutionId?: mongoose.Types.ObjectId;
    completedProjectCount: number;
    institutionalEmail?: string;
    institutionalEmailVerified: boolean;
    institutionalEmailPin?: string;
    institutionalEmailPinExpiry?: Date;
    academicRegistrationNumber?: string;
    programme?: string;
    graduationYear?: number;
  };
  lecturerData?: {
    universityAffiliation?: string;
    institutionId?: mongoose.Types.ObjectId;
    isVerified: boolean;
    departmentAssignment?: string;
    academicStaffId?: string;
    facultyCredentialLetterUrl?: string;
    position?: string;
  };
  buyerData?: {
    verificationStatus: string;
    isVerified: boolean;
    buyerType?: string;
    taxComplianceCertificate?: string;
    documentType?: string;
    documentImageUrl?: string;
    documentNumber?: string;
    organizationName?: string;
    businessRegistrationNumber?: string;
    corporatePaybill?: string;
    procurementScale?: string;
    preferredCounties?: string[];
    purchaseInterests?: string[];
  };
  ngoData?: {
    organizationId?: mongoose.Types.ObjectId;
    organizationName?: string;
    focusAreas: string[];
    countiesServed: string[];
  };
  employerData?: {
    companyName?: string;
    industry?: string;
    website?: string;
    hiringInterests: string[];
  };
  institutionData?: {
    institutionId?: mongoose.Types.ObjectId;
    institutionName?: string;
    institutionType?: string;
    contactRole?: string;
  };
}

const User: Model<IUserDocument> =
  (mongoose.models['User'] as Model<IUserDocument>) ??
  mongoose.model<IUserDocument>('User', userSchema);

export default User;
