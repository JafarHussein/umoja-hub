import React from 'react';
import { cn } from '@/lib/cn';

interface WorkflowStepProps {
  step: string;
  actor: string;
  action: string;
  detail?: string;
  hub?: 'food' | 'education';
  isLast?: boolean;
}

export function WorkflowStep({
  step,
  actor,
  action,
  detail,
  hub,
  isLast = false,
}: WorkflowStepProps): React.ReactElement {
  const stepColor =
    hub === 'education' ? 'text-ws-hub-blue' : 'text-ws-hub-green';

  return (
    <div className="flex flex-col">
      <div className="border border-ws-border-light bg-ws-surface-base p-4 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span
            className={cn('font-geist-mono text-[13px] leading-5 font-medium tabular-nums shrink-0', stepColor)}
          >
            {step}
          </span>
          <span className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase">
            {actor}
          </span>
        </div>
        <p className="font-geist text-[16px] leading-[24px] font-semibold text-ws-text-primary">
          {action}
        </p>
        {detail && (
          <p className="font-geist text-[15px] leading-[22px] text-ws-text-secondary">{detail}</p>
        )}
      </div>

      {!isLast && (
        <div className="flex justify-center py-0" aria-hidden>
          <div className="w-px h-6 bg-ws-border-medium" />
        </div>
      )}
    </div>
  );
}
