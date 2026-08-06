import mongoose, { Schema, Document, Model } from 'mongoose';
import { WithdrawalRequestStatus } from '@/types';

// ---------------------------------------------------------------------------
// WithdrawalRequest — a farmer's request to be paid out funds the platform
// has received on their behalf via M-Pesa (paybill shortcode). There is no
// automated B2C disbursement; every payout is an explicit administrative
// decision. Lifecycle: REQUESTED → APPROVED → PAID, or REQUESTED → REJECTED.
// Requests are never deleted — REJECTED/PAID rows form the settlement trail.
// ---------------------------------------------------------------------------

export interface IWithdrawalRequestDocument extends Document {
  farmerId: mongoose.Types.ObjectId;
  amountKES: number;
  status: string;
  note?: string;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalRequestSchema = new Schema(
  {
    farmerId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    amountKES: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(WithdrawalRequestStatus),
      default: WithdrawalRequestStatus.REQUESTED,
    },
    // Admin-facing note: rejection reason or payment reference (e.g. the
    // M-Pesa B2C transaction code once paid manually).
    note: { type: String, trim: true, maxlength: 500 },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

withdrawalRequestSchema.index({ farmerId: 1, status: 1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });

// One open request per farmer, enforced by the database.
//
// The rule was previously held up by a findOne in the route followed by a
// create — a read and a write with a gap between them. Two requests arriving
// together both saw no open request, both passed the balance check against the
// same unspent balance, and both were created, so a farmer could have two open
// requests for the full amount and be paid twice over. Mirrors the
// belt-and-braces index MediationRequest uses for its one-open-per-order rule.
withdrawalRequestSchema.index(
  { farmerId: 1 },
  { unique: true, partialFilterExpression: { status: WithdrawalRequestStatus.REQUESTED } }
);

const WithdrawalRequest: Model<IWithdrawalRequestDocument> =
  (mongoose.models['WithdrawalRequest'] as Model<IWithdrawalRequestDocument>) ??
  mongoose.model<IWithdrawalRequestDocument>('WithdrawalRequest', withdrawalRequestSchema);

export default WithdrawalRequest;
