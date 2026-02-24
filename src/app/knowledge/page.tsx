import { Suspense } from 'react';
import KnowledgeArticleCard from '@/components/foodhub/KnowledgeArticleCard';
import KnowledgeHubClient from './KnowledgeHubClient';

export const revalidate = 3600;

const CATEGORIES = [
  { value: '', label: 'All Topics' },
  { value: 'FERTILIZER_VERIFICATION', label: 'Fertilizer' },
  { value: 'SEED_VERIFICATION', label: 'Seeds' },
  { value: 'ANIMAL_HEALTH', label: 'Animal Health' },
  { value: 'PEST_DISEASE', label: 'Pest & Disease' },
  { value: 'SEASONAL_CALENDAR', label: 'Seasonal Calendar' },
  { value: 'POST_HARVEST', label: 'Post-Harvest' },
  { value: 'MARKET_DYNAMICS', label: 'Market Dynamics' },
  { value: 'NEW_METHODS', label: 'New Methods' },
];

interface IArticle {
  _id: string;
  slug: string;
  title: string;
  summary: string;
  sourceInstitution: string;
  sourceUrl?: string;
  cropTags?: string[];
  publishedAt?: string;
  imageUrl?: string;
}

async function getArticles(category?: string): Promise<IArticle[]> {
  try {
    const params = new URLSearchParams({ limit: '12' });
    if (category) params.set('category', category);

    const baseUrl = process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/knowledge/articles?${params.toString()}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];
    const data = await res.json() as { data: IArticle[] };
    return data.data ?? [];
  } catch {
    return [];
  }
}

function ArticleGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-64 bg-surface-secondary border border-white/5 rounded animate-shimmer"
          style={{
            backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      ))}
    </div>
  );
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category } = await searchParams;
  const articles = await getArticles(category);

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-6xl mx-auto px-4 py-8 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-t1 text-text-primary mb-2">Knowledge Hub</h1>
          <p className="font-body text-t4 text-text-secondary">
            Agricultural guidance grounded in KEBS, KALRO, KEPHIS, and FAO Kenya standards.
          </p>
        </div>

        {/* Search + filter — client component */}
        <Suspense fallback={<div className="h-16 bg-surface-secondary border border-white/5 rounded animate-pulse mb-6" />}>
          <KnowledgeHubClient categories={CATEGORIES} currentCategory={category ?? ''} />
        </Suspense>

        {/* Category pills (static) */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.value}
              href={cat.value ? `/knowledge?category=${cat.value}` : '/knowledge'}
              className={`px-3 py-2 rounded-sm font-body text-t5 border transition-all duration-150 min-h-[44px] flex items-center ${
                category === cat.value || (!category && !cat.value)
                  ? 'bg-accent-green text-white border-accent-green'
                  : 'bg-surface-secondary text-text-secondary border-white/5 hover:text-text-primary'
              }`}
            >
              {cat.label}
            </a>
          ))}
        </div>

        {/* Article grid */}
        <Suspense fallback={<ArticleGridSkeleton />}>
          {articles.length === 0 ? (
            <div className="text-center py-16 bg-surface-elevated border border-white/5 rounded">
              <p className="font-body text-t4 text-text-secondary mb-2">No articles found</p>
              <p className="font-body text-t5 text-text-disabled">
                Try a different category or check back later — our editorial team publishes new articles weekly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <KnowledgeArticleCard
                  key={article._id}
                  slug={article.slug}
                  title={article.title}
                  summary={article.summary}
                  sourceInstitution={article.sourceInstitution}
                  {...(article.sourceUrl !== undefined && { sourceUrl: article.sourceUrl })}
                  {...(article.cropTags !== undefined && { cropTags: article.cropTags })}
                  {...(article.publishedAt !== undefined && { publishedAt: article.publishedAt })}
                  {...(article.imageUrl !== undefined && { imageUrl: article.imageUrl })}
                />
              ))}
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}
