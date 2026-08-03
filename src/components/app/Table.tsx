import * as React from 'react';
import { cn } from '@/lib/cn';

// App design-system Table — semantic, composable (Figma "Table row" 260:10).
// Card-framed; header in app-label, rows with a bottom hairline + hover; figure
// cells use the mono ramp (caller adds `.app-data-m` / `text-right`). Against
// the `app` token group.
//
// Density is deliberate: rows are 56px tall and the outer columns carry a
// wider gutter than the inner ones, so a table reads as a set of records with
// air around them rather than a spreadsheet pushed against its frame. Wide
// tables scroll inside their own frame — the page never scrolls sideways.

export interface ITableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /**
   * `fixed` honours the widths set on each `TH`, so the slack in a table is
   * shared out deliberately instead of being swallowed by whichever column
   * happens to hold the longest string. Use it — with a width on every header —
   * for any table wide enough that auto layout leaves a void mid-row.
   */
  layout?: 'auto' | 'fixed';
}

export function Table({
  layout = 'auto',
  className,
  children,
  ...props
}: ITableProps): React.ReactElement {
  return (
    <div className="overflow-x-auto rounded-app-card border border-app-hairline bg-app-card">
      <table
        className={cn('w-full border-collapse', layout === 'fixed' && 'table-fixed', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>): React.ReactElement {
  return (
    <thead {...props}>
      <tr className="border-b border-app-hairline">{children}</tr>
    </thead>
  );
}

export function TH({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>): React.ReactElement {
  return (
    <th
      className={cn(
        'app-label whitespace-nowrap px-5 py-4 text-left text-app-muted first:pl-6 last:pr-6',
        className
      )}
      scope="col"
      {...props}
    >
      {children}
    </th>
  );
}

export function TR({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>): React.ReactElement {
  return (
    <tr
      className={cn(
        'border-b border-app-hairline transition-colors duration-150 last:border-0 hover:bg-app-sunken',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TD({
  className,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>): React.ReactElement {
  return (
    <td
      className={cn('app-body px-5 py-4 text-app-body first:pl-6 last:pr-6', className)}
      {...props}
    >
      {children}
    </td>
  );
}
