'use client';

import React from 'react';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

export interface IInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: InputType;
  label?: string;
  error?: string | undefined;
  hint?: string | undefined;
}

export interface ITextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | undefined;
  hint?: string | undefined;
}

const baseInputClasses = [
  'w-full min-h-[44px] px-3 py-2 rounded-sm font-body text-t5',
  'bg-surface-raised text-fg placeholder:text-fg-subtle',
  'border border-border',
  'transition-all duration-150',
  'focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand',
  'disabled:opacity-40 disabled:cursor-not-allowed',
].join(' ');

export function Input({
  type = 'text',
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}: IInputProps): React.ReactElement {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="font-body text-t6 text-fg-muted">
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        type={type}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        aria-invalid={error ? true : undefined}
        className={[
          baseInputClasses,
          error ? 'border-danger focus:border-danger focus:ring-danger' : '',
          className,
        ].join(' ')}
      />
      {error && (
        <p id={`${inputId}-error`} className="font-body text-t6 text-danger" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="font-body text-t6 text-fg-subtle">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}: ITextareaProps): React.ReactElement {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="font-body text-t6 text-fg-muted">
          {label}
        </label>
      )}
      <textarea
        {...props}
        id={textareaId}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        aria-invalid={error ? true : undefined}
        className={[
          'w-full min-h-[120px] px-3 py-2 rounded-sm font-body text-t5 resize-y',
          'bg-surface-raised text-fg placeholder:text-fg-subtle',
          'border border-border',
          'transition-all duration-150',
          'focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          error ? 'border-danger focus:border-danger focus:ring-danger' : '',
          className,
        ].join(' ')}
      />
      {error && (
        <p id={`${textareaId}-error`} className="font-body text-t6 text-danger" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${textareaId}-hint`} className="font-body text-t6 text-fg-subtle">
          {hint}
        </p>
      )}
    </div>
  );
}
