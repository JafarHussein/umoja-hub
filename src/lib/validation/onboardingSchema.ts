import { z, type ZodType } from 'zod';
import { Role, KENYAN_COUNTIES, DocumentType, ListingCategory, BuyerType } from '@/types';

const kenyanPhoneRegex = /^(?:\+254|0)[17]\d{8}$/;
const cloudinaryUrlRegex = /^https:\/\/res\.cloudinary\.com\//;

// Answers people give a form that will not let them past and will not let them
// out. A live account reached COMPLETED carrying "NOT APPLICABLE" as both its
// organisation name and its business registration number, because at the time
// every buyer was required to be a business and no other answer existed.
//
// A length check cannot catch this — "NOT APPLICABLE" is fourteen characters of
// perfectly valid text. The fix is to stop asking the wrong people (see
// `buyerIdentitySchema`); this guard is the backstop, and its message points at
// the real remedy rather than just refusing.
const PLACEHOLDER_ANSWER =
  /^(?:n\.?\/?a\.?|not[\s-]*applicable|none|nil|null|unknown|test|asdf|x+|-+|\.+|0+)$/i;

/**
 * Required free text, with the same sentence for "you left this blank" and "the
 * field never arrived".
 *
 * Zod's default for a missing key is `Invalid input: expected string, received
 * undefined`. Those strings are not internal: the API returns them in
 * `fieldErrors` and the form renders them next to the input, so someone who
 * submitted an empty onboarding form was told, in as many words, what type
 * TypeScript was expecting. Every required field below carries a `message` for
 * exactly that reason.
 */
function requiredText(max: number, message: string) {
  return z.string({ message }).trim().min(1, message).max(max);
}

/**
 * Trimmed, length-bounded text that must actually say something. Use for
 * identity-bearing fields an administrator will later read as fact.
 */
function meaningfulText(min: number, max: number, requiredMessage: string) {
  return z
    .string({ message: requiredMessage })
    .trim()
    .min(min, requiredMessage)
    .max(max)
    .refine((v) => !PLACEHOLDER_ANSWER.test(v), {
      message: 'Enter the real value, or choose the option that fits you instead',
    });
}

// ---------------------------------------------------------------------------
// Stage 1 — role selection. ADMIN is never self-selectable (allowlist only,
// AUTH-03). Provider↔role enforcement happens in the route against the user's
// oauthProvider (GitHub → STUDENT only).
// ---------------------------------------------------------------------------
export const roleSelectionSchema = z.object({
  role: z.enum([Role.FARMER, Role.BUYER, Role.STUDENT, Role.LECTURER], {
    message: 'Choose how you will use UmojaHub',
  }),
});

// ---------------------------------------------------------------------------
// Credentials (AUTH_ONBOARDING_FLOW_V3): OAuth creates the account, then the
// user sets the username + password it can also sign in with. ADMIN is excluded
// from every role enum at the schema boundary — admins are provisioned, never
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
  // The message covers the field arriving absent as well as blank. Without it an
  // empty submit reported 'Invalid input: expected string, received undefined'
  // next to the field — a TypeScript expectation, shown to a person signing up.
  .string({ message: 'Enter a password' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters') // bcrypt input limit
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/\d/, 'Password must contain a number');

// Password setup (AUTH_ONBOARDING_FLOW_V3, stage PASSWORD_SETUP). The account
// already exists — OAuth created it — so this only sets the credentials the
// account will use when the provider is not reachable. The username is editable
// because it was auto-derived from the provider and may not be what the user
// wants to be known by; it is pre-filled, never blank.
export const passwordSetupSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Both passwords must match',
    path: ['confirmPassword'],
  });

// ---------------------------------------------------------------------------
// Registration (email + password). The second entry point into the same funnel
// OAuth uses — see context/REGISTRATION_ARCHITECTURE_ASSESSMENT.md.
//
// There is deliberately NO `role` field here. Role is chosen at the existing
// step 2 and validated against `roleSelectionSchema`, which has no ADMIN and no
// INSTITUTION member. A request body cannot influence privilege because there is
// no privilege-bearing field in it to tamper with (security invariant #1).
// ---------------------------------------------------------------------------

