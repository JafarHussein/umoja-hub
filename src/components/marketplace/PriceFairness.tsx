'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import type { BuyerFairness, PriceAssessment } from '@/lib/intelligence/buyerFairness';

// Buyer-facing price fairness. Places this listing's price against the typical
// market range for the same crop + county + unit.
//
// Reads the listing-scoped fairness projection rather than the farmer
// recommendation endpoint, which is FARMER/ADMIN-only — calling it from this
// public page meant the signal never once rendered for a buyer or an anonymous
// visitor (D14). It renders the confidence and the geographic tier alongside the
// verdict (D15) and takes the band from the server (D16), so a buyer and a
// farmer cannot see contradictory judgements of the same price.
//
// Honest by construction: no evidence renders nothing, never a fake verdict.
// Guidance, never a gate — no listing is blocked, flagged or ranked down.

const ASSESSMENT: Record<PriceAssessment, { label: string; wrap: string; text: string; glyph: string }> = {
  WELL_BELOW: {
    label: 'Well below the typical market range',
    wrap: 'bg-app-success-surface border-app-brand-border',
    text: 'text-app-success',
    glyph: '▼',
  },
  BELOW: {
    label: 'Below the typical market range',
    wrap: 'bg-app-success-surface border-app-brand-border',
    text: 'text-app-success',
    glyph: '▼',
  },
  IN_RANGE: {
    label: 'In line with the typical market range',
    wrap: 'bg-app-brand-surface border-app-brand-border',
    text: 'text-app-brand',
    glyph: '◆',
  },
  ABOVE: {
    label: 'A little above the typical market range',
    wrap: 'bg-app-warning-surface border-app-warning/40',
    text: 'text-app-warning',
    glyph: '▲',
  },
  WELL_ABOVE: {
    label: 'Well above the typical market range',
    wrap: 'bg-app-warning-surface border-app-warning/40',
    text: 'text-app-warning',
    glyph: '▲',
  },
};

const CONFIDENCE_LABEL: Record<BuyerFairness['confidenceBand'], string> = {
  HIGH: 'strong evidence',
  MEDIUM: 'moderate evidence',
  LOW: 'limited evidence',
};

/**
 * Where the comparison actually came from. A national fallback must not be read
 * as a local figure, so the scope is stated rather than implied by the county
 * the buyer happens to be looking at.
 */
function basisSentence(basis: BuyerFairness['basis'], county: string, windowDays: number): string {
  const span = `the last ${windowDays} days`;
  if (basis === 'COUNTY') return `Based on sales in ${county} over ${span}.`;
  if (basis === 'ADJACENT')
    return `Based on sales in ${county} and the counties bordering it over ${span} — not enough data in ${county} alone.`;
  if (basis === 'REGION') return `Based on sales across the wider region over ${span} — not enough data in ${county} alone.`;
  return `Based on national sales over ${span} — no local data for this crop yet.`;
}

export function PriceFairness({
  listingId,
  county,
}: {
  listingId: string;
  county: string;
}): React.ReactElement | null {
  const [data, setData] = useState<BuyerFairness | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const res = await fetch(`/api/marketplace/${listingId}/fairness`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const body = (await res.json()) as { data: BuyerFairness };
          setData(body.data);
        }
      } catch {
        // Aborted or offline. The signal is guidance, so it stays absent.
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [listingId]);

  if (isLoading) {
    return <div className="skeleton h-16 w-full rounded-app-card" aria-hidden="true" />;
  }

  // No assessment means the engine had fewer than its minimum comparable
  // observations. Showing nothing is the correct outcome, not a degraded one.
  if (!data || !data.assessment) {
    return null;
  }

  const a = ASSESSMENT[data.assessment];

  return (
    <div className={cn('rounded-app-card border p-4', a.wrap)}>
      <div className="flex items-center gap-2">
        <span aria-hidden className={a.text}>
          {a.glyph}
        </span>
        <p className={cn('app-body-strong', a.text)}>{a.label}</p>
      </div>
      <p className="app-meta mt-1 text-app-muted">
        {basisSentence(data.basis, county, data.windowDays)}{' '}
        <span className="text-app-ink">{CONFIDENCE_LABEL[data.confidenceBand]}</span>. Price
        Intelligence · guidance only.
      </p>
    </div>
  );
}
