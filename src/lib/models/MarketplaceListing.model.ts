import mongoose, { Schema } from 'mongoose';
import { ListingStatus, ListingUnit, ListingCategory, BuyerContactPreference } from '@/types';

const marketplaceListingSchema = new Schema(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    cropName: { type: String, required: true, trim: true },
    // Produce taxonomy (Marketplace Rebuild, Stage 3). Optional at the schema
    // level so pre-taxonomy listings stay valid; required for new listings via
    // cropListingSchema. Powers category browse/filter on the feed.
    category: { type: String, enum: Object.values(ListingCategory) },
    description: { type: String, required: true, minlength: 20 },
    quantityAvailable: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: Object.values(ListingUnit), required: true },
    currentPricePerUnit: { type: Number, required: true, min: 0 },
    pickupCounty: { type: String, required: true },
    pickupDescription: { type: String, required: true, minlength: 10 },
    imageUrls: [{ type: String }],
    listingStatus: {
      type: String,
      enum: Object.values(ListingStatus),
      default: ListingStatus.AVAILABLE,
    },
    isVerifiedListing: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    buyerContactPreference: [{ type: String, enum: Object.values(BuyerContactPreference) }],
  },
  { timestamps: true }
);

marketplaceListingSchema.index({ farmerId: 1 });
marketplaceListingSchema.index({ cropName: 1, listingStatus: 1 });
marketplaceListingSchema.index({ category: 1, listingStatus: 1 });
marketplaceListingSchema.index({ pickupCounty: 1, listingStatus: 1 });
marketplaceListingSchema.index({ currentPricePerUnit: 1 });
marketplaceListingSchema.index({ isVerifiedListing: 1, listingStatus: 1 });
marketplaceListingSchema.index({ createdAt: -1 });
marketplaceListingSchema.index({ title: 'text', cropName: 'text', description: 'text' });

marketplaceListingSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type MarketplaceListingDoc = mongoose.InferSchemaType<typeof marketplaceListingSchema>;
const MarketplaceListing: mongoose.Model<MarketplaceListingDoc> =
  (mongoose.models['MarketplaceListing'] as mongoose.Model<MarketplaceListingDoc>) ??
  mongoose.model('MarketplaceListing', marketplaceListingSchema);

export default MarketplaceListing;
