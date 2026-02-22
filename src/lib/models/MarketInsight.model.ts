import mongoose, { Schema } from 'mongoose';

const marketInsightSchema = new Schema(
  {
    cropName: { type: String, required: true },
    county: { type: String, required: true },
    weekOf: { type: Date, required: true },
    pricing: {
      averageListingPrice: { type: Number },
      averageTransactionPrice: { type: Number },
      lowestPrice: { type: Number },
      highestPrice: { type: Number },
      middlemanBenchmark: { type: Number },
      platformPremium: { type: Number },
      dataPointCount: { type: Number },
    },
  },
  { timestamps: true }
);

marketInsightSchema.index({ cropName: 1, county: 1, weekOf: -1 });

marketInsightSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

const MarketInsight =
  mongoose.models.MarketInsight ?? mongoose.model('MarketInsight', marketInsightSchema);

export default MarketInsight;
