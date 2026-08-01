import mongoose, { Schema } from 'mongoose';

// ---------------------------------------------------------------------------
// D17 — `unit` is part of this record's identity.
//
// Every figure under `pricing` is a price, and a price is meaningless without
// the unit it is quoted in. Maize trades both per KG (~KES 40) and per 90 kg BAG
// (~KES 3,600); before `unit` existed, one document held statistics blended
// across both, and `/api/prices` served its `middlemanBenchmark` to callers
// asking about either. The same defect as D1, one collection over.
//
// `unit` is therefore in the compound index AND must be in every upsert filter.
// Omitting it there is the subtle failure: the KG and BAG aggregations for one
// crop, county and week would match the same document and overwrite each other
// on alternate iterations.
// ---------------------------------------------------------------------------

const marketInsightSchema = new Schema(
  {
    cropName: { type: String, required: true },
    county: { type: String, required: true },
    unit: { type: String, required: true },
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

marketInsightSchema.index({ cropName: 1, county: 1, unit: 1, weekOf: -1 });

marketInsightSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type MarketInsightDoc = mongoose.InferSchemaType<typeof marketInsightSchema>;
const MarketInsight: mongoose.Model<MarketInsightDoc> =
  (mongoose.models['MarketInsight'] as mongoose.Model<MarketInsightDoc>) ??
  mongoose.model('MarketInsight', marketInsightSchema);

export default MarketInsight;
