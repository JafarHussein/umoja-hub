'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

// App design-system Modal / Sheet — floating panel (Figma "Modal / Sheet"
// 262:3) with the Elevation/Float shadow. Closes on Escape and backdrop click.
// Against the `app` token group; carries `.theme-app` so it renders correctly
// even when mounted outside an app-scoped subtree.
export interface IModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  /** Footer actions (usually composed app Buttons). */
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: IModalProps): React.ReactElement | null {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="theme-app fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-app-ink/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-app-card border border-app-hairline',
          'bg-app-card p-5 shadow-app-float',
          className
        )}
      >
        {title && (
          <div className="mb-2 flex items-start justify-between gap-4">
            <h2 className="app-h2 text-app-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="app-body shrink-0 rounded-app-control px-1 text-app-muted hover:text-app-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring"
            >
              ✕
            </button>
          </div>
        )}
        <div className="app-body text-app-body">{children}</div>
        {footer && <div className="mt-5 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
