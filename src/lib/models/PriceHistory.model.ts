import mongoose, { Schema } from 'mongoose';
import { PriceHistorySource } from '@/types';

const priceHistorySchema = new Schema({
  cropName: { type: String, required: true },
  county: { type: String, required: true },
  pricePerUnit: { type: Number, required: true },
  unit: { type: String, required: true },
  source: { type: String, enum: Object.values(PriceHistorySource), required: true },
  farmerId: { type: Schema.Types.ObjectId, ref: 'User' },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  recordedAt: { type: Date, default: Date.now },
});

priceHistorySchema.index({ cropName: 1, county: 1, recordedAt: -1 });
priceHistorySchema.index({ source: 1 });
priceHistorySchema.index({ farmerId: 1 });

priceHistorySchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

const PriceHistory =
  mongoose.models.PriceHistory ?? mongoose.model('PriceHistory', priceHistorySchema);

export default PriceHistory;
