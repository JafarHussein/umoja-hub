'use client';

import React from 'react';
import { usePriceRecommendation } from '@/components/foodhub/PriceRecommendationPanel';
import { cn } from '@/lib/cn';

// Buyer-facing price fairness (Marketplace Rebuild, Stage 7). Reuses the Price
// Intelligence recommendation API to place this listing's price against the
// typical market range for the same crop + county. Honest by construction: when
// there isn't enough market data (no range), it renders nothing rather than a
// fake verdict. Guidance, never a gate.

type Verdict = 'below' | 'within' | 'above';

const VERDICT: Record<Verdict, { label: string; wrap: string; text: string; glyph: string }> = {
  below: {
    label: 'Below the typical market range — good value',
    wrap: 'bg-app-success-surface border-app-brand-border',
    text: 'text-app-success',
    glyph: '▼',
  },
  within: {
    label: 'Within the typical market range',
    wrap: 'bg-app-brand-surface border-app-brand-border',
    text: 'text-app-brand',
    glyph: '◆',
  },
  above: {
    label: 'Above the typical market range',
    wrap: 'bg-app-warning-surface border-app-warning/40',
    text: 'text-app-warning',
    glyph: '▲',
  },
};

export function PriceFairness({
  cropName,
  county,
  unit,
  price,
}: {
  cropName: string;
  county: string;
  unit: string;
  price: number;
}): React.ReactElement | null {
  const { data, isLoading } = usePriceRecommendation(cropName, county, unit);

  if (isLoading && !data) {
    return <div className="skeleton h-16 w-full rounded-app-card" aria-hidden="true" />;
  }

  if (!data || !data.range || data.range.low == null || data.range.high == null) {
    return null;
  }

  const { low, high } = data.range;
  const verdict: Verdict = price < low ? 'below' : price > high ? 'above' : 'within';
  const v = VERDICT[verdict];

  return (
    <div className={cn('rounded-app-card border p-4', v.wrap)}>
      <div className="flex items-center gap-2">
        <span aria-hidden className={v.text}>
          {v.glyph}
        </span>
        <p className={cn('app-body-strong', v.text)}>{v.label}</p>
      </div>
      <p className="app-meta mt-1 text-app-muted">
        Typical range for {cropName.toLowerCase()} in {county}:{' '}
        <span className="app-data-m text-app-ink">
          KSh {low.toLocaleString()}–{high.toLocaleString()}
        </span>{' '}
        / {unit.toLowerCase()}. Price Intelligence · guidance only.
      </p>
    </div>
  );
}
