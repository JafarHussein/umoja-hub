'use client';

import ArticleSourceBadge from './ArticleSourceBadge';

interface IKnowledgeArticleCardProps {
  slug: string;
  title: string;
  summary: string;
  sourceInstitution: string;
  sourceUrl?: string;
  cropTags?: string[];
  publishedAt?: string;
  imageUrl?: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function KnowledgeArticleCard({
  slug,
  title,
  summary,
  sourceInstitution,
  sourceUrl,
  cropTags,
  publishedAt,
  imageUrl,
}: IKnowledgeArticleCardProps) {
  return (
    <a
      href={`/knowledge/${slug}`}
      className="block bg-surface-elevated border border-white/5 rounded p-6 transition-all duration-150 hover:border-white/10 hover:bg-surface-secondary"
    >
      {imageUrl && (
        <div className="mb-4 rounded overflow-hidden bg-surface-secondary h-40 w-full">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="mb-3">
        <ArticleSourceBadge
          sourceInstitution={sourceInstitution}
          {...(sourceUrl !== undefined && { sourceUrl })}
        />
      </div>

      <h3 className="font-heading text-t3 text-text-primary mb-2 line-clamp-2 leading-snug">
        {title}
      </h3>

      <p className="font-body text-t5 text-text-secondary mb-4 line-clamp-3">
        {summary}
      </p>

      {cropTags && cropTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {cropTags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="font-body text-t6 text-text-disabled bg-surface-secondary border border-white/5 px-2 py-1 rounded-[2px]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {publishedAt && (
        <p className="font-body text-t6 text-text-disabled">
          {formatDate(publishedAt)}
        </p>
      )}
    </a>
  );
}
