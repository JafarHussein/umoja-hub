import React from 'react';
import { cn } from '@/lib/cn';

type StatusValue = 'verified' | 'pending' | 'rejected' | 'trusted';

interface StatusLabelProps {
  status: StatusValue;
  className?: string;
}

const CONFIG: Record<StatusValue, { dot: string; text: string; label: string }> = {
  verified: {
    dot: 'bg-ws-hub-green',
    text: 'text-ws-hub-green',
    label: 'VERIFIED',
  },
  trusted: {
    dot: 'bg-ws-hub-green',
    text: 'text-ws-hub-green',
    label: 'TRUSTED',
  },
  pending: {
    dot: 'bg-ws-status-pending',
    text: 'text-ws-status-pending',
    label: 'PENDING',
  },
  rejected: {
    dot: 'bg-ws-status-denied',
    text: 'text-ws-status-denied',
    label: 'REJECTED',
  },
};

export function StatusLabel({ status, className }: StatusLabelProps): React.ReactElement {
  const { dot, text, label } = CONFIG[status];
  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Status: ${label}`}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dot)} aria-hidden />
      <span className={cn('font-geist-mono text-ws-caption uppercase', text)}>{label}</span>
    </span>
  );
}
