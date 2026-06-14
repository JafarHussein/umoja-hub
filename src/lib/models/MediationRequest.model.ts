import mongoose, { Schema, Document, Model } from 'mongoose';
import { MediationRequestStatus, MediationCategory } from '@/types';

// ---------------------------------------------------------------------------
// MediationRequest — a buyer's structured escalation on an order, routed to
// administrative review. Deliberately decoupled from the Order state machine:
// filing one never mutates the order's fulfillment status, and resolutions do
// not feed the trust score's dispute penalties (recorded decision, Q7).
// Lifecycle: OPEN → IN_REVIEW → RESOLVED. One OPEN request per order,
// enforced both in the route and by a partial unique index.
// ---------------------------------------------------------------------------

export interface IMediationRequestDocument extends Document {
  orderId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  farmerId: mongoose.Types.ObjectId;
  category: string;
  description: string;
  status: string;
  resolutionNote?: string;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mediationRequestSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, required: true, ref: 'Order' },
    buyerId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    farmerId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    category: {
      type: String,
      enum: Object.values(MediationCategory),
      required: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: Object.values(MediationRequestStatus),
      default: MediationRequestStatus.OPEN,
    },
    resolutionNote: { type: String, trim: true, maxlength: 500 },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

// Belt-and-braces for the one-open-escalation-per-order rule.
mediationRequestSchema.index(
  { orderId: 1 },
  { unique: true, partialFilterExpression: { status: MediationRequestStatus.OPEN } }
);
mediationRequestSchema.index({ status: 1, createdAt: -1 });
mediationRequestSchema.index({ buyerId: 1, createdAt: -1 });
mediationRequestSchema.index({ farmerId: 1 });

const MediationRequest: Model<IMediationRequestDocument> =
  (mongoose.models['MediationRequest'] as Model<IMediationRequestDocument>) ??
  mongoose.model<IMediationRequestDocument>('MediationRequest', mediationRequestSchema);

export default MediationRequest;
