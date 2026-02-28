import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import KnowledgeArticle from '@/lib/models/KnowledgeArticle.model';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role } from '@/types';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// POST /api/admin/knowledge/[articleId] — Admin publish / unpublish article
// PATCH /api/admin/knowledge/[articleId] — Admin edit article fields
// Auth: ADMIN
// ---------------------------------------------------------------------------

const publishSchema = z.object({
  action: z.enum(['publish', 'unpublish']),
});

const editSchema = z.object({
  title: z.string().min(5).optional(),
  summary: z.string().min(10).optional(),
  content: z.string().min(50).optional(),
  cropTags: z.array(z.string()).optional(),
  sourceUrl: z.string().url().optional(),
});

interface IRouteParams {
  params: Promise<{ articleId: string }>;
}

export async function POST(req: NextRequest, { params }: IRouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const { articleId } = await params;

    const body: unknown = await req.json();
    const parsed = publishSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const article = await KnowledgeArticle.findById(articleId);
    if (!article) {
      throw new AppError('Article not found.', 404, 'DB_NOT_FOUND');
    }

    const isPublishing = parsed.data.action === 'publish';
    const update: Record<string, unknown> = { isPublished: isPublishing };
    if (isPublishing && !article.publishedAt) {
      update['publishedAt'] = new Date();
    }

    await KnowledgeArticle.findByIdAndUpdate(articleId, { $set: update });

    logger.info('admin/knowledge', `Article ${parsed.data.action}ed`, {
      articleId,
      adminId: session!.user.id,
      slug: article.slug,
    });

    return NextResponse.json({
      data: {
        articleId,
        isPublished: isPublishing,
        action: parsed.data.action,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: IRouteParams): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const { articleId } = await params;

    const body: unknown = await req.json();
    const parsed = editSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const article = await KnowledgeArticle.findById(articleId);
    if (!article) {
      throw new AppError('Article not found.', 404, 'DB_NOT_FOUND');
    }

    const updated = await KnowledgeArticle.findByIdAndUpdate(
      articleId,
      { $set: parsed.data },
      { new: true }
    ).lean();

    logger.info('admin/knowledge', 'Article edited', {
      articleId,
      adminId: session!.user.id,
      fields: Object.keys(parsed.data),
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
