import mongoose, { Schema } from 'mongoose';
import { PriceAlertNotificationMethod } from '@/types';

const priceAlertSchema = new Schema(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cropName: { type: String, required: true },
    county: { type: String, required: true },
    targetPricePerUnit: { type: Number, required: true },
    unit: { type: String, required: true },
    notificationMethod: {
      type: String,
      enum: Object.values(PriceAlertNotificationMethod),
      required: true,
    },
    isActive: { type: Boolean, default: true },
    lastTriggeredAt: { type: Date },
  },
  { timestamps: true }
);

priceAlertSchema.index({ farmerId: 1, isActive: 1 });
priceAlertSchema.index({ cropName: 1, county: 1, isActive: 1 });

priceAlertSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type PriceAlertDoc = mongoose.InferSchemaType<typeof priceAlertSchema>;
const PriceAlert: mongoose.Model<PriceAlertDoc> =
  (mongoose.models['PriceAlert'] as mongoose.Model<PriceAlertDoc>) ?? mongoose.model('PriceAlert', priceAlertSchema);

export default PriceAlert;
