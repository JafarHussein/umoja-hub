'use client';

interface IArticleSourceBadgeProps {
  sourceInstitution: string;
  sourceUrl?: string;
}

export default function ArticleSourceBadge({ sourceInstitution, sourceUrl }: IArticleSourceBadgeProps) {
  const badge = (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-surface-secondary border border-white/5 rounded-sm">
      <span className="font-mono text-t6 text-accent-green font-medium tracking-wide uppercase">
        {sourceInstitution}
      </span>
    </span>
  );

  if (sourceUrl) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex transition-all duration-150 hover:opacity-80"
        aria-label={`Source: ${sourceInstitution} (opens in new tab)`}
      >
        {badge}
      </a>
    );
  }

  return badge;
}
