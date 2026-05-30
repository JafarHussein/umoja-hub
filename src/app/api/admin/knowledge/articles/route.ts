import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/admin/knowledge/articles — All articles for admin CMS (all statuses)
// Auth: ADMIN
// The public GET /api/knowledge/articles is ISR and only returns published
// articles. This endpoint is uncached and returns drafts too.
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const { default: KnowledgeArticle } = await import('@/lib/models/KnowledgeArticle.model');

    const articles = await KnowledgeArticle.find({})
      .sort({ createdAt: -1 })
      .select('slug title category isPublished publishedAt createdAt')
      .lean();

    return NextResponse.json({ articles });
  } catch (error) {
    return handleApiError(error);
  }
}
