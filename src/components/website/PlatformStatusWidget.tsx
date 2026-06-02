import React from 'react';
import { cn } from '@/lib/cn';

type OperationalStatus = 'operational' | 'degraded' | 'down';

interface PlatformStatusWidgetProps {
  status: OperationalStatus;
  queueSize: number;
  medianReviewDays: number;
  updatedAt: string;
  className?: string;
}

const STATUS_CONFIG: Record<
  OperationalStatus,
  { dot: string; label: string }
> = {
  operational: { dot: 'bg-ws-hub-green', label: 'PLATFORM OPERATIONAL' },
  degraded: { dot: 'bg-ws-status-pending', label: 'PLATFORM DEGRADED' },
  down: { dot: 'bg-ws-status-denied', label: 'PLATFORM DOWN' },
};

export function PlatformStatusWidget({
  status,
  queueSize,
  medianReviewDays,
  updatedAt,
  className,
}: PlatformStatusWidgetProps): React.ReactElement {
  const { dot, label } = STATUS_CONFIG[status];

  return (
    <div
      className={cn(
        'bg-ws-surface-dark-2 border border-ws-border-dark px-4 py-3 flex flex-col gap-2',
        className
      )}
      aria-label="Platform operational status"
    >
      <div className="flex items-center gap-2">
        <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} aria-hidden />
        <span className="font-geist-mono text-[13px] leading-5 font-medium text-ws-text-bright">
          {label}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-geist-mono text-ws-caption text-ws-text-faint">
            Verification queue
          </span>
          <span className="font-geist-mono text-ws-caption text-ws-text-dim tabular-nums">
            {queueSize}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-geist-mono text-ws-caption text-ws-text-faint">
            Median review time
          </span>
          <span className="font-geist-mono text-ws-caption text-ws-text-dim tabular-nums">
            {medianReviewDays}d
          </span>
        </div>
      </div>

      <p className="font-geist-mono text-[11px] leading-4 text-ws-text-faint">
        Updated {updatedAt}
      </p>
    </div>
  );
}
