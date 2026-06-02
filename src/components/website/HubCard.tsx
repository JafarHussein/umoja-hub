import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

interface HubCardProps {
  hub: 'food' | 'education' | 'governance';
  label: string;
  name: string;
  audiences: string[];
  href: string;
  className?: string;
}

export function HubCard({
  hub,
  label,
  name,
  audiences,
  href,
  className,
}: HubCardProps): React.ReactElement {
  const borderHover =
    hub === 'food'
      ? 'hover:border-ws-hub-green'
      : hub === 'education'
      ? 'hover:border-ws-hub-blue'
      : 'hover:border-ws-border-medium';

  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col gap-3 border border-ws-border-light bg-ws-surface-base p-5 transition-colors duration-150',
        borderHover,
        className
      )}
    >
      <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase">{label}</p>

      <div className="flex items-start justify-between gap-3">
        <p className="font-geist text-[17px] leading-[1.4] font-semibold text-ws-text-primary">
          {name}
        </p>
        <span
          className="font-geist-mono text-ws-caption text-ws-text-tertiary shrink-0 mt-0.5 group-hover:text-ws-text-primary transition-colors duration-150"
          aria-hidden
        >
          →
        </span>
      </div>

      <ul className="flex flex-col gap-1">
        {audiences.map((audience) => (
          <li
            key={audience}
            className="font-geist text-ws-body-sm text-ws-text-secondary"
          >
            {audience}
          </li>
        ))}
      </ul>
    </Link>
  );
}
