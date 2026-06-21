import * as React from 'react';
import { cn } from '@/lib/cn';

// App design-system Tabs — controlled (Figma "Tab" 259:15). Active = brand
// underline. Against the `app` token group; 44px target.
export function Tabs({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      role="tablist"
      className={cn('flex items-center gap-1 border-b border-app-hairline', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ITabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Tab({
  active = false,
  className,
  children,
  ...props
}: ITabProps): React.ReactElement {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        'app-nav -mb-px flex min-h-[44px] items-center border-b-2 px-3',
        'transition-colors duration-150 ease-standard',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring',
        active
          ? 'border-app-brand text-app-ink'
          : 'border-transparent text-app-muted hover:text-app-ink',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
