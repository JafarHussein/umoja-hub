import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// PasswordResetToken (AUTH_ONBOARDING_FLOW_V2 §10) — single-use credential
// reset.
//
// The raw token travels only in the emailed link; the DB stores its SHA-256
// digest (tokenHash), so a database leak never yields a usable token. The hash
// is deterministic and therefore indexable for O(1) lookup (the token is
// high-entropy, so a digest is sufficient — no bcrypt needed). Single-use is
// enforced at confirm time with an atomic guard on usedAt: null. A TTL index
// purges rows shortly after expiry so the collection self-cleans.
// ---------------------------------------------------------------------------

const RESET_TOKEN_TTL_SECONDS = 30 * 60; // 30 minutes

export interface IPasswordResetTokenDocument extends Document {
  tokenHash: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

passwordResetTokenSchema.index({ tokenHash: 1 }, { unique: true });
// Self-clean spent/abandoned tokens shortly after they expire.
passwordResetTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: RESET_TOKEN_TTL_SECONDS }
);

const PasswordResetToken: Model<IPasswordResetTokenDocument> =
  (mongoose.models['PasswordResetToken'] as Model<IPasswordResetTokenDocument>) ??
  mongoose.model<IPasswordResetTokenDocument>('PasswordResetToken', passwordResetTokenSchema);

export default PasswordResetToken;
