import React from 'react';
import Link from 'next/link';
import { SectionAnchor, type AnchorSection } from '@/components/website/SectionAnchor';

interface GovernancePageProps {
  eyebrow: string;
  heading: string;
  intro: string;
  sections: AnchorSection[];
  ctaHref?: string;
  ctaLabel?: string;
  children: React.ReactNode;
}

export function GovernancePage({
  eyebrow,
  heading,
  intro,
  sections,
  ctaHref = '/contact',
  ctaLabel = 'Contact us',
  children,
}: GovernancePageProps): React.ReactElement {
  return (
    <>
      <header className="bg-ws-surface-dark border-b border-ws-border-dark">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-12 lg:pt-28 lg:pb-16">
          <p className="font-geist-mono text-ws-caption text-ws-text-faint uppercase mb-4">
            {eyebrow}
          </p>
          <h1 className="font-display text-display-3 lg:text-display-2 text-ws-text-bright mb-5 max-w-3xl">
            {heading}
          </h1>
          <p className="font-geist text-ws-body-lg text-ws-text-dim max-w-2xl leading-[1.7]">
            {intro}
          </p>
        </div>
      </header>

      {/* Tablet + mobile anchor nav — sticky, above the content flex layout */}
      <div className="xl:hidden px-6 md:px-0">
        <SectionAnchor sections={sections} />
      </div>

      {/* Content area */}
      <div className="bg-ws-surface-base">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="xl:flex xl:items-start xl:gap-16">
            {/* Desktop sidebar — xl only, inside the flex layout */}
            <div className="hidden xl:block">
              <SectionAnchor sections={sections} />
            </div>
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </div>
      </div>

      {/* CTA footer */}
      <section className="border-t border-ws-border-light bg-ws-surface-raised">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-geist text-ws-body text-ws-text-secondary max-w-md">
            Questions about this information? Contact us directly.
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center min-h-[44px] px-6 border border-ws-border-medium text-ws-text-secondary font-geist text-ws-body hover:border-ws-border-dark hover:text-ws-text-primary transition-colors duration-150 shrink-0"
          >
            {ctaLabel}
          </Link>
        </div>
      </section>
    </>
  );
}
