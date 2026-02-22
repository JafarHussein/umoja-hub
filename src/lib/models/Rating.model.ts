import mongoose, { Schema } from 'mongoose';

const ratingSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

ratingSchema.index({ farmerId: 1 });
ratingSchema.index({ orderId: 1 }, { unique: true });

ratingSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

const Rating = mongoose.models.Rating ?? mongoose.model('Rating', ratingSchema);
export default Rating;
