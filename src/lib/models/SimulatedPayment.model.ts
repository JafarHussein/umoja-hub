import mongoose, { Schema } from 'mongoose';
import { SimulatedOutcome, SimulatedPaymentStatus } from '@/types';

// ---------------------------------------------------------------------------
// SimulatedPayment — a scheduled simulated STK-push outcome.
//
// Created by the SimulationProvider at initiation time with a chosen outcome and
// a `deliverAt` instant. A dispatcher (poll-lazy, cron sweep, or Payment Lab)
// later builds the Daraja-shaped callback and feeds it through the SAME webhook
// processor the real provider uses. Rows are retained as the simulation audit
// trail. Only relevant when PAYMENT_PROVIDER=simulation.
// ---------------------------------------------------------------------------

const simulatedPaymentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    checkoutRequestId: { type: String, required: true, unique: true },
    merchantRequestId: { type: String, required: true },
    outcome: { type: String, enum: Object.values(SimulatedOutcome), required: true },
    resultCode: { type: Number }, // null/undefined for LOST (never delivered)
    mpesaReceiptNumber: { type: String }, // populated for SUCCESS
    amount: { type: Number, required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deliverAt: { type: Date, required: true },
    deliveredAt: { type: Date },
    status: {
      type: String,
      enum: Object.values(SimulatedPaymentStatus),
      default: SimulatedPaymentStatus.SCHEDULED,
    },
    // When true the dispatcher delivers the callback twice to exercise the
    // webhook's idempotency guard.
    duplicate: { type: Boolean, default: false },
    deliveryAttempts: { type: Number, default: 0 },
    processingTimeMs: { type: Number },
  },
  { timestamps: true }
);

simulatedPaymentSchema.index({ status: 1, deliverAt: 1 });
simulatedPaymentSchema.index({ orderId: 1 });

export type SimulatedPaymentDoc = mongoose.InferSchemaType<typeof simulatedPaymentSchema>;
const SimulatedPayment: mongoose.Model<SimulatedPaymentDoc> =
  (mongoose.models['SimulatedPayment'] as mongoose.Model<SimulatedPaymentDoc>) ??
  mongoose.model('SimulatedPayment', simulatedPaymentSchema);

export default SimulatedPayment;
