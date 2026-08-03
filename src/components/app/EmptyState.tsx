import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

// App design-system EmptyState — what a screen says when it has nothing to
// show yet. Deliberately artwork-free: an empty screen is the best moment to
// explain the product, so the space carries a heading, a sentence that says
// what will appear here and why, the action that fills it, and — where it
// helps — the next steps the user could take instead.
//
// Left-aligned on purpose. It sits on the same grid as the rest of the page,
// so an empty screen reads as a considered state rather than a hole.

export interface IEmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface IEmptyStateHint {
  label: string;
  href: string;
  /** One clause on why this is worth doing. */
  description?: string;
}

export interface IEmptyStateProps {
  /** What is (not) here, stated plainly. */
  title: string;
  /**
   * What will appear in this space once it exists, and what puts it there.
   * Write it as a full sentence — this is the screen explaining itself.
   */
  description: string;
  action?: IEmptyStateAction;
  secondaryAction?: IEmptyStateAction;
  /** Related shortcuts, so the user is never stuck on a dead end. */
  hints?: IEmptyStateHint[];
  /** Label above the hint list. */
  hintsLabel?: string;
  className?: string;
}

function ActionButton({
  action,
  variant,
}: {
  action: IEmptyStateAction;
  variant: 'primary' | 'secondary';
}): React.ReactElement {
  const classes = cn(
    'app-body-strong inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-app-control px-4',
    'transition-colors duration-150 ease-standard',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring',
    variant === 'primary'
      ? 'bg-app-brand text-app-on-brand hover:bg-app-brand-hover'
      : 'border border-app-border-strong bg-app-card text-app-ink hover:bg-app-sunken'
  );

  if (action.href) {
    return (
      <Link href={action.href} className={classes}>
        {action.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={classes}>
      {action.label}
    </button>
  );
}

export function EmptyState({
  title,
  description,
  action,
  secondaryAction,
  hints,
  hintsLabel = 'You could also',
  className,
}: IEmptyStateProps): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-app-card border border-app-hairline bg-app-card px-6 py-10 sm:px-10 sm:py-12',
        className
      )}
    >
      <div className="max-w-app-prose space-y-3">
        <h2 className="app-h2 text-app-ink">{title}</h2>
        <p className="app-body text-pretty text-app-muted">{description}</p>
      </div>

      {(action || secondaryAction) && (
        <div className="mt-7 flex flex-wrap items-center gap-3">
          {action && <ActionButton action={action} variant="primary" />}
          {secondaryAction && <ActionButton action={secondaryAction} variant="secondary" />}
        </div>
      )}

      {hints && hints.length > 0 && (
        <div className="mt-10 border-t border-app-hairline pt-6">
          <p className="app-label text-app-faint">{hintsLabel}</p>
          <ul className="mt-3 space-y-2.5">
            {hints.map((hint) => (
              <li key={hint.href}>
                <Link
                  href={hint.href}
                  className="group flex items-baseline gap-2 rounded-app-control transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring"
                >
                  <span className="app-body-strong text-app-brand group-hover:text-app-brand-hover">
                    {hint.label}
                  </span>
                  {hint.description && (
                    <span className="app-meta text-app-muted">{hint.description}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
