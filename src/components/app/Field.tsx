import * as React from 'react';
import { cn } from '@/lib/cn';

// App design-system form fields — mirror of Figma "Input" (258:18):
// State Default · Focus (brand 2px) · Error (danger) · Disabled, label above
// the field. Input / Textarea / Select share one FieldShell (label + error +
// hint) so the whole form reads consistently. Against the `app` token group.

const fieldBase = [
  'app-body w-full min-h-[46px] px-3.5 py-2.5 rounded-app-control',
  'bg-app-card text-app-ink placeholder:text-app-faint',
  'border border-app-border-strong',
  'transition-colors duration-150 ease-standard',
  'focus:outline-none focus:border-app-brand focus:ring-2 focus:ring-app-brand/30',
  'disabled:bg-app-sunken disabled:text-app-muted disabled:cursor-not-allowed',
].join(' ');

const fieldError = 'border-app-danger focus:border-app-danger focus:ring-app-danger/30';

interface IFieldShellProps {
  id: string;
  label?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  optional?: boolean | undefined;
  children: React.ReactNode;
}

function FieldShell({
  id,
  label,
  error,
  hint,
  optional,
  children,
}: IFieldShellProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="app-label flex items-baseline gap-2 text-app-body">
          {label}
          {/* Marked, not announced. Written into the label rather than appended
              as "(optional)" text so a column of optional fields reads as a calm
              list instead of four shouted repetitions of the same word. */}
          {optional && <span className="app-meta font-normal text-app-faint">Optional</span>}
        </label>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="app-meta text-app-danger" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="app-meta text-app-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

function useFieldId(label?: string, id?: string): string {
  const generated = React.useId();
  return id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? generated;
}

export interface IInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | undefined;
  hint?: string | undefined;
  optional?: boolean | undefined;
}

export function Input({
  label,
  error,
  hint,
  optional,
  id,
  className,
  ...props
}: IInputProps): React.ReactElement {
  const fieldId = useFieldId(label, id);
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} optional={optional}>
      <input
        {...props}
        id={fieldId}
        aria-describedby={describedBy(fieldId, error, hint)}
        aria-invalid={error ? true : undefined}
        className={cn(fieldBase, error && fieldError, className)}
      />
    </FieldShell>
  );
}

export interface ITextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | undefined;
  hint?: string | undefined;
  optional?: boolean | undefined;
}

export function Textarea({
  label,
  error,
  hint,
  optional,
  id,
  className,
  ...props
}: ITextareaProps): React.ReactElement {
  const fieldId = useFieldId(label, id);
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} optional={optional}>
      <textarea
        {...props}
        id={fieldId}
        aria-describedby={describedBy(fieldId, error, hint)}
        aria-invalid={error ? true : undefined}
        className={cn(fieldBase, 'min-h-[120px] resize-y', error && fieldError, className)}
      />
    </FieldShell>
  );
}

export interface ISelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | undefined;
  hint?: string | undefined;
  optional?: boolean | undefined;
}

export function Select({
  label,
  error,
  hint,
  optional,
  id,
  className,
  children,
  ...props
}: ISelectProps): React.ReactElement {
  const fieldId = useFieldId(label, id);
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} optional={optional}>
      <select
        {...props}
        id={fieldId}
        aria-describedby={describedBy(fieldId, error, hint)}
        aria-invalid={error ? true : undefined}
        className={cn(fieldBase, error && fieldError, className)}
      >
        {children}
      </select>
    </FieldShell>
  );
}
