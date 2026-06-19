import * as React from 'react';
import { cn } from '@/lib/cn';

// App design-system Table — semantic, composable (Figma "Table row" 260:10).
// Card-framed; header in app-label, rows with a bottom hairline + hover; figure
// cells use the mono ramp (caller adds `.app-data-m` / `text-right`). Against
// the `app` token group.

export function Table({
  className,
  children,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
      <table className={cn('w-full border-collapse', className)} {...props}>
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
      className={cn('app-label px-4 py-3 text-left text-app-muted', className)}
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
    <td className={cn('app-body px-4 py-3 text-app-body', className)} {...props}>
      {children}
    </td>
  );
}
