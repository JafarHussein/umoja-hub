import mongoose, { Schema } from 'mongoose';
import {
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  FulfillmentType,
  FulfillmentStage,
} from '@/types';

const orderSchema = new Schema(
  {
    orderReferenceId: { type: String, required: true, unique: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cropName: { type: String, required: true },
    quantityOrdered: { type: Number, required: true },
    unit: { type: String, required: true },
    pricePerUnit: { type: Number, required: true },
    totalAmountKES: { type: Number, required: true },
    fulfillmentType: { type: String, enum: Object.values(FulfillmentType), required: true },
    paymentStatus: {
      type: String,
      enum: Object.values(OrderPaymentStatus),
      default: OrderPaymentStatus.PENDING_PAYMENT,
    },
    mpesaCheckoutRequestId: { type: String },
    // The second identifier Safaricom issues on an STK Push. The provider
    // returned it and the platform threw it away; it is what Safaricom support
    // asks for alongside the checkout id, and the admin transaction view needs
    // both to reconcile an order against an M-Pesa statement.
    mpesaMerchantRequestId: { type: String },
    mpesaTransactionId: { type: String, unique: true, sparse: true },
    // When the current payment session was opened. Set at order creation and
    // again on every retry, so a retried order is not judged stale by the
    // reconciliation sweep on the strength of its original createdAt.
    paymentRequestedAt: { type: Date },
    buyerPhone: { type: String, required: true },
    fulfillmentStatus: {
      type: String,
      enum: Object.values(OrderFulfillmentStatus),
      default: OrderFulfillmentStatus.AWAITING_PAYMENT,
    },
    // Fulfilment progress within IN_FULFILLMENT. Descriptive only — escrow and
    // mediation key on fulfillmentStatus, never on this. See FulfillmentStage.
    fulfillmentStage: { type: String, enum: Object.values(FulfillmentStage) },
    // Append-only, forward-only record of stage transitions. Bounded by the
    // number of stages, so it lives on the order rather than in a collection of
    // its own; it feeds the transaction timeline alongside the payment and
    // escrow logs.
    stageHistory: [
      {
        _id: false,
        stage: { type: String, enum: Object.values(FulfillmentStage), required: true },
        at: { type: Date, required: true },
        note: { type: String, trim: true, maxlength: 200 },
      },
    ],
    paidAt: { type: Date },
    confirmedByFarmerAt: { type: Date },
    receivedByBuyerAt: { type: Date },
    disputeFlaggedAt: { type: Date },
    disputeReason: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ farmerId: 1, fulfillmentStatus: 1 });
orderSchema.index({ buyerId: 1, fulfillmentStatus: 1 });
orderSchema.index({ mpesaTransactionId: 1 }, { unique: true, sparse: true });
orderSchema.index({ orderReferenceId: 1 }, { unique: true });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type OrderDoc = mongoose.InferSchemaType<typeof orderSchema>;
const Order: mongoose.Model<OrderDoc> =
  (mongoose.models['Order'] as mongoose.Model<OrderDoc>) ?? mongoose.model('Order', orderSchema);
export default Order;
