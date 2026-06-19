import * as React from 'react';
import { cn } from '@/lib/cn';

// App design-system ChoiceCard — the selectable intent/role card (Figma ON-05
// Intent choice cards): radio-semantics card with title + description and an
// optional leading visual. Selected = brand surface + brand border. Against the
// `app` token group; 44px+ target (Foundation §4.4).
export interface IChoiceCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  /** Optional leading visual (illustration/avatar/icon). */
  visual?: React.ReactNode;
  className?: string;
}

export function ChoiceCard({
  title,
  description,
  selected,
  onSelect,
  visual,
  className,
}: IChoiceCardProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex min-h-[56px] w-full items-start gap-3 rounded-app-card border p-3 text-left',
        'transition-colors duration-150 ease-standard',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring',
        selected
          ? 'border-app-brand bg-app-brand-surface'
          : 'border-app-hairline bg-app-card hover:border-app-border-strong',
        className
      )}
    >
      {visual && <span className="shrink-0">{visual}</span>}
      <span className="flex flex-col gap-0.5">
        <span className={cn('app-title', selected ? 'text-app-brand' : 'text-app-ink')}>
          {title}
        </span>
        {description && (
          <span className="app-meta leading-snug text-app-muted">{description}</span>
        )}
      </span>
    </button>
  );
}
