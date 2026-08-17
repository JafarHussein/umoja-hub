import * as React from 'react';
import { cn } from '@/lib/cn';

// App design-system Disclosure — glance, then detail.
//
// The foundation calls progressive disclosure "the universal mechanism" for
// reconciling a farmer who needs one sentence with an auditor who needs the
// provider's result code. The component library had no such primitive, which is
// why every detail screen ended up flat: with nowhere to put the second layer,
// transaction ids and provider names were laid out at the same level as the
// amount, and the screens read as a wall of equally important facts.
//
// Built on native <details>/<summary> deliberately. It is keyboard-operable,
// announced correctly by screen readers, and works before JavaScript loads —
// all of which a hand-rolled useState accordion has to re-earn, and usually
// does not. On a slow phone in Wajir the last of those is not academic.
//
// The marker is drawn with CSS on the summary, not an icon, so it costs nothing
// and cannot fall out of sync with the open state.

export interface IDisclosureProps {
  /** What is inside, named so it can be judged before it is opened. */
  summary: React.ReactNode;
  /**
   * A quiet count or qualifier set beside the summary — "6 events", "since
   * 23 Jul". Saves opening a section to find out whether it is worth opening.
   */
  hint?: React.ReactNode;
  /** Open on first render. Reserve for the one section that is usually wanted. */
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Disclosure({
  summary,
  hint,
  defaultOpen = false,
  className,
  children,
}: IDisclosureProps): React.ReactElement {
  return (
    <details
      className={cn('group border-t border-app-hairline', className)}
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary
        className={cn(
          // list-none + the ::-webkit marker reset removes the default triangle
          // so the chevron below is the only marker, in both engines.
          'flex cursor-pointer list-none items-center justify-between gap-4 py-4',
          'transition-colors duration-150 hover:text-app-ink',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring',
          '[&::-webkit-details-marker]:hidden'
        )}
      >
        <span className="app-body-strong min-w-0 text-app-ink">{summary}</span>
        <span className="flex shrink-0 items-center gap-3">
          {hint && <span className="app-meta text-app-faint">{hint}</span>}
          {/* Rotates to point down when open. Motion is a 150ms transform, which
              is the only job the foundation permits it here: state transition. */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className="shrink-0 text-app-muted transition-transform duration-150 group-open:rotate-90"
          >
            <path
              d="M4.5 2.5L8 6L4.5 9.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}
