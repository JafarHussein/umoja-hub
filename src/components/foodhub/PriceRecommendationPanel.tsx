'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/app';
import { cn } from '@/lib/cn';
import type { PriceRecommendation } from '@/lib/intelligence/priceIntelligence';

// Price Intelligence recommendation panel + fetch hook. Presentation runs on the
// `app` design tokens (matches PriceIntelligenceDashboard) and is reused by both
// the listing form and the standalone prices page. Guidance, never enforcement —
// the "Use" button only pre-fills the farmer's price field.

export type { PriceRecommendation };

interface IUsePriceRecommendation {
  data: PriceRecommendation | null;
  isLoading: boolean;
}

/**
 * Debounced fetch of GET /api/prices/recommendation. Clears when crop/county are
 * missing; aborts in-flight requests on change. Never throws.
 */
export function usePriceRecommendation(
  cropName: string,
  county: string,
  unit: string,
  quantity?: number
): IUsePriceRecommendation {
  const [data, setData] = useState<PriceRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!cropName || !county) {
      setData(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        try {
          // D12 — this hook drives the listing form, which is exactly where the
          // feedback loop lives: without it, saving a price and reopening the
          // form nudges the recommendation toward whatever was typed. The server
          // takes the farmer id from the session, not from this flag.
          const params = new URLSearchParams({
            cropName,
            county,
            unit,
            excludeOwnListings: 'true',
          });
          if (quantity && quantity > 0) params.set('quantity', String(quantity));
          const res = await fetch(`/api/prices/recommendation?${params.toString()}`, {
            signal: controller.signal,
          });
          if (res.ok) {
            const body = (await res.json()) as { data: PriceRecommendation };
            setData(body.data);
          }
        } catch {
          // aborted or network error — leave previous data in place
        } finally {
          setIsLoading(false);
        }
      })();
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cropName, county, unit, quantity]);

  return { data, isLoading };
}

const BAND_LABEL: Record<PriceRecommendation['confidenceBand'], string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

const DEMAND_LABEL: Record<PriceRecommendation['demand']['level'], string> = {
  LOW: 'Soft',
  MODERATE: 'Steady',
  HIGH: 'High',
  VERY_HIGH: 'Very high',
};

function formatKES(value: number | null): string {
  return value !== null ? `KSh ${value.toLocaleString()}` : '—';
}

function TrendBadge({ trend }: { trend: PriceRecommendation['trend'] }) {
  const pct = trend.changePct30d;
  const label = pct !== null ? `${pct > 0 ? '+' : ''}${pct}% · 30 days` : 'Holding steady';
  if (trend.direction === 'RISING') {
    return <span className="text-app-brand">▲ {label}</span>;
  }
  if (trend.direction === 'FALLING') {
    return <span className="text-app-danger">▼ {label}</span>;
  }
  return <span className="text-app-muted">→ {label}</span>;
}

interface IRowProps {
  label: string;
  children: React.ReactNode;
}

function Row({ label, children }: IRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="app-label text-app-muted">{label}</span>
      <span className="app-body text-app-ink">{children}</span>
    </div>
  );
}

export interface IPriceRecommendationPanelProps {
  recommendation: PriceRecommendation | null;
  isLoading: boolean;
  /** When provided and a price exists, renders a "Use" button that fills the field. */
  onUsePrice?: (price: number) => void;
  className?: string;
}

export function PriceRecommendationPanel({
  recommendation,
  isLoading,
  onUsePrice,
  className,
}: IPriceRecommendationPanelProps): React.ReactElement {
  const rec = recommendation;
  const hasPrice = rec?.recommendedPricePerUnit != null;

  return (
    <div
      className={cn(
        'rounded-app-card border border-app-hairline bg-app-card p-5',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="app-h2 text-app-ink">Price Intelligence</h4>
        {rec && hasPrice && (
          <span className="app-meta rounded-app-pill border border-app-hairline px-2.5 py-1 text-app-muted">
            {rec.confidence}% · {BAND_LABEL[rec.confidenceBand]} confidence
          </span>
        )}
      </div>

      {isLoading && !rec && (
        <p className="app-body text-app-muted">Reading the market…</p>
      )}

      {rec && !hasPrice && (
        <p className="app-body text-app-muted">{rec.insight}</p>
      )}

      {rec && hasPrice && (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="app-label text-app-muted">Recommended</p>
              <p className="app-data-l text-app-ink">
                {formatKES(rec.recommendedPricePerUnit)}
                <span className="app-meta text-app-faint"> / {rec.unit.toLowerCase()}</span>
              </p>
            </div>
            {onUsePrice && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onUsePrice(rec.recommendedPricePerUnit as number)}
              >
                Use {formatKES(rec.recommendedPricePerUnit)}
              </Button>
            )}
          </div>

          <div className="divide-y divide-app-hairline border-t border-app-hairline pt-1">
            <Row label="Market range">
              {rec.range ? `${formatKES(rec.range.low)} – ${formatKES(rec.range.high)}` : '—'}
            </Row>
            <Row label="Regional average">{formatKES(rec.regionalAveragePerUnit)}</Row>
            <Row label="Demand">{DEMAND_LABEL[rec.demand.level]}</Row>
            <Row label="Trend">
              <TrendBadge trend={rec.trend} />
            </Row>
            {rec.expectedEarningsKES != null && (
              <Row label="Expected earnings">{formatKES(rec.expectedEarningsKES)}</Row>
            )}
          </div>

          <p className="app-meta text-app-muted">{rec.insight}</p>
        </div>
      )}
    </div>
  );
}
