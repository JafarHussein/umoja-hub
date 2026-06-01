import React from 'react';
import Link from 'next/link';

export function RootProblemStatement(): React.ReactElement {
  return (
    <section className="bg-surface-primary pt-20 pb-16 lg:pt-28 lg:pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Why UmojaHub exists
        </p>

        <div className="max-w-3xl mb-12">
          <h1 className="font-heading text-[40px] leading-[44px] lg:text-display-xl font-semibold text-text-primary tracking-tight">
            Three structural failures. One platform built to address them.
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-zinc-800/50 mb-12">
          <div className="bg-surface-primary p-8 flex flex-col gap-4">
            <p className="font-mono text-t6 text-accent-green uppercase tracking-widest">
              The farmer problem
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              A smallholder farmer who consistently fulfils orders on time has no mechanism to prove
              that to a buyer in a different county who has never met them. The price they receive is
              quoted by traders who also control the price information — they cannot independently
              verify whether the offer reflects market demand. Their reliability exists only in
              informal memory. A new buyer cannot distinguish them from an unreliable farmer without
              a physical introduction or a trusted referral.
            </p>
          </div>
          <div className="bg-surface-primary p-8 flex flex-col gap-4">
            <p className="font-mono text-t6 text-accent-green uppercase tracking-widest">
              The buyer problem
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              A buyer who wants to purchase directly from a farmer — for freshness, lower cost, and
              accountability — has no searchable, verified directory of available produce. There is
              no public record of who has fulfilled orders reliably and who has not. Without that
              information, the only basis for choosing a farmer is price or referral. Neither scales.
              Most buyers end up purchasing through traders anyway — not because they prefer it, but
              because there is no reliable alternative.
            </p>
          </div>
          <div className="bg-surface-primary p-8 flex flex-col gap-4">
            <p className="font-mono text-t6 text-accent-green uppercase tracking-widest">
              The student problem
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              A Kenyan CS student who built real projects during their degree cannot prove the depth
              of their capability to an employer who does not know them. Their degree certifies which
              subjects they studied. A GitHub portfolio is self-reported — the code could have been
              copied, generated, or written without genuine problem-solving. Employers who have been
              misled before respond by discounting portfolios entirely, which advantages students
              from well-known universities regardless of actual capability.
            </p>
          </div>
        </div>

        <div className="max-w-prose border-l-2 border-accent-green pl-6">
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            UmojaHub was built to address these three specific failures. The Food Security Hub
            creates a public, verifiable record of farmer reliability — built from verified identity,
            completed transactions, and independently submitted buyer ratings. The Education Hub
            creates a public, verifiable record of student capability — built from structured
            documentation reviewed by verified lecturers against defined criteria. In both cases,
            the purpose is the same: to make trust verifiable where it previously was not.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/for/farmers"
              className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
            >
              For farmers
            </Link>
            <Link
              href="/for/students"
              className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
            >
              For students
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
