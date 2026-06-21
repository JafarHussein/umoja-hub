import { z } from 'zod';
import { Role, KENYAN_COUNTIES, DocumentType } from '@/types';

const kenyanPhoneRegex = /^(?:\+254|0)[17]\d{8}$/;
const cloudinaryUrlRegex = /^https:\/\/res\.cloudinary\.com\//;

// ---------------------------------------------------------------------------
// Stage 1 — role selection. ADMIN is never self-selectable (allowlist only,
// AUTH-03). Provider↔role enforcement happens in the route against the user's
// oauthProvider (GitHub → STUDENT only).
// ---------------------------------------------------------------------------
export const roleSelectionSchema = z.object({
  role: z.enum([Role.FARMER, Role.BUYER, Role.STUDENT, Role.LECTURER]),
});

// ---------------------------------------------------------------------------
// V2 onboarding (AUTH_ONBOARDING_FLOW_V2): username + password are collected
// before the account exists and held in an OnboardingDraft. ADMIN is excluded
// from the role enum at the schema boundary — admins are provisioned, never
// self-registered (security invariant #1).
// ---------------------------------------------------------------------------
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-z0-9_]+$/, 'Use only lowercase letters, numbers, and underscores');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters') // bcrypt input limit
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/\d/, 'Password must contain a number');

export const onboardingDraftSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  role: z.enum([Role.FARMER, Role.BUYER, Role.STUDENT, Role.LECTURER]),
});

export const credentialsLoginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Password is required'),
});

// Password reset (AUTH_ONBOARDING_FLOW_V2 §10). The request is keyed by the
// account email (the reset link is delivered there); confirm carries the raw
// token from the link plus the new password (same rules as onboarding).
export const passwordResetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  password: passwordSchema,
});

// ---------------------------------------------------------------------------
// Stage 2 — role-conditional identity. Base fields fill the now-optional
// top-level identity columns; role extensions populate the role sub-document.
// githubUsername is OAuth-sourced and is never accepted from the client (UI-12).
// ---------------------------------------------------------------------------
const baseIdentitySchema = z.object({
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  phoneNumber: z.string().trim().regex(kenyanPhoneRegex, 'Invalid Kenyan phone number'),
  county: z.enum(KENYAN_COUNTIES),
});

export const farmerIdentitySchema = baseIdentitySchema.extend({
  primaryLanguage: z.string().trim().max(50).optional(),
});

export const buyerIdentitySchema = baseIdentitySchema.extend({
  organizationName: z.string().trim().min(2, 'Organisation name is required').max(120),
  businessRegistrationNumber: z.string().trim().min(2, 'Registration number is required').max(60),
  corporatePaybill: z.string().trim().max(20).optional(),
  procurementScale: z.string().trim().max(60).optional(),
});

export const studentIdentitySchema = baseIdentitySchema.extend({
  academicRegistrationNumber: z.string().trim().min(2, 'Registration number is required').max(60),
  universityAffiliation: z.string().trim().min(2, 'University is required').max(120),
  primaryInterest: z.string().trim().max(120).optional(),
});

export const lecturerIdentitySchema = baseIdentitySchema.extend({
  departmentAssignment: z.string().trim().min(2, 'Department is required').max(120),
  academicStaffId: z.string().trim().min(2, 'Staff ID is required').max(60),
  universityAffiliation: z.string().trim().min(2, 'University is required').max(120),
});

// ---------------------------------------------------------------------------
// Stage 3 — verification submissions (farmer/buyer/lecturer). Students verify
// via the institutional-email pin flow instead.
// ---------------------------------------------------------------------------
export const farmerOnboardingVerificationSchema = z.object({
  documentType: z.enum([
    DocumentType.NATIONAL_ID,
    DocumentType.COOPERATIVE_CARD,
    DocumentType.PASSPORT,
  ]),
  documentNumber: z.string().trim().min(1, 'Document number is required'),
  documentImageUrl: z.string().regex(cloudinaryUrlRegex, 'Image must be uploaded to Cloudinary'),
  landOwnershipToken: z
    .string()
    .regex(cloudinaryUrlRegex, 'Land document must be uploaded to Cloudinary')
    .optional(),
});

export const buyerOnboardingVerificationSchema = z.object({
  taxComplianceCertificate: z
    .string()
    .regex(cloudinaryUrlRegex, 'Certificate must be uploaded to Cloudinary'),
});

export const lecturerOnboardingVerificationSchema = z.object({
  facultyCredentialLetterUrl: z
    .string()
    .regex(cloudinaryUrlRegex, 'Letter must be uploaded to Cloudinary'),
});

// ---------------------------------------------------------------------------
// Student institutional-email pin flow. The domain allowlist is enforced in the
// route (universityDomains), not here.
// ---------------------------------------------------------------------------
export const institutionalEmailSchema = z.object({
  institutionalEmail: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const institutionalEmailVerifySchema = z.object({
  pin: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export type RoleSelectionInput = z.infer<typeof roleSelectionSchema>;
export type OnboardingDraftInput = z.infer<typeof onboardingDraftSchema>;
export type CredentialsLoginInput = z.infer<typeof credentialsLoginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type FarmerIdentityInput = z.infer<typeof farmerIdentitySchema>;
export type BuyerIdentityInput = z.infer<typeof buyerIdentitySchema>;
export type StudentIdentityInput = z.infer<typeof studentIdentitySchema>;
export type LecturerIdentityInput = z.infer<typeof lecturerIdentitySchema>;
export type FarmerOnboardingVerificationInput = z.infer<typeof farmerOnboardingVerificationSchema>;
export type BuyerOnboardingVerificationInput = z.infer<typeof buyerOnboardingVerificationSchema>;
export type LecturerOnboardingVerificationInput = z.infer<
  typeof lecturerOnboardingVerificationSchema
>;
export type InstitutionalEmailInput = z.infer<typeof institutionalEmailSchema>;
export type InstitutionalEmailVerifyInput = z.infer<typeof institutionalEmailVerifySchema>;
