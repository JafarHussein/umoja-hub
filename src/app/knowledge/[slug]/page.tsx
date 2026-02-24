import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import ArticleSourceBadge from '@/components/foodhub/ArticleSourceBadge';

export const revalidate = 3600;

interface IArticle {
  _id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  sourceInstitution: string;
  sourceUrl?: string;
  author?: string;
  cropTags?: string[];
  publishedAt?: string;
  imageUrl?: string;
}

async function getArticle(slug: string): Promise<IArticle | null> {
  try {
    const baseUrl = process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/knowledge/articles/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const data = await res.json() as { data: IArticle };
    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: 'Article not found — UmojaHub' };
  return {
    title: `${article.title} — UmojaHub Knowledge Hub`,
    description: article.summary,
  };
}

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-3xl mx-auto px-4 py-8 md:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href="/knowledge" className="font-body text-t5 text-text-secondary hover:text-text-primary transition-all duration-150">
            Knowledge Hub
          </Link>
          <span className="font-body text-t5 text-text-disabled mx-2">/</span>
          <span className="font-body text-t5 text-text-disabled capitalize">
            {article.category.replace('_', ' ').toLowerCase()}
          </span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="mb-4">
            <ArticleSourceBadge
              sourceInstitution={article.sourceInstitution}
              {...(article.sourceUrl !== undefined && { sourceUrl: article.sourceUrl })}
            />
          </div>

          <h1 className="font-heading text-t1 text-text-primary mb-4 leading-tight">
            {article.title}
          </h1>

          <p className="font-body text-t4 text-text-secondary mb-4">
            {article.summary}
          </p>

          <div className="flex flex-wrap items-center gap-4 font-body text-t6 text-text-disabled">
            {article.author && <span>By {article.author}</span>}
            {article.publishedAt && (
              <span>
                {new Date(article.publishedAt).toLocaleDateString('en-KE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          {article.sourceUrl && (
            <div className="mt-4 p-4 bg-surface-secondary border border-white/5 rounded">
              <p className="font-body text-t6 text-text-secondary mb-1">Primary source</p>
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-t5 text-accent-green hover:opacity-80 transition-all duration-150 break-all"
              >
                {article.sourceUrl}
              </a>
            </div>
          )}
        </header>

        {/* Article image */}
        {article.imageUrl && (
          <div className="mb-8 rounded overflow-hidden bg-surface-secondary">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Crop tags */}
        {article.cropTags && article.cropTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {article.cropTags.map((tag) => (
              <span
                key={tag}
                className="font-body text-t6 text-text-disabled bg-surface-secondary border border-white/5 px-2 py-1 rounded-[2px]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content — Markdown rendered */}
        <article className="prose prose-invert max-w-none">
          <div className="font-body text-t4 text-text-primary leading-relaxed [&_h2]:font-heading [&_h2]:text-t2 [&_h2]:text-text-primary [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:font-heading [&_h3]:text-t3 [&_h3]:text-text-primary [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:pl-6 [&_li]:mb-2 [&_li]:text-text-primary [&_strong]:text-text-primary [&_a]:text-accent-green [&_a:hover]:opacity-80">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </article>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <ArticleSourceBadge
              sourceInstitution={article.sourceInstitution}
              {...(article.sourceUrl !== undefined && { sourceUrl: article.sourceUrl })}
            />
            <p className="font-body text-t6 text-text-disabled">
              Content verified against {article.sourceInstitution} standards
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
