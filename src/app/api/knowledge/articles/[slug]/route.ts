import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import KnowledgeArticle from '@/lib/models/KnowledgeArticle.model';
import { AppError, handleApiError } from '@/lib/utils';

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
