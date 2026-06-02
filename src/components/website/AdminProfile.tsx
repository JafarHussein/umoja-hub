import React from 'react';
import Link from 'next/link';

interface AdminProfileProps {
  name: string;
  title: string;
  background: string;
  reviewScope: string;
  activeSince: string;
  criteriaHref?: string;
  className?: string;
}

export function AdminProfile({
  name,
  title,
  background,
  reviewScope,
  activeSince,
  criteriaHref,
  className,
}: AdminProfileProps): React.ReactElement {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={`border border-ws-border-light bg-ws-surface-base p-5 flex flex-col gap-4 ${className ?? ''}`}>
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-sm bg-ws-surface-dark-2 flex items-center justify-center shrink-0"
          aria-hidden
        >
          <span className="font-geist-mono text-[16px] leading-none font-medium text-ws-text-dim">
            {initial}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="font-geist text-ws-label font-semibold text-ws-text-primary">{name}</p>
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase">
            {title}
          </p>
        </div>
      </div>

      <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-relaxed">
        {background}
      </p>

      <div className="flex flex-col gap-1.5 border-t border-ws-border-light pt-3">
        <div className="flex items-baseline gap-2">
          <span className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase shrink-0">
            Review scope
          </span>
          <span className="font-geist text-ws-body-sm text-ws-text-secondary">{reviewScope}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase shrink-0">
            Active since
          </span>
          <span className="font-geist text-ws-body-sm text-ws-text-secondary">{activeSince}</span>
        </div>
        {criteriaHref && (
          <Link
            href={criteriaHref}
            className="font-geist-mono text-ws-caption text-ws-hub-green hover:opacity-80 transition-opacity duration-150 mt-0.5"
          >
            View criteria applied →
          </Link>
        )}
      </div>
    </div>
  );
}
