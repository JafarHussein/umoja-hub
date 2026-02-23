import mongoose, { Schema } from 'mongoose';
import { OrderPaymentStatus, OrderFulfillmentStatus, FulfillmentType } from '@/types';

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
    mpesaTransactionId: { type: String, unique: true, sparse: true },
    buyerPhone: { type: String, required: true },
    fulfillmentStatus: {
      type: String,
      enum: Object.values(OrderFulfillmentStatus),
      default: OrderFulfillmentStatus.AWAITING_PAYMENT,
    },
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
