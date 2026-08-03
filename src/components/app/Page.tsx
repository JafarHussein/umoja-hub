import * as React from 'react';
import { cn } from '@/lib/cn';

// App design-system page rhythm — the layout contract every dashboard screen
// is built on. Three pieces, in order of scale:
//
//   Page        the measure. Decides how wide the content is allowed to grow
//               and owns the vertical rhythm between top-level blocks.
//   PageHeader  the title band. One loud H1 per screen, an optional sentence
//               saying what the screen is for, and the screen's actions.
//   PageSection a labelled group inside the page.
//
// The shell (AppShell) owns the gutters; Page owns the measure and the gaps.
// Nothing here decorates — spacing and type carry the hierarchy.

type PageWidth = 'wide' | 'page' | 'focus' | 'prose';

const WIDTH: Record<PageWidth, string> = {
  // Dense analytics that genuinely need the room.
  wide: 'max-w-app-wide',
  // The default: tables, detail views, role hubs.
  page: 'max-w-app-page',
  // Forms and single-column decisions — one thing at a time.
  focus: 'max-w-app-focus',
  // Explanatory copy that must stay at a readable measure.
  prose: 'max-w-app-prose',
};

export interface IPageProps {
  width?: PageWidth;
  className?: string;
  children: React.ReactNode;
}

export function Page({
  width = 'page',
  className,
  children,
}: IPageProps): React.ReactElement {
  return (
    <div className={cn('mx-auto w-full space-y-10', WIDTH[width], className)}>{children}</div>
  );
}

export interface IPageHeaderProps {
  /** The one loud title on the screen. */
  title: React.ReactNode;
  /**
   * One sentence answering "what is this screen for?". Shown under the title
   * at a readable measure — this is the space that used to hold artwork.
   */
  description?: React.ReactNode;
  /** Small facts that qualify the title: counts, last-updated, scope. */
  meta?: React.ReactNode;
  /** Primary and secondary actions for the whole screen. */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  meta,
  actions,
  className,
}: IPageHeaderProps): React.ReactElement {
  return (
    <header
      className={cn(
        'flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8',
        className
      )}
    >
      <div className="min-w-0 space-y-2">
        <h1 className="app-h1 text-balance text-app-ink">{title}</h1>
        {description && (
          <p className="app-body max-w-app-prose text-pretty text-app-muted">{description}</p>
        )}
        {/* Facts are separated by a middot the header inserts itself, so callers
            list them without hand-punctuating a run of spans. */}
        {meta && (
          <div className="app-meta flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-app-faint [&>*+*]:before:mr-2 [&>*+*]:before:content-['·']">
            {meta}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">{actions}</div>
      )}
    </header>
  );
}

export interface IPageSectionProps {
  /** Section heading — quieter than the page title by a full step. */
  title?: React.ReactNode;
  /** One line of context for the section, when the heading isn't enough. */
  description?: React.ReactNode;
  /** Section-scoped actions, aligned with the heading. */
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function PageSection({
  title,
  description,
  actions,
  className,
  children,
}: IPageSectionProps): React.ReactElement {
  return (
    <section className={cn('space-y-5', className)}>
      {(title || actions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0 space-y-1.5">
            {title && <h2 className="app-h2 text-app-ink">{title}</h2>}
            {description && (
              <p className="app-body max-w-app-prose text-app-muted">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
