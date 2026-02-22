import React from 'react';
import { VerificationStatus, FarmerTrustTier, StudentTier, ProjectStatus } from '@/types';

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

function getStatusColor(label: string): string {
  const upper = label.toUpperCase();

  // Verification statuses
  if (upper === VerificationStatus.APPROVED || upper === 'VERIFIED' || upper === FarmerTrustTier.PREMIUM || upper === FarmerTrustTier.TRUSTED || upper === StudentTier.ADVANCED || upper === ProjectStatus.VERIFIED) {
    return 'bg-accent-green/15 text-accent-green border-accent-green/30';
  }
  if (upper === VerificationStatus.PENDING || upper === 'UNDER_PEER_REVIEW' || upper === 'UNDER_LECTURER_REVIEW' || upper === FarmerTrustTier.ESTABLISHED || upper === StudentTier.INTERMEDIATE || upper === ProjectStatus.UNDER_PEER_REVIEW || upper === ProjectStatus.UNDER_LECTURER_REVIEW) {
    return 'bg-yellow-950/40 text-yellow-400 border-yellow-800/40';
  }
  if (upper === VerificationStatus.REJECTED || upper === 'DENIED' || upper === ProjectStatus.DENIED) {
    return 'bg-red-950/40 text-red-400 border-red-800/40';
  }
  if (upper === 'REVISION_REQUIRED' || upper === ProjectStatus.REVISION_REQUIRED) {
    return 'bg-orange-950/40 text-orange-400 border-orange-800/40';
  }
  if (upper === FarmerTrustTier.NEW || upper === StudentTier.BEGINNER || upper === VerificationStatus.UNSUBMITTED) {
    return 'bg-surface-secondary text-text-secondary border-white/10';
  }

  // Default neutral
  return 'bg-surface-secondary text-text-secondary border-white/10';
}

export function Badge({ variant = 'status', label, className = '' }: IBadgeProps): React.ReactElement {
  const colorClass =
    variant === 'neutral'
      ? 'bg-surface-secondary text-text-secondary border-white/10'
      : variant === 'success'
        ? 'bg-accent-green/15 text-accent-green border-accent-green/30'
        : variant === 'warning'
          ? 'bg-yellow-950/40 text-yellow-400 border-yellow-800/40'
          : variant === 'error'
            ? 'bg-red-950/40 text-red-400 border-red-800/40'
            : getStatusColor(label);

  return (
    <span
      className={[
        'inline-flex items-center rounded-[2px] border px-2 py-0.5 font-mono text-t6 font-medium uppercase tracking-wide',
        colorClass,
        className,
      ].join(' ')}
    >
      {label.replace(/_/g, ' ')}
    </span>
  );
}
