import React from 'react';
import Link from 'next/link';
import { SectionAnchor, type AnchorSection } from '@/components/website/SectionAnchor';

interface AudiencePageProps {
  eyebrow: string;
  heading: string;
  intro: string;
  sections: AnchorSection[];
  registerHref?: string;
  registerLabel?: string;
  children: React.ReactNode;
}

export function AudiencePage({
  eyebrow,
  heading,
  intro,
  sections,
  registerHref = '/auth/register',
  registerLabel = 'Create an account',
  children,
}: AudiencePageProps): React.ReactElement {
  return (
    <>
      {/* Hero */}
      <section className="bg-surface-primary pt-20 pb-10 lg:pt-28 lg:pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
            {eyebrow}
          </p>
          <h1 className="font-heading text-[32px] leading-[38px] lg:text-display-lg font-semibold text-text-primary tracking-tight mb-4 max-w-3xl">
            {heading}
          </h1>
          <p className="font-body text-t4 text-text-secondary max-w-2xl">{intro}</p>
        </div>
      </section>

      {/* Main content with sidebar */}
      <div className="bg-surface-primary">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="xl:flex xl:items-start xl:gap-16">
            <SectionAnchor sections={sections} />
            <div className="min-w-0 flex-1 divide-y divide-zinc-800/50">{children}</div>
          </div>
        </div>
      </div>

      {/* Register CTA — tertiary, not dominant */}
      <section className="border-t border-zinc-800/50 bg-surface-elevated">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-body text-t4 text-text-secondary max-w-md">
            Ready to start? Create an account and complete the verification process.
          </p>
          <Link
            href={registerHref}
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-accent-green/50 hover:text-text-primary shrink-0"
          >
            {registerLabel}
          </Link>
        </div>
      </section>
    </>
  );
}
