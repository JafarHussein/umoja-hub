import React from 'react';
import { cn } from '@/lib/cn';

interface DataPanelProps {
  label?: string;
  variant?: 'default' | 'darker';
  className?: string;
  children: React.ReactNode;
}

export function DataPanel({
  label,
  variant = 'default',
  className,
  children,
}: DataPanelProps): React.ReactElement {
  return (
    <div
      className={cn(
        'border border-ws-border-dark rounded-none',
        variant === 'default' ? 'bg-ws-surface-dark' : 'bg-ws-surface-dark-2',
        className
      )}
    >
      {label && (
        <div className="px-4 py-2.5 border-b border-ws-border-dark">
          <p className="font-geist-mono text-ws-caption text-ws-text-faint uppercase">{label}</p>
        </div>
      )}
      <div className="p-4 font-geist-mono text-ws-data text-ws-text-dim">{children}</div>
    </div>
  );
}

export function DataRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="font-geist-mono text-ws-data text-ws-text-faint shrink-0">{label}</span>
      <span className="font-geist-mono text-ws-data text-ws-text-dim text-right">{value}</span>
    </div>
  );
}
