import * as React from 'react';
import { cn } from '@/lib/cn';

// App design-system form rhythm. A form is a sequence of small decisions, and
// the layout should let the user finish one before starting the next.
//
//   Form         the outer stack. Puts real distance between sections.
//   FormSection  a group of related fields under a heading, separated from
//                the group before it by a hairline and a wide gap — the pause
//                that stops a long form reading as a wall.
//   FormRow      two fields that belong side by side (from/to, county/town).
//   FormActions  submit and cancel, set apart from the last field so nobody
//                clicks one while aiming for the other.

export interface IFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export function Form({ className, children, ...props }: IFormProps): React.ReactElement {
  return (
    <form className={cn('space-y-10', className)} {...props}>
      {children}
    </form>
  );
}

export interface IFormSectionProps {
  /** What this group of fields is about. */
  title?: string;
  /**
   * One sentence on why the fields are being asked for. Answering that before
   * the user wonders is what makes a long form feel considerate.
   */
  description?: string;
  /** Draws the separating rule above the section. Off for the first section. */
  divided?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormSection({
  title,
  description,
  divided = true,
  className,
  children,
}: IFormSectionProps): React.ReactElement {
  return (
    <section
      className={cn(divided && 'border-t border-app-hairline pt-8 first:border-0 first:pt-0', className)}
    >
      {(title || description) && (
        <div className="mb-6 max-w-app-prose space-y-1.5">
          {title && <h2 className="app-title text-app-ink">{title}</h2>}
          {description && <p className="app-body text-app-muted">{description}</p>}
        </div>
      )}
      <div className="space-y-6">{children}</div>
    </section>
  );
}

export interface IFormRowProps {
  className?: string;
  children: React.ReactNode;
}

export function FormRow({ className, children }: IFormRowProps): React.ReactElement {
  return (
    <div className={cn('grid gap-6 sm:grid-cols-2', className)}>{children}</div>
  );
}

export interface IFormActionsProps {
  /** A last word before committing — what happens next, or what this costs. */
  note?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function FormActions({
  note,
  className,
  children,
}: IFormActionsProps): React.ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-t border-app-hairline pt-8 sm:flex-row-reverse sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-3">{children}</div>
      {note && <p className="app-meta max-w-app-prose text-app-muted">{note}</p>}
    </div>
  );
}
