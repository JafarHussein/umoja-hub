import React from 'react';
import { FarmerTrustTier } from '@/types';

export interface ITrustScoreDisplayProps {
  compositeScore: number;
  tier: FarmerTrustTier;
  size?: 'sm' | 'md';
}

const tierColor: Record<FarmerTrustTier, string> = {
  [FarmerTrustTier.NEW]: 'text-text-disabled',
  [FarmerTrustTier.ESTABLISHED]: 'text-text-secondary',
  [FarmerTrustTier.TRUSTED]: 'text-accent-green',
  [FarmerTrustTier.PREMIUM]: 'text-accent-green',
};

/**
 * Displays the farmer trust score as "87 · TRUSTED" in JetBrains Mono.
 * No progress bar. No decoration. Score + tier only.
 */
export function TrustScoreDisplay({
  compositeScore,
  tier,
  size = 'md',
}: ITrustScoreDisplayProps): React.ReactElement {
  const textSize = size === 'sm' ? 'text-t6' : 'text-t5';

  return (
    <span
      className={['font-mono whitespace-nowrap', textSize, tierColor[tier]].join(' ')}
      aria-label={`Trust score: ${compositeScore}, tier: ${tier}`}
    >
      {compositeScore} · {tier}
    </span>
  );
}
