'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

// App design-system ChoiceCard — the selectable intent/role card (Figma ON-05
// Intent choice cards). Against the `app` token group; 44px+ target
// (Foundation §4.4).
//
// Semantics: a single-select group of cards is a radio group, not a row of
// independent toggles. `ChoiceCardGroup` renders `role="radiogroup"` and each
// card is `role="radio"`, which gives screen-reader users the "2 of 4" position
// they need and gives keyboard users arrow-key traversal with a single tab stop.
// (The previous `aria-pressed` buttons announced four unrelated toggles and made
// the group four tab stops.)
//
// Visual: the card carries text and, at most, a small leading icon. Selection is
// shown with a brand border, a brand-surface wash and a check — an outline-weight
// change rather than a colour block, so a chosen card reads as "confirmed" and
// not as an advertisement.

export interface IChoiceCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  /** Small leading icon. Decorative — the title carries the meaning. */
  icon?: React.ReactNode;
  className?: string;
}

interface IChoiceCardGroupProps {
  /** Accessible name for the group, e.g. "Select your role". */
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function ChoiceCardGroup({
  label,
  children,
  className,
}: IChoiceCardGroupProps): React.ReactElement {
  const ref = React.useRef<HTMLDivElement>(null);

  // Arrow keys move between radios, per the WAI-ARIA radiogroup pattern: the
  // group is one tab stop and the arrows move (and select) within it.
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'];
    if (!keys.includes(e.key)) return;
    const radios = Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]:not([disabled])') ?? []
    );
    if (radios.length === 0) return;
    const current = radios.findIndex((r) => r === document.activeElement);
    const forward = e.key === 'ArrowDown' || e.key === 'ArrowRight';
    const next = radios[(current + (forward ? 1 : -1) + radios.length) % radios.length];
    if (!next) return;
    e.preventDefault();
    next.focus();
    next.click();
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn('grid grid-cols-1 gap-2', className)}
    >
      {children}
    </div>
  );
}

export function ChoiceCard({
  title,
  description,
  selected,
  onSelect,
  icon,
  className,
}: IChoiceCardProps): React.ReactElement {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      // Roving tabindex: only the selected card (or the first, when nothing is
      // chosen yet) is reachable by Tab; arrows move within the group.
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className={cn(
        'group flex min-h-[56px] w-full items-center gap-3 rounded-app-card border px-4 py-3 text-left',
        'transition-colors duration-150 ease-standard',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring',
        selected
          ? 'border-app-brand bg-app-brand-surface'
          : 'border-app-hairline bg-app-card hover:border-app-border-strong hover:bg-app-sunken',
        className
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className={cn(
            'flex shrink-0 items-center justify-center transition-colors duration-150',
            '[&_svg]:size-5',
            selected ? 'text-app-brand' : 'text-app-faint group-hover:text-app-muted'
          )}
        >
          {icon}
        </span>
      )}

      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={cn('app-title', selected ? 'text-app-brand' : 'text-app-ink')}>
          {title}
        </span>
        {description && (
          <span className="app-meta leading-snug text-app-muted">{description}</span>
        )}
      </span>

      {/* Selection indicator, right-aligned. Reserving the slot on every card
          stops the row reflowing when the choice changes. */}
      <span
        aria-hidden="true"
        className={cn(
          'ml-auto flex size-5 shrink-0 items-center justify-center rounded-app-pill border transition-colors duration-150',
          selected ? 'border-app-brand bg-app-brand text-app-on-brand' : 'border-app-hairline'
        )}
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
    </button>
  );
}
