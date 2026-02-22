import mongoose, { Schema } from 'mongoose';
import { KnowledgeCategory } from '@/types';

const knowledgeArticleSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, enum: Object.values(KnowledgeCategory), required: true },
    sourceInstitution: { type: String, required: true },
    sourceUrl: { type: String },
    author: { type: String },
    cropTags: [{ type: String }],
    summary: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

knowledgeArticleSchema.index({ slug: 1 }, { unique: true });
knowledgeArticleSchema.index({ category: 1, isPublished: 1 });
knowledgeArticleSchema.index({ cropTags: 1 });
knowledgeArticleSchema.index({ isPublished: 1, publishedAt: -1 });

knowledgeArticleSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

const KnowledgeArticle =
  mongoose.models.KnowledgeArticle ??
  mongoose.model('KnowledgeArticle', knowledgeArticleSchema);

export default KnowledgeArticle;
