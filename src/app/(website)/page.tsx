import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';

export const metadata: Metadata = {
  title: 'UmojaHub — Food Security & Education Infrastructure',
  description:
    'Verified infrastructure connecting farmers to buyers and giving CS students a portfolio that employers can independently verify. Built on a transparent trust system.',
};

const AUDIENCE_CARDS = [
  {
    role: 'Farmer',
    description: 'Sell verified produce to buyers who pay through M-Pesa. Your Trust Score travels with every listing.',
    href: '/for/farmers',
    accent: 'teal',
  },
  {
    role: 'Student',
    description: 'Build a portfolio of real projects. Each entry is cryptographically hashed and reviewed by a verified lecturer.',
    href: '/for/students',
    accent: 'violet',
  },
  {
    role: 'Buyer',
    description: 'Browse a verified-only marketplace. Every listing carries a Trust Score you can read before you pay.',
    href: '/for/buyers',
    accent: 'copper',
  },
  {
    role: 'Employer',
    description: 'Review student portfolios built on verifiable evidence — without registering or paying.',
    href: '/for/employers',
    accent: 'teal',
  },
  {
    role: 'Lecturer',
    description: 'Review student project submissions and sign off on evidence you can stand behind.',
    href: '/for/lecturers',
    accent: 'violet',
  },
  {
    role: 'Cooperative',
    description: 'Pool orders across your farmer group and access bulk purchasing at verified prices.',
    href: '/for/cooperatives',
    accent: 'copper',
  },
] as const;

const TRUST_STATS = [
  { label: 'Verification layers', value: '3' },
  { label: 'Trust Score factors', value: '4' },
  { label: 'Days to verification decision', value: '≤30' },
  { label: 'Verification methodology', value: 'Public' },
] as const;

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl text-center">
          <AnimateIn>
            <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-ws-surface-primary border border-ws-border-soft font-ibm-mono text-ws-meta text-teal mb-8">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal" />
              Verified infrastructure — East Africa
            </p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="text-ws-display font-jakarta font-800 text-ws-text-heading tracking-[-0.03em] leading-[1.05]">
              Food Security and Education,{' '}
              <span className="text-copper">Built on Verified Trust</span>
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mt-6 text-ws-body font-jakarta text-ws-text-secondary max-w-2xl mx-auto leading-[1.6]">
              UmojaHub connects verified Kenyan farmers with buyers and gives CS students a portfolio
              that employers can independently verify — built on a transparent, auditable trust
              system.
            </p>
          </AnimateIn>
          <AnimateIn delay={0.24}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/for/farmers"
                className="inline-flex items-center px-6 py-3 bg-copper text-white font-jakarta font-600 text-[1rem] rounded-sm hover:bg-[#A05A30] active:scale-[0.98] transition-all duration-fast ease-standard"
              >
                Food Security Hub →
              </Link>
              <Link
                href="/education"
                className="inline-flex items-center px-6 py-3 border border-ws-border-default text-ws-text-heading font-jakarta font-600 text-[1rem] rounded-sm hover:bg-ws-surface-primary hover:border-ws-border-soft transition-all duration-standard ease-standard"
              >
                Education Hub →
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── Trust stats bar ── */}
      <AnimateIn>
        <section className="border-y border-ws-border-soft bg-ws-surface-primary py-8 px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {TRUST_STATS.map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="font-ibm-mono text-[2rem] font-400 text-ws-text-heading">{value}</p>
                  <p className="mt-1 font-jakarta text-ws-meta text-ws-text-secondary">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimateIn>

      {/* ── For Your Role ── */}
      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <div className="mb-12">
              <p className="font-ibm-mono text-ws-meta text-teal mb-3">Who is this for?</p>
              <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading">
                Everyone in the ecosystem
              </h2>
              <p className="mt-3 text-ws-body font-jakarta text-ws-text-secondary max-w-xl">
                Six roles. One trust system. Each participant builds and benefits from verified
                infrastructure.
              </p>
            </div>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUDIENCE_CARDS.map((card, i) => (
              <AnimateIn key={card.role} delay={i * 0.08}>
                <Link
                  href={card.href}
                  className="group block p-6 bg-ws-surface-primary border border-ws-border-soft rounded-sm hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] transition-all duration-standard ease-standard"
                >
                  <p
                    className={`font-ibm-mono text-ws-meta mb-3 ${
                      card.accent === 'teal'
                        ? 'text-teal'
                        : card.accent === 'violet'
                          ? 'text-violet'
                          : 'text-copper'
                    }`}
                  >
                    {card.role}
                  </p>
                  <p className="font-jakarta text-ws-body text-ws-text-body leading-[1.6]">
                    {card.description}
                  </p>
                  <p className="mt-4 font-jakarta text-ws-meta font-600 text-ws-text-heading group-hover:text-copper transition-colors duration-fast ease-standard">
                    Learn more →
                  </p>
                </Link>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform overview CTA ── */}
      <AnimateIn>
        <section className="py-24 px-6 lg:px-8 bg-ws-text-heading">
          <div className="mx-auto max-w-4xl text-center">
            <p className="font-ibm-mono text-ws-meta text-teal-dark mb-4">How it works</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-[#F2F0EC] leading-[1.15]">
              Two hubs. One trust system.
            </h2>
            <p className="mt-4 text-ws-body font-jakarta text-[#A9A29A] max-w-2xl mx-auto leading-[1.6]">
              The Food Security Hub verifies farmers and connects them to buyers. The Education Hub
              verifies student work and connects graduates to employers. Both run on the same
              transparent verification spine.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/how-it-works"
                className="inline-flex items-center px-6 py-3 bg-copper text-white font-jakarta font-600 text-[1rem] rounded-sm hover:bg-[#D88A5A] active:scale-[0.98] transition-all duration-fast ease-standard"
              >
                See how it works →
              </Link>
              <Link
                href="/trust"
                className="inline-flex items-center px-6 py-3 border border-[#39414A] text-[#D6D1CB] font-jakarta font-600 text-[1rem] rounded-sm hover:border-[#49515A] transition-all duration-standard ease-standard"
              >
                Read the methodology
              </Link>
            </div>
          </div>
        </section>
      </AnimateIn>
    </>
  );
}
