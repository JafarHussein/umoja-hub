import mongoose, { Schema } from 'mongoose';
import { EscrowEventType } from '@/types';

// ---------------------------------------------------------------------------
// EscrowEventLog — append-only escrow milestone trail for an order's held funds.
//
// Written when funds enter custody at payment (HELD), become the farmer's on
// confirmed receipt or admin release (RELEASED), or are returned to the buyer by
// an admin dispute resolution (REFUND_ISSUED). Mirrors PaymentEventLog: created
// once, never updated. This is the source for the admin escrow ledger and the
// per-order escrow history surfaced to both parties. Decoupled from money
// movement itself (which lives in the order/payment state) — this is the audit
// of *when value changed hands and who moved it*.
// ---------------------------------------------------------------------------

const escrowEventLogSchema = new Schema(
  {
    eventType: { type: String, enum: Object.values(EscrowEventType), required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User' },
    farmerId: { type: Schema.Types.ObjectId, ref: 'User' },
    amountKES: { type: Number, required: true },
    // Who moved the funds: the order parties act via 'SYSTEM'/'BUYER'; an admin
    // release or refund records the admin's id.
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorRole: { type: String },
    // Free-text context: resolution note on a refund, etc.
    note: { type: String, trim: true, maxlength: 500 },
    occurredAt: { type: Date, default: Date.now },
  },
  // Append-only: created once, never updated. `occurredAt` is the event time.
  { timestamps: false }
);

escrowEventLogSchema.index({ occurredAt: -1 });
escrowEventLogSchema.index({ orderId: 1 });
escrowEventLogSchema.index({ eventType: 1, occurredAt: -1 });
escrowEventLogSchema.index({ farmerId: 1, occurredAt: -1 });

type EscrowEventLogDoc = mongoose.InferSchemaType<typeof escrowEventLogSchema>;
const EscrowEventLog: mongoose.Model<EscrowEventLogDoc> =
  (mongoose.models['EscrowEventLog'] as mongoose.Model<EscrowEventLogDoc>) ??
  mongoose.model('EscrowEventLog', escrowEventLogSchema);

export default EscrowEventLog;