// One name field, split into firstName/lastName by the same helper the OAuth
// path uses, so both entry points store a name the same way. Asking for the
// parts separately would be more precise and less honest: a single line is how
// people write their own name, and the identity step confirms the family name
// later anyway — for a Google account exactly as for a registered one.
export const fullNameSchema = z
  .string({ message: 'Enter your full name' })
  .trim()
  .min(2, 'Enter your full name')
  .max(80, 'That name is too long')
  // Letters (any script), marks, spaces, apostrophes, hyphens and full stops —
  // enough for “Dr. Grace Ndung’u” and for names outside the Latin alphabet,
  // while still rejecting a pasted email address or markup.
  .regex(/^\p{L}[\p{L}\p{M}’'\-. ]*$/u, 'Use letters, spaces, hyphens and apostrophes only');

export const accountEmailSchema = z
  .string({ message: 'Enter your email address' })
  .trim()
  .toLowerCase()
  // Ordered deliberately: a blank field is told it is blank, and only a field
  // with something in it is told that something is not an email address.
  // Without this, submitting the empty form answered "Enter a valid email
  // address" — technically true, and unhelpful when nothing has been typed.
  .min(1, 'Enter your email address')
  .max(254, 'That email address is too long')
  .email('Enter a valid email address');

export const registrationSchema = z
  .object({
    fullName: fullNameSchema,
    email: accountEmailSchema,
    // The same rules the OAuth funnel sets a password under, and the same rules
    // the reset flow enforces. One definition, three entry points.
    password: passwordSchema,
    confirmPassword: z.string({ message: 'Confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Both passwords must match',
    path: ['confirmPassword'],
  });

// Login accepts either a username or an account email in the same field. The
// account is still resolved server-side (authorize), but we validate the shape
// here: a value is acceptable if it matches the username rule OR is an email.
export const loginIdentifierSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Enter your username or email')
  .max(254, 'That value is too long')
  .refine(
    (value) =>
      /^[a-z0-9_]{3,20}$/.test(value) || z.string().email().safeParse(value).success,
    'Enter a valid username or email'
  );

export const credentialsLoginSchema = z.object({
  username: loginIdentifierSchema,
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
  lastName: requiredText(50, 'Last name is required'),
  phoneNumber: z
    .string({ message: 'Phone number is required' })
    .trim()
    .regex(kenyanPhoneRegex, 'Enter a Kenyan number, like 0712 345 678'),
  // Without a message, a blank county was reported by listing all forty-seven
  // of them in a single error line under the field.
  county: z.enum(KENYAN_COUNTIES, { message: 'Select your county' }),
});

// Produce categories double as the farmer's "what do you grow" list and the
// buyer's "what do you source" list — deliberately the same vocabulary, so the
// two sides of the marketplace can be matched on it later.
const produceCategories = z.array(z.enum(ListingCategory)).max(10);

// A graduation year has to be plausible: a few years back for someone finishing
// late, a normal degree's length forward. Anything outside that is a typo.
const GRADUATION_YEAR_MIN = new Date().getFullYear() - 10;
const GRADUATION_YEAR_MAX = new Date().getFullYear() + 8;

export const farmerIdentitySchema = baseIdentitySchema.extend({
  primaryLanguage: z.string().trim().max(50).optional(),
  // Farm details. Optional at onboarding on purpose: a farmer who has not yet
  // planted this season should not be blocked from finishing setup, and both
  // are editable later from the profile.
  cropsGrown: produceCategories.optional(),
  farmSizeAcres: z
    .number({ message: 'Enter the farm size in acres' })
    .positive('Farm size must be greater than zero')
    .max(100000, 'That farm size looks too large')
    .optional(),
  // Cooperative membership. Free text and optional — plenty of farmers are
  // independent, and a name is known long before the platform has a
  // FarmerGroup record to point at.
  cooperativeName: z.string().trim().max(120).optional(),
});

// Sourcing preferences — they rank the marketplace, they never restrict it, so
// they are optional for every kind of buyer.
const buyerPreferences = {
  preferredCounties: z.array(z.enum(KENYAN_COUNTIES)).max(47).optional(),
  purchaseInterests: produceCategories.optional(),
};

// Buyer identity, branched on what kind of buyer this is.
//
// This was one shape requiring `organizationName` and
// `businessRegistrationNumber` of everyone. `min(2)` is satisfied by "NOT
// APPLICABLE" exactly as well as by a real company name, and that is what the
// funnel actually collected from an individual who had no company and no way to
// say so. A discriminated union makes the wrong question unaskable: an
// individual is never sent a field they cannot honestly fill.
export const buyerIdentitySchema = z.discriminatedUnion('buyerType', [
  baseIdentitySchema.extend({
    buyerType: z.literal(BuyerType.INDIVIDUAL),
    ...buyerPreferences,
  }),
  baseIdentitySchema.extend({
    buyerType: z.literal(BuyerType.BUSINESS),
    organizationName: meaningfulText(2, 120, 'Organisation name is required'),
    businessRegistrationNumber: meaningfulText(2, 60, 'Registration number is required'),
    corporatePaybill: z.string().trim().max(20).optional(),
    procurementScale: z.string().trim().max(60).optional(),
    ...buyerPreferences,
  }),
], { message: 'Tell us what kind of buyer you are' });

export const studentIdentitySchema = baseIdentitySchema.extend({
  academicRegistrationNumber: requiredText(60, 'Registration number is required'),
  universityAffiliation: requiredText(120, 'University is required'),
  primaryInterest: z.string().trim().max(120).optional(),
  programme: requiredText(120, 'Programme is required'),
  graduationYear: z
    .number({ message: 'Select your graduation year' })
    .int()
    .min(GRADUATION_YEAR_MIN, 'That year is too far in the past')
    .max(GRADUATION_YEAR_MAX, 'That year is too far in the future'),
});

export const lecturerIdentitySchema = baseIdentitySchema.extend({
  departmentAssignment: requiredText(120, 'Department is required'),
  academicStaffId: requiredText(60, 'Staff ID is required'),
  universityAffiliation: requiredText(120, 'University is required'),
  // Free text: academic title ladders differ between Kenyan institutions and an
  // enum would reject valid positions.
  position: requiredText(80, 'Position is required'),
});

/**
 * The identity schema for a role — the one map, used by the API route to
 * validate and by the identity form to guide. Sharing it is the point: the
 * contract was already written, it was simply not visible to the client, so
 * every mistake cost a round-trip and the user learned nothing while typing.
 * Returns undefined for roles that do not complete this step.
 */
export function identitySchemaForRole(role: Role | null | undefined): ZodType | undefined {
  switch (role) {
    case Role.FARMER:
      return farmerIdentitySchema;
    case Role.BUYER:
      return buyerIdentitySchema;
    case Role.STUDENT:
      return studentIdentitySchema;
    case Role.LECTURER:
      return lecturerIdentitySchema;
    default:
      return undefined;
  }
}

export const GRADUATION_YEARS: number[] = Array.from(
  { length: GRADUATION_YEAR_MAX - GRADUATION_YEAR_MIN + 1 },
  (_, i) => GRADUATION_YEAR_MAX - i
);

// ---------------------------------------------------------------------------
// Stage 3 — verification submissions (farmer/buyer/lecturer). Students verify
// via the institutional-email pin flow instead.
// ---------------------------------------------------------------------------
export const farmerOnboardingVerificationSchema = z.object({
  documentType: z.enum(
    [DocumentType.NATIONAL_ID, DocumentType.COOPERATIVE_CARD, DocumentType.PASSPORT],
    { message: 'Select the document you are uploading' }
  ),
  documentNumber: requiredText(60, 'Document number is required'),
  documentImageUrl: z
    .string({ message: 'Upload a photo of your document' })
    .regex(cloudinaryUrlRegex, 'Image must be uploaded to Cloudinary'),
  landOwnershipToken: z
    .string()
    .regex(cloudinaryUrlRegex, 'Land document must be uploaded to Cloudinary')
    .optional(),
});

// Buyer verification, branched the same way as buyer identity. Asking an
// individual for a KRA tax compliance certificate is what produced a PNG stored
// under `taxComplianceCertificate` on a live account — the field accepted any
// Cloudinary URL, so a photo of anything satisfied it, and the platform then
// emailed the user to say it had received their tax compliance certificate.
// An individual proves who they are with an identity document, as a farmer does.
export const buyerOnboardingVerificationSchema = z.discriminatedUnion('buyerType', [
  z.object({
    buyerType: z.literal(BuyerType.INDIVIDUAL),
    documentType: z.enum([DocumentType.NATIONAL_ID, DocumentType.PASSPORT], {
      message: 'Select the document you are uploading',
    }),
    documentNumber: requiredText(60, 'Document number is required'),
    documentImageUrl: z
      .string({ message: 'Upload a photo of your document' })
      .regex(cloudinaryUrlRegex, 'Image must be uploaded to Cloudinary'),
  }),
  z.object({
    buyerType: z.literal(BuyerType.BUSINESS),
    taxComplianceCertificate: z
      .string({ message: 'Upload your tax compliance certificate' })
      .regex(cloudinaryUrlRegex, 'Certificate must be uploaded to Cloudinary'),
  }),
], { message: 'Tell us what kind of buyer you are' });

export const lecturerOnboardingVerificationSchema = z.object({
  facultyCredentialLetterUrl: z
    .string({ message: 'Upload your faculty credential letter' })
    .regex(cloudinaryUrlRegex, 'Letter must be uploaded to Cloudinary'),
});

// ---------------------------------------------------------------------------
// Student institutional-email pin flow. The domain allowlist is enforced in the
// route (universityDomains), not here.
// ---------------------------------------------------------------------------
export const institutionalEmailSchema = z.object({
  institutionalEmail: z
    .string({ message: 'Enter your university email address' })
    .trim()
    .toLowerCase()
    .email('Enter a valid email address'),
});

export const institutionalEmailVerifySchema = z.object({
  pin: z
    .string({ message: 'Enter the 6-digit code' })
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export type RoleSelectionInput = z.infer<typeof roleSelectionSchema>;
export type PasswordSetupInput = z.infer<typeof passwordSetupSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
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
