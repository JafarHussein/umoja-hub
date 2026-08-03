'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

// App design-system data display — how figures and facts are presented.
//
//   MetricGrid / MetricTile   the numbers a role checks first, each given
//                             enough room to be read at a glance.
//   DataList / DataItem       label→value pairs on detail screens, laid out
//                             so the values align and the labels recede.
//
// Both lean on the mono ramp (tabular figures) for anything numeric, so
// columns of numbers line up on the decimal without any extra work.

export interface IMetricGridProps {
  /** How many tiles sit on a row at the widest breakpoint. */
  columns?: 2 | 3 | 4;
  className?: string;
  children: React.ReactNode;
}

const METRIC_COLUMNS: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export function MetricGrid({
  columns = 3,
  className,
  children,
}: IMetricGridProps): React.ReactElement {
  return (
    <div className={cn('grid grid-cols-1 gap-4', METRIC_COLUMNS[columns], className)}>
      {children}
    </div>
  );
}

export interface IMetricTileProps {
  /** What the figure counts. */
  label: string;
  /** The figure itself. Pre-formatted — the tile does not do arithmetic. */
  value: React.ReactNode;
  /** Unit or qualifier, set beside the value at a quieter weight. */
  unit?: string;
  /**
   * One clause telling the user what to make of the figure. This is where a
   * dashboard stops being a wall of numbers and starts being useful.
   */
  caption?: React.ReactNode;
  /** Turns the whole tile into a link through to the detail behind it. */
  href?: string;
  /** Emphasis for the single figure that matters most on the screen. */
  emphasis?: boolean;
  className?: string;
}

export function MetricTile({
  label,
  value,
  unit,
  caption,
  href,
  emphasis = false,
  className,
}: IMetricTileProps): React.ReactElement {
  const body = (
    <>
      <p className="app-label text-app-muted">{label}</p>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span
          className={cn(
            emphasis ? 'app-data-xl' : 'app-data-l',
            emphasis ? 'text-app-brand' : 'text-app-ink'
          )}
        >
          {value}
        </span>
        {unit && <span className="app-meta text-app-faint">{unit}</span>}
      </p>
      {caption && <p className="app-meta mt-2 text-pretty text-app-muted">{caption}</p>}
    </>
  );

  const shell = cn(
    'rounded-app-card border border-app-hairline bg-app-card p-6',
    href &&
      'block transition-colors duration-150 ease-standard hover:border-app-border-strong hover:bg-app-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring',
    className
  );

  if (href) {
    return (
      <Link href={href} className={shell}>
        {body}
      </Link>
    );
  }
  return <div className={shell}>{body}</div>;
}

type DataListVariant = 'rows' | 'split';

// The list decides the layout; each item reads it rather than being told twice.
const DataListContext = React.createContext<DataListVariant>('split');

export interface IDataListProps {
  /**
   * `split` puts the label left and the value right across a hairline (detail
   * pages); `rows` stacks label above value in a grid (narrow columns).
   */
  variant?: DataListVariant;
  className?: string;
  children: React.ReactNode;
}

export function DataList({
  variant = 'split',
  className,
  children,
}: IDataListProps): React.ReactElement {
  return (
    <DataListContext.Provider value={variant}>
      <dl
        className={cn(
          variant === 'split'
            ? 'divide-y divide-app-hairline'
            : 'grid gap-6 sm:grid-cols-2',
          className
        )}
      >
        {children}
      </dl>
    </DataListContext.Provider>
  );
}

export interface IDataItemProps {
  label: string;
  children: React.ReactNode;
  /** Renders the value in the tabular mono ramp — use for money and counts. */
  numeric?: boolean;
  className?: string;
}

export function DataItem({
  label,
  children,
  numeric = false,
  className,
}: IDataItemProps): React.ReactElement {
  const variant = React.useContext(DataListContext);
  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        variant === 'split' && 'py-4 sm:flex-row sm:items-baseline sm:gap-6',
        className
      )}
    >
      <dt className="app-meta shrink-0 text-app-muted sm:w-52">{label}</dt>
      <dd className={cn('min-w-0 text-app-ink', numeric ? 'app-data-m' : 'app-body')}>
        {children}
      </dd>
    </div>
  );
}
