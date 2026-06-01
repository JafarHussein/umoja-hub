import React from 'react';
import Link from 'next/link';

export function HeroPlatformStatement(): React.ReactElement {
  return (
    <section className="bg-surface-primary pt-20 pb-16 lg:pt-28 lg:pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-5">
            Food Security Hub · Education Hub
          </p>
          <h1 className="font-heading text-[40px] leading-[44px] lg:text-display-xl font-semibold text-text-primary tracking-tight mb-6">
            A verified agricultural marketplace and education platform for East Africa
          </h1>
          <div className="max-w-prose space-y-4 mb-10">
            <p className="font-body text-t4 text-text-secondary">
              The Food Security Hub connects verified farmers with buyers who pay by M-Pesa. Each
              farmer is document-verified before their listings appear. Each transaction is recorded
              and contributes to a trust score.
            </p>
            <p className="font-body text-t4 text-text-secondary">
              The Education Hub gives CS students a structured project pipeline — brief generation,
              process documentation, peer review, and verified lecturer decision. Completed projects
              appear on a shareable public portfolio.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
            >
              Browse marketplace
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
            >
              How it works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
