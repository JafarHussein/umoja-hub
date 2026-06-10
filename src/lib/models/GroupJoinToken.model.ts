import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// GroupJoinToken — out-of-band cooperative joining (Decision Record 03/08-C).
// An administrator mints a single-use alphanumeric code bound to one
// FarmerGroup and distributes it externally (SMS via Africa's Talking). A
// verified farmer redeems it from their settings pane; redemption is the only
// self-service path into a group roster.
//
// Single-use is enforced at redemption with an atomic guard on
// redeemedBy: null. Expired or redeemed tokens are never deleted — the rows
// are the join audit trail (who minted, for which group, who redeemed, when).
// ---------------------------------------------------------------------------

export interface IGroupJoinTokenDocument extends Document {
  token: string;
  groupId: mongoose.Types.ObjectId;
  mintedBy: mongoose.Types.ObjectId;
  expiresAt: Date;
  redeemedBy?: mongoose.Types.ObjectId;
  redeemedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const groupJoinTokenSchema = new Schema(
  {
    // Uppercase alphanumeric, generated server-side at mint time. Stored
    // verbatim; lookups normalise user input to uppercase before matching.
    token: { type: String, required: true, unique: true, trim: true, uppercase: true },
    groupId: { type: Schema.Types.ObjectId, required: true, ref: 'FarmerGroup' },
    mintedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    expiresAt: { type: Date, required: true },
    redeemedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    redeemedAt: { type: Date },
  },
  { timestamps: true }
);

groupJoinTokenSchema.index({ token: 1 }, { unique: true });
groupJoinTokenSchema.index({ groupId: 1, createdAt: -1 });
groupJoinTokenSchema.index({ expiresAt: 1 });

const GroupJoinToken: Model<IGroupJoinTokenDocument> =
  (mongoose.models['GroupJoinToken'] as Model<IGroupJoinTokenDocument>) ??
  mongoose.model<IGroupJoinTokenDocument>('GroupJoinToken', groupJoinTokenSchema);

export default GroupJoinToken;
