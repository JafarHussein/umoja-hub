'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

// Two ways to pick several things, chosen by how many things there are.
//
// `ChipGroup` lays every option out and lets you toggle it. Fastest when the
// list is short enough to read at a glance (the ten produce categories), and it
// shows what is on offer without a click.
//
// `TokenSelect` hides the options behind a dropdown and shows only what you have
// chosen. Right when the list is long (the 47 counties), where laying it all out
// would bury the rest of the form.
//
// Both are multi-select, so unlike ChoiceCard these are toggle semantics
// (`aria-pressed` / a labelled remove button), not radio semantics.

const chipBase =
  'app-meta inline-flex min-h-[36px] items-center gap-1.5 rounded-app-pill border px-3 py-1.5 ' +
  'transition-colors duration-150 ease-standard ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring';

export interface IChipGroupProps {
  label: string;
  hint?: string | undefined;
  options: readonly { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  error?: string | undefined;
}

export function ChipGroup({
  label,
  hint,
  options,
  selected,
  onToggle,
  error,
}: IChipGroupProps): React.ReactElement {
  return (
    <fieldset>
      <legend className="app-label mb-1 text-app-body">{label}</legend>
      {hint && <p className="app-meta mb-2 text-app-faint">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map(({ value, label: optionLabel }) => {
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(value)}
              className={cn(
                chipBase,
                isSelected
                  ? 'border-app-brand bg-app-brand-surface text-app-brand'
                  : 'border-app-hairline bg-app-card text-app-muted hover:border-app-border-strong hover:text-app-ink'
              )}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="app-meta mt-2 text-app-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export interface ITokenSelectProps {
  id: string;
  label: string;
  hint?: string | undefined;
  placeholder: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  error?: string | undefined;
}

export function TokenSelect({
  id,
  label,
  hint,
  placeholder,
  options,
  selected,
  onChange,
  error,
}: ITokenSelectProps): React.ReactElement {
  // Only offer what has not been picked, so the dropdown shrinks as the list of
  // chips grows and a value can never be added twice.
  const remaining = options.filter((o) => !selected.includes(o));

  return (
    <div>
      <label htmlFor={id} className="app-label mb-1 block text-app-body">
        {label}
      </label>
      {hint && <p className="app-meta mb-2 text-app-faint">{hint}</p>}

      <select
        id={id}
        value=""
        disabled={remaining.length === 0}
        onChange={(e) => {
          if (e.target.value) onChange([...selected, e.target.value]);
        }}
        className={cn(
          'app-body h-11 w-full rounded-app-control border bg-app-card px-3 text-app-ink',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring',
          'disabled:opacity-50',
          error ? 'border-app-danger' : 'border-app-border-strong'
        )}
      >
        <option value="">{remaining.length === 0 ? 'All added' : placeholder}</option>
        {remaining.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      {selected.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {selected.map((value) => (
            <li key={value}>
              <button
                type="button"
                onClick={() => onChange(selected.filter((v) => v !== value))}
                className={cn(chipBase, 'border-app-brand bg-app-brand-surface text-app-brand')}
              >
                {value}
                <X className="size-3.5" aria-hidden="true" />
                <span className="sr-only">Remove {value}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="app-meta mt-2 text-app-danger">
          {error}
        </p>
      )}
    </div>
  );
}
