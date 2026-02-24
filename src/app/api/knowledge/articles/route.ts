import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import KnowledgeArticle from '@/lib/models/KnowledgeArticle.model';
import { articleSchema } from '@/lib/validation/knowledgeSchema';
import { AppError, handleApiError, requireRole, slugify, logger } from '@/lib/utils';
import { Role } from '@/types';
import { env } from '@/lib/env';

// ---------------------------------------------------------------------------
// GET /api/knowledge/articles — Public article list
// Filters: category, cropTag, search (title + summary)
// ISR: revalidate 3600s
// ---------------------------------------------------------------------------

export const revalidate = 3600;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const cropTag = searchParams.get('cropTag');
    const search = searchParams.get('search');
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '12', 10), 50);

    const query: Record<string, unknown> = { isPublished: true };

    if (category) query['category'] = category;
    if (cropTag) query['cropTags'] = cropTag;
    if (search) {
      query['$or'] = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
      ];
    }
    if (cursor) {
      query['_id'] = { $lt: cursor };
    }

    const articles = await KnowledgeArticle.find(query as object)
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit + 1)
      .select('slug title category sourceInstitution cropTags summary imageUrl publishedAt createdAt')
      .lean();

    const hasMore = articles.length > limit;
    const results = hasMore ? articles.slice(0, limit) : articles;
    const nextCursor = hasMore ? String((results[results.length - 1] as { _id: unknown })?._id) : null;

    return NextResponse.json({ data: results, nextCursor, hasMore });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/knowledge/articles — Admin creates article
// Auth: ADMIN
// Side effect: OpenAI content moderation on content field
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const body: unknown = await req.json();
    const parsed = articleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, title, isPublished, ...rest } = parsed.data;

    // OpenAI content moderation — block if flagged
    let moderationFlagged = false;
    try {
      const openaiKey = env('OPENAI_API_KEY');
      const modRes = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: content }),
      });

      if (modRes.ok) {
        const modData = (await modRes.json()) as { results?: Array<{ flagged: boolean }> };
        moderationFlagged = modData.results?.[0]?.flagged === true;
      } else {
        logger.warn('knowledge/articles', 'OpenAI moderation returned non-200, proceeding', {
          status: modRes.status,
        });
      }
    } catch (modError) {
      logger.error('knowledge/articles', 'OpenAI moderation failed, proceeding without moderation', {
        error: modError,
      });
    }

    if (moderationFlagged) {
      return NextResponse.json(
        { error: 'Content flagged by moderation system', code: 'AI_CONTENT_FLAGGED' },
        { status: 422 }
      );
    }

    await connectDB();

    // Generate unique slug from title
    let slug = slugify(title);
    const existingSlug = await KnowledgeArticle.findOne({ slug } as object).select('_id').lean();
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const article = await KnowledgeArticle.create({
      slug,
      title,
      content,
      isPublished,
      ...(isPublished && { publishedAt: new Date() }),
      createdBy: session!.user.id,
      category: rest.category,
      sourceInstitution: rest.sourceInstitution,
      summary: rest.summary,
      ...(rest.sourceUrl !== undefined && { sourceUrl: rest.sourceUrl }),
      ...(rest.author !== undefined && { author: rest.author }),
      ...(rest.cropTags !== undefined && { cropTags: rest.cropTags }),
      ...(rest.imageUrl !== undefined && { imageUrl: rest.imageUrl }),
    });

    logger.info('knowledge/articles', 'Article created', {
      articleId: article._id,
      slug,
      adminId: session!.user.id,
    });

    return NextResponse.json({ data: article }, { status: 201 });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new AppError('An article with this title already exists. Use a different title.', 409, 'DB_DUPLICATE');
    }
    return handleApiError(error);
  }
}
