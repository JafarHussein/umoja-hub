import { z } from 'zod';
import { KnowledgeCategory } from '@/types';

export const articleSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200),
  category: z.enum([
    KnowledgeCategory.FERTILIZER_VERIFICATION,
    KnowledgeCategory.SEED_VERIFICATION,
    KnowledgeCategory.ANIMAL_HEALTH,
    KnowledgeCategory.PEST_DISEASE,
    KnowledgeCategory.SEASONAL_CALENDAR,
    KnowledgeCategory.POST_HARVEST,
    KnowledgeCategory.MARKET_DYNAMICS,
    KnowledgeCategory.NEW_METHODS,
  ]),
  sourceInstitution: z.string().trim().min(1, 'Source institution is required'),
  sourceUrl: z.string().url('Must be a valid URL').optional(),
  author: z.string().trim().optional(),
  cropTags: z.array(z.string().trim().min(1)).optional(),
  summary: z
    .string()
    .trim()
    .min(20, 'Summary must be at least 20 characters')
    .max(500, 'Summary must be under 500 characters'),
  content: z.string().trim().min(100, 'Content must be at least 100 characters'),
  imageUrl: z.string().url('Must be a valid URL').optional(),
  isPublished: z.boolean().default(false),
});

export type ArticleInput = z.infer<typeof articleSchema>;
