import mongoose, { Schema, Document, Model } from 'mongoose';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// OnboardingDraft (AUTH_ONBOARDING_FLOW_V2) — the pre-auth holding record.
//
// A first-time user completes onboarding (username + role + password) BEFORE an
// account exists. The choices are bcrypt-hashed and parked here, keyed by the
// document _id which travels in a signed httpOnly `onboarding_draft` cookie. The
// NextAuth signIn callback reconciles the draft into a real User once OAuth
// confirms a verified email, then deletes it. Abandoned drafts self-clean via a
// TTL index. ADMIN is never stored here (rejected at the schema + route layer).
// ---------------------------------------------------------------------------

const ONBOARDING_DRAFT_TTL_SECONDS = 30 * 60; // 30 minutes

const onboardingDraftSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: [Role.FARMER, Role.BUYER, Role.STUDENT, Role.LECTURER],
      required: true,
    },
    hashedPassword: { type: String, required: true },
  },
  { timestamps: true }
);

// Self-destruct abandoned drafts. Mongo purges documents this many seconds after
// `createdAt`, so a draft is only valid for the onboarding window.
onboardingDraftSchema.index({ createdAt: 1 }, { expireAfterSeconds: ONBOARDING_DRAFT_TTL_SECONDS });

export interface IOnboardingDraftDocument extends Document {
  username: string;
  role: string;
  hashedPassword: string;
  createdAt: Date;
  updatedAt: Date;
}

const OnboardingDraft: Model<IOnboardingDraftDocument> =
  (mongoose.models['OnboardingDraft'] as Model<IOnboardingDraftDocument>) ??
  mongoose.model<IOnboardingDraftDocument>('OnboardingDraft', onboardingDraftSchema);

export default OnboardingDraft;
