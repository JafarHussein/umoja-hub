import React from 'react';
import { VerificationStatus, FarmerTrustTier, ProjectStatus } from '@/types';

export type BadgeVariant =
  | 'status'
  | 'tier-farmer'
  | 'tier-student'
  | 'project-status'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error';

export interface IBadgeProps {
  variant?: BadgeVariant;
  label: string;
  className?: string;
}

// Semantic state classes — theme-aware unified tokens (one accent + meaningful
// state colours). REVISION_REQUIRED folds into `warning` (an attention state).
const SUCCESS = 'bg-success/15 text-success border-success/30';
const WARNING = 'bg-warning/15 text-warning border-warning/30';
const DANGER = 'bg-danger/15 text-danger border-danger/30';
const NEUTRAL = 'bg-surface-raised text-fg-muted border-border';

function getStatusColor(label: string): string {
  const upper = label.toUpperCase();

  // Verification statuses
  if (upper === VerificationStatus.APPROVED || upper === 'VERIFIED' || upper === FarmerTrustTier.PREMIUM || upper === FarmerTrustTier.TRUSTED || upper === ProjectStatus.VERIFIED) {
    return SUCCESS;
  }
  if (upper === VerificationStatus.PENDING || upper === 'UNDER_PEER_REVIEW' || upper === 'UNDER_LECTURER_REVIEW' || upper === FarmerTrustTier.ESTABLISHED || upper === ProjectStatus.UNDER_PEER_REVIEW || upper === ProjectStatus.UNDER_LECTURER_REVIEW) {
    return WARNING;
  }
  if (upper === VerificationStatus.REJECTED || upper === 'DENIED' || upper === ProjectStatus.DENIED) {
    return DANGER;
  }
  if (upper === 'REVISION_REQUIRED' || upper === ProjectStatus.REVISION_REQUIRED) {
    return WARNING;
  }
  if (upper === FarmerTrustTier.NEW || upper === VerificationStatus.UNSUBMITTED) {
    return NEUTRAL;
  }

  // Default neutral
  return NEUTRAL;
}

export function Badge({ variant = 'status', label, className = '' }: IBadgeProps): React.ReactElement {
  const colorClass =
    variant === 'neutral'
      ? NEUTRAL
      : variant === 'success'
        ? SUCCESS
        : variant === 'warning'
          ? WARNING
          : variant === 'error'
            ? DANGER
            : getStatusColor(label);

  return (
    <span
      className={[
        'inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-t6 font-medium uppercase tracking-wide',
        colorClass,
        className,
      ].join(' ')}
    >
      {label.replace(/_/g, ' ')}
    </span>
  );
}
