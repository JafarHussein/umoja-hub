import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import KnowledgeArticle from '@/lib/models/KnowledgeArticle.model';
import { patchArticleSchema } from '@/lib/validation/knowledgeSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/knowledge/articles/[slug] — Public article detail
// ISR: revalidate 3600s
// Returns 404 if article is not published
// ---------------------------------------------------------------------------

export const revalidate = 3600;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    await connectDB();

    const article = await KnowledgeArticle.findOne({ slug, isPublished: true })
      .select('-__v')
      .lean();

    if (!article) {
      throw new AppError('Article not found or not yet published.', 404, 'DB_NOT_FOUND');
    }

    return NextResponse.json({ data: article });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/knowledge/articles/[slug] — Admin updates article
// Auth: ADMIN
// Accepts (all optional): isPublished, title, content, cropTags
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const { slug } = await params;
    const body: unknown = await req.json();
    const parsed = patchArticleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { isPublished, title, content, cropTags } = parsed.data;

    if (isPublished === undefined && title === undefined && content === undefined && cropTags === undefined) {
      return NextResponse.json(
        { error: 'No fields to update.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    await connectDB();

    const update: Record<string, unknown> = {};
    if (title !== undefined) update['title'] = title;
    if (content !== undefined) update['content'] = content;
    if (cropTags !== undefined) update['cropTags'] = cropTags;
    if (isPublished !== undefined) {
      update['isPublished'] = isPublished;
      if (isPublished) update['publishedAt'] = new Date();
    }

    const article = await KnowledgeArticle.findOneAndUpdate(
      { slug },
      { $set: update },
      { new: true }
    ).lean();

    if (!article) {
      throw new AppError('Article not found.', 404, 'DB_NOT_FOUND');
    }

    logger.info('knowledge/articles', 'Article updated', {
      slug,
      adminId: session!.user.id,
      changes: Object.keys(update),
    });

    return NextResponse.json({ data: article });
  } catch (error) {
    return handleApiError(error);
  }
}
