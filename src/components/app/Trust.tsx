import * as React from 'react';
import { cn } from '@/lib/cn';

// App design-system trust components — the heart of the product. Mirror of the
// Figma "Components" trust set (StatusPill 250:18, VerificationBadge 251:11,
// TrustScore 251:12, DeliveryConfidence 252:12, DecisionAttribution 254:2).
// Status is always conveyed by icon + shape + text, never colour alone
// (Foundation pre-flight). Against the `app` token group; numbers use the mono
// `.app-data-*` ramp. Honest by construction — no fake-precise figures.

// ── StatusPill — tinted state pill (order/transaction lifecycle) ─────────────
export type StatusState = 'verified' | 'pending' | 'in-transit' | 'completed' | 'denied';

const STATUS: Record<StatusState, { label: string; glyph: string; wrap: string; text: string }> = {
  verified: { label: 'Verified', glyph: '✓', wrap: 'bg-app-success-surface', text: 'text-app-success' },
  pending: { label: 'Pending', glyph: '◷', wrap: 'bg-app-warning-surface', text: 'text-app-warning' },
  'in-transit': { label: 'In transit', glyph: '◐', wrap: 'bg-app-info-surface', text: 'text-app-info' },
  completed: { label: 'Completed', glyph: '✓', wrap: 'bg-app-success-surface', text: 'text-app-success' },
  denied: { label: 'Denied', glyph: '⊘', wrap: 'bg-app-danger-surface', text: 'text-app-danger' },
};

export interface IStatusPillProps {
  state: StatusState;
  label?: string;
  className?: string;
}

export function StatusPill({ state, label, className }: IStatusPillProps): React.ReactElement {
  const s = STATUS[state];
  return (
    <span
      className={cn(
        'app-label inline-flex items-center gap-1 rounded-app-pill px-2 py-0.5',
        s.wrap,
        s.text,
        className
      )}
    >
      <span aria-hidden>{s.glyph}</span>
      {label ?? s.label}
    </span>
  );
}

// ── VerificationBadge — bordered identity-verification badge ─────────────────
export type VerificationState = 'verified' | 'pending' | 'denied';

const VERIFY: Record<VerificationState, { label: string; glyph: string; border: string; text: string }> = {
  verified: { label: 'Verified', glyph: '✓', border: 'border-app-success', text: 'text-app-success' },
  pending: { label: 'Pending', glyph: '◷', border: 'border-app-warning', text: 'text-app-warning' },
  denied: { label: 'Denied', glyph: '⊘', border: 'border-app-danger', text: 'text-app-danger' },
};

export interface IVerificationBadgeProps {
  state: VerificationState;
  label?: string;
  className?: string;
}

export function VerificationBadge({
  state,
  label,
  className,
}: IVerificationBadgeProps): React.ReactElement {
  const v = VERIFY[state];
  return (
    <span
      className={cn(
        'app-label inline-flex items-center gap-1 rounded-app-pill border bg-app-card px-2 py-0.5',
        v.border,
        v.text,
        className
      )}
    >
      <span aria-hidden>{v.glyph}</span>
      {label ?? v.label}
    </span>
  );
}

// ── TrustScore — glance pill `◆ Verified · Trust NN` (mono number) ───────────
export interface ITrustScoreProps {
  score: number;
  className?: string;
}

export function TrustScore({ score, className }: ITrustScoreProps): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-app-pill bg-app-brand-surface px-2.5 py-1',
        className
      )}
    >
      <span aria-hidden className="text-app-brand">
        ◆
      </span>
      <span className="app-label text-app-brand">Verified</span>
      <span aria-hidden className="text-app-muted">·</span>
      <span className="app-label text-app-muted">Trust</span>
      <span className="app-data-m text-app-brand">{score}</span>
    </span>
  );
}

// ── DeliveryConfidence — honest, progressive (Decision 02 / delegated) ───────
// Building: "Building track record · N completed" (no %). Established: shows the
// on-time % with its denominator and a "not an estimate" note — only when there
// is a real track record behind it.
export interface IDeliveryConfidenceProps {
  completed: number;
  /** On-time percentage (0–100). Provide only with `total` once established. */
  percent?: number;
  /** Total deliveries behind the percentage. Required for the % to show. */
  total?: number;
  className?: string;
}

export function DeliveryConfidence({
  completed,
  percent,
  total,
  className,
}: IDeliveryConfidenceProps): React.ReactElement {
  const established = percent !== undefined && total !== undefined;
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {established ? (
        <>
          <span>
            <span className="app-data-l text-app-ink">{percent}%</span>{' '}
            <span className="app-meta text-app-muted">on time</span>
          </span>
          <span className="app-meta text-app-muted">
            of {total} deliveries · not an estimate
          </span>
        </>
      ) : (
        <span className="app-meta text-app-muted">
          Building track record · {completed} completed
        </span>
      )}
    </div>
  );
}

// ── DecisionAttribution — named human + evidence (reviewer · date · basis) ───
export interface IDecisionAttributionProps {
  reviewer: string;
  date: string;
  basis: string;
  className?: string;
}

export function DecisionAttribution({
  reviewer,
  date,
  basis,
  className,
}: IDecisionAttributionProps): React.ReactElement {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className="app-meta text-app-muted">Reviewed by</span>
      <span className="app-body-strong text-app-ink">{reviewer}</span>
      <span className="app-meta text-app-muted">
        {date} · {basis}
      </span>
    </div>
  );
}
