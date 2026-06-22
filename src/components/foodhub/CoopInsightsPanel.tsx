'use client';

import React from 'react';
import { Table, THead, TH, TR, TD } from '@/components/app';
import type { CooperativeInsights } from '@/lib/intelligence/cooperativeInsights';

// Cooperative price insights — surfaced in the farmer group hub when a group is
// selected. Read-only; on the app design tokens.

export type { CooperativeInsights };

function formatKES(value: number | null): string {
  return value !== null ? `KES ${value.toLocaleString()}` : '—';
}

function Trend({ direction }: { direction: string }): React.ReactElement {
  if (direction === 'RISING') return <span className="text-app-brand">▲ Rising</span>;
  if (direction === 'FALLING') return <span className="text-app-danger">▼ Falling</span>;
  return <span className="text-app-muted">→ Stable</span>;
}

function Delta({ pct }: { pct: number | null }): React.ReactElement {
  if (pct === null) return <span className="text-app-muted">—</span>;
  const cls = pct >= 0 ? 'text-app-brand' : 'text-app-danger';
  return (
    <span className={cls}>
      {pct > 0 ? '+' : ''}
      {pct}%
    </span>
  );
}

export interface ICoopInsightsPanelProps {
  insights: CooperativeInsights | null;
  isLoading: boolean;
}

export function CoopInsightsPanel({
  insights,
  isLoading,
}: ICoopInsightsPanelProps): React.ReactElement {
  if (isLoading) {
    return <div className="skeleton h-40 rounded-app-card border border-app-hairline" />;
  }

  if (!insights || insights.crops.length === 0) {
    return (
      <div className="rounded-app-card border border-app-hairline bg-app-card py-8 text-center">
        <p className="app-body text-app-muted">
          No completed member sales yet. Crop performance will appear here as members trade.
        </p>
      </div>
    );
  }

  const stats: { label: string; value: string }[] = [
    {
      label: 'Active sellers',
      value: `${insights.activeMemberCount} / ${insights.memberCount}`,
    },
    { label: 'Completed value (90d)', value: formatKES(insights.totalCompletedValueKES) },
    { label: 'Crops traded', value: String(insights.crops.length) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-app-card border border-app-hairline bg-app-card p-3">
            <p className="app-label text-app-faint">{s.label}</p>
            <p className="app-data-m mt-1 text-app-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <Table>
        <THead>
          <TH>Crop</TH>
          <TH className="text-right">Member median</TH>
          <TH className="text-right">County market</TH>
          <TH className="text-right">vs market</TH>
          <TH className="text-right">Value (90d)</TH>
          <TH className="text-right">Trend</TH>
        </THead>
        <tbody>
          {insights.crops.map((c) => (
            <TR key={c.crop}>
              <TD className="capitalize text-app-ink">{c.crop}</TD>
              <TD className="app-data-m text-right">
                {c.memberMedianPrice !== null
                  ? `${formatKES(c.memberMedianPrice)}/${c.unit.toLowerCase()}`
                  : '—'}
              </TD>
              <TD className="app-data-m text-right text-app-muted">
                {c.countyBenchmark !== null ? formatKES(c.countyBenchmark) : '—'}
              </TD>
              <TD className="app-data-m text-right">
                <Delta pct={c.deltaPct} />
              </TD>
              <TD className="app-data-m text-right">{formatKES(c.completedValueKES)}</TD>
              <TD className="app-data-m text-right">
                <Trend direction={c.trendDirection} />
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>

      <p className="app-meta text-app-faint">
        “vs market” compares members’ median sale price to the live county recommendation. A negative
        value means members are selling below the prevailing market.
      </p>
    </div>
  );
}
