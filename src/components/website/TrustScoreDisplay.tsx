import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

interface TrustScoreComponent {
  label: string;
  value: number;
  max: number;
}

interface TrustScoreDisplayProps {
  score: number;
  tier: string;
  components: TrustScoreComponent[];
  methodologyHref?: string;
  className?: string;
}

const TIER_COLOR: Record<string, string> = {
  ESTABLISHED: 'text-ws-text-dim',
  TRUSTED: 'text-ws-hub-green',
  ELITE: 'text-ws-hub-green',
};

export function TrustScoreDisplay({
  score,
  tier,
  components,
  methodologyHref,
  className,
}: TrustScoreDisplayProps): React.ReactElement {
  const tierColor = TIER_COLOR[tier] ?? 'text-ws-text-dim';
  const overallPct = Math.min(100, Math.round((score / 100) * 100));

  return (
    <div
      className={cn(
        'bg-ws-surface-dark border border-ws-border-dark p-5 flex flex-col gap-4',
        className
      )}
    >
      <p className="font-geist-mono text-ws-caption text-ws-text-faint uppercase">Trust Score</p>

      <div className="flex items-end justify-between gap-4">
        <span className="font-geist-mono text-[48px] leading-none font-medium text-ws-text-bright tabular-nums">
          {score}
        </span>
        <span className={cn('font-geist-mono text-ws-caption uppercase mb-1', tierColor)}>
          {tier}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="h-1.5 bg-ws-surface-dark-3 w-full rounded-none overflow-hidden">
          <div
            className="h-full bg-ws-hub-green transition-none"
            style={{ width: `${overallPct}%` }}
            aria-label={`Overall score: ${score} out of 100`}
          />
        </div>
        <p className="font-geist-mono text-ws-caption text-ws-text-faint text-right">/100</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {components.map(({ label, value, max }) => {
          const pct = Math.min(100, Math.round((value / max) * 100));
          return (
            <div key={label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-geist-mono text-ws-caption text-ws-text-dim">{label}</span>
                <span className="font-geist-mono text-ws-caption text-ws-text-faint tabular-nums">
                  {value}/{max}
                </span>
              </div>
              <div className="h-1 bg-ws-surface-dark-3 w-full overflow-hidden">
                <div
                  className="h-full bg-ws-hub-green"
                  style={{ width: `${pct}%` }}
                  aria-label={`${label}: ${value} out of ${max}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {methodologyHref && (
        <Link
          href={methodologyHref}
          className="font-geist-mono text-ws-caption text-ws-text-faint hover:text-ws-text-dim transition-colors duration-150 self-start"
        >
          Score methodology →
        </Link>
      )}
    </div>
  );
}
