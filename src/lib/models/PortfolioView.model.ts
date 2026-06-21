import mongoose, { Schema } from 'mongoose';

// ---------------------------------------------------------------------------
// PortfolioView — an append-only record of an employer (or other viewer)
// opening a student's public portfolio. The portfolio's view count is derived
// by counting these documents (kept consistent with the platform's
// derive-don't-store discipline for trust and escrow). Written when a public
// portfolio is fetched by an authenticated EMPLOYER; the viewed student is also
// notified. `viewerId` is absent for anonymous public reads.
// ---------------------------------------------------------------------------

const portfolioViewSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    viewerId: { type: Schema.Types.ObjectId, ref: 'User' },
    viewerRole: { type: String },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

portfolioViewSchema.index({ studentId: 1, viewedAt: -1 });
portfolioViewSchema.index({ viewerId: 1, viewedAt: -1 });

type PortfolioViewDoc = mongoose.InferSchemaType<typeof portfolioViewSchema>;
const PortfolioView: mongoose.Model<PortfolioViewDoc> =
  (mongoose.models['PortfolioView'] as mongoose.Model<PortfolioViewDoc>) ??
  mongoose.model('PortfolioView', portfolioViewSchema);

export default PortfolioView;
