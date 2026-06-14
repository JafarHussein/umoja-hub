import mongoose, { Schema } from 'mongoose';
import { PaymentEventType } from '@/types';

// ---------------------------------------------------------------------------
// PaymentEventLog — append-only, provider-agnostic payment event trail.
//
// Written by the order route (INITIATED) and the shared callback processor
// (CALLBACK_RECEIVED / SUCCESS / FAILED / DUPLICATE / TIMEOUT / LOST /
// RECONCILED) regardless of provider, so real Daraja and the simulator produce
// identical audit records. This is the source for payment reporting/analytics.
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
    occurredAt: { type: Date, default: Date.now },
  },
  // Append-only: created once, never updated. `occurredAt` is the event time.
  { timestamps: false }
);

paymentEventLogSchema.index({ occurredAt: -1 });
paymentEventLogSchema.index({ orderId: 1 });
paymentEventLogSchema.index({ eventType: 1, occurredAt: -1 });

type PaymentEventLogDoc = mongoose.InferSchemaType<typeof paymentEventLogSchema>;
const PaymentEventLog: mongoose.Model<PaymentEventLogDoc> =
  (mongoose.models['PaymentEventLog'] as mongoose.Model<PaymentEventLogDoc>) ??
  mongoose.model('PaymentEventLog', paymentEventLogSchema);

export default PaymentEventLog;
