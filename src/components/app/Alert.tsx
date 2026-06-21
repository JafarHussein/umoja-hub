import * as React from 'react';
import { cn } from '@/lib/cn';

// App design-system Alert — inline message on a semantic surface. Status is
// conveyed by icon + shape + text, never colour alone (Foundation §pre-flight).
// Against the `app` token group.
type AlertTone = 'danger' | 'warning' | 'info' | 'success';

const TONE: Record<AlertTone, { wrap: string; text: string; glyph: string }> = {
  danger: { wrap: 'bg-app-danger-surface border-app-danger/30', text: 'text-app-danger', glyph: '⊘' },
  warning: { wrap: 'bg-app-warning-surface border-app-warning/30', text: 'text-app-warning', glyph: '◐' },
  info: { wrap: 'bg-app-info-surface border-app-info/30', text: 'text-app-info', glyph: 'ℹ' },
  success: { wrap: 'bg-app-success-surface border-app-success/30', text: 'text-app-success', glyph: '✓' },
};

export interface IAlertProps {
  tone?: AlertTone;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', children, className }: IAlertProps): React.ReactElement {
  const t = TONE[tone];
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-app-control border px-3 py-2.5',
        t.wrap,
        className
      )}
    >
      <span aria-hidden className={cn('app-body-strong leading-5', t.text)}>
        {t.glyph}
      </span>
      <span className={cn('app-body', t.text)}>{children}</span>
    </div>
  );
}
