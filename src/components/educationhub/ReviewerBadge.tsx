'use client';

import { StudentTier } from '@/types';

interface IReviewerBadgeProps {
  tier: string;
  isVerified?: boolean;
}

const tierLabels: Record<string, string> = {
  [StudentTier.BEGINNER]: 'Beginner Reviewer',
  [StudentTier.INTERMEDIATE]: 'Intermediate Reviewer',
  [StudentTier.ADVANCED]: 'Advanced Reviewer',
};

const tierColors: Record<string, string> = {
  [StudentTier.BEGINNER]: 'text-text-secondary border-text-secondary/30',
  [StudentTier.INTERMEDIATE]: 'text-accent-green border-accent-green/30',
  [StudentTier.ADVANCED]: 'text-text-primary border-text-primary/30',
};

export default function ReviewerBadge({ tier, isVerified = false }: IReviewerBadgeProps) {
  const label = tierLabels[tier] ?? tier;
  const colorClass = tierColors[tier] ?? 'text-text-secondary border-white/10';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border font-mono text-t6 ${colorClass}`}
    >
      {isVerified && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          className="text-accent-green flex-shrink-0"
          aria-hidden="true"
        >
          <path
            d="M2 6L5 9L10 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {label}
    </span>
  );
}
