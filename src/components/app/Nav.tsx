import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

// App design-system NavItem — sidebar nav item (Figma "Nav item" 259:8).
// Active = brand-surface pill + brand text + heavier weight; default = muted,
// hover sunken. The weight shift matters: the active item stays legible as the
// current one without colour doing the work alone, which keeps the sidebar
// quiet while still being unambiguous. Against the `app` token group; 44px
// target.
export interface INavItemProps {
  href: string;
  label: string;
  active?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function NavItem({
  href,
  label,
  active = false,
  icon,
  className,
}: INavItemProps): React.ReactElement {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'app-nav flex min-h-[44px] items-center gap-3 rounded-app-control px-3',
        'transition-colors duration-150 ease-standard',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring',
        active
          ? 'bg-app-brand-surface font-semibold text-app-brand'
          : 'text-app-muted hover:bg-app-sunken hover:text-app-ink',
        className
      )}
    >
      {icon && (
        <span aria-hidden className="flex size-5 shrink-0 items-center justify-center">
          {icon}
        </span>
      )}
      {label}
    </Link>
  );
}
