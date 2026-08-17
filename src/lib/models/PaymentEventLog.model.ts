import mongoose, { Schema } from 'mongoose';
import { PaymentEventActor, PaymentEventType } from '@/types';

// ---------------------------------------------------------------------------
// PaymentEventLog — append-only, provider-agnostic payment event trail.
//
// Written by the order route (INITIATED) and the shared callback processor
// (CALLBACK_RECEIVED / SUCCESS / FAILED / DUPLICATE / TIMEOUT / LOST /
// RECONCILED) regardless of provider, so real Daraja and the simulator produce
// identical audit records. This is the source for payment reporting/analytics.
//
// The row answers WHAT happened and WHEN. It could not answer who caused it,
// what the payment moved from and to, or why — so replaying the log told you a
// payment failed without telling you whether the buyer cancelled, the prompt
// expired, or we closed it out ourselves. `actor`, `previousStatus`,
// `newStatus`, `reason` and `correlationId` close that: every row now carries
// its own causation and its own transition, and no reader has to infer either
// from the event type.
//
// All five are optional at the schema level, deliberately. This is an
// append-only financial log: rows written before these fields existed are
// still true and must not be rewritten to look as though they carried them.
// Readers treat an absent value as "not recorded", never as a default.
// ---------------------------------------------------------------------------

const paymentEventLogSchema = new Schema(
  {
    provider: { type: String, required: true },
    eventType: { type: String, enum: Object.values(PaymentEventType), required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User' },
    farmerId: { type: Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number },
    paymentReference: { type: String }, // M-Pesa receipt or order reference
    checkoutRequestId: { type: String },
    resultCode: { type: Number },
    processingTimeMs: { type: Number },

    /** Who caused this event — the buyer, M-Pesa, us, or an administrator. */
    actor: { type: String, enum: Object.values(PaymentEventActor) },
    /** The order's paymentStatus immediately before this event. */
    previousStatus: { type: String },
    /** The order's paymentStatus immediately after. Equal to previousStatus
     *  when the event recorded something that moved nothing — a duplicate
     *  callback, or a status query that only confirmed what we already had. */
    newStatus: { type: String },
    /** Why, in a sentence a non-engineer reading an audit can follow. */
    reason: { type: String },
    /** Threads one payment session's events together, and ties them to the
     *  application log lines emitted at the same moment. */
    correlationId: { type: String },

    occurredAt: { type: Date, default: Date.now },
  },
  // Append-only: created once, never updated. `occurredAt` is the event time.
  { timestamps: false }
);

paymentEventLogSchema.index({ occurredAt: -1 });
paymentEventLogSchema.index({ orderId: 1 });
paymentEventLogSchema.index({ eventType: 1, occurredAt: -1 });
// Replaying one payment session end to end — the query an investigation starts
// with, and the reason correlationId is worth storing rather than only logging.
paymentEventLogSchema.index({ correlationId: 1, occurredAt: 1 }, { sparse: true });

type PaymentEventLogDoc = mongoose.InferSchemaType<typeof paymentEventLogSchema>;
const PaymentEventLog: mongoose.Model<PaymentEventLogDoc> =
  (mongoose.models['PaymentEventLog'] as mongoose.Model<PaymentEventLogDoc>) ??
  mongoose.model('PaymentEventLog', paymentEventLogSchema);

export default PaymentEventLog;
