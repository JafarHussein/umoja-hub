import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';

export const metadata: Metadata = {
  title: 'For Employers — Education Hub · UmojaHub',
  description:
    'Verify student portfolios built on real, assessed evidence — without registering or paying. Every entry is cryptographically locked and reviewed by a named lecturer.',
};

const VERIFICATION_CHAIN = [
  {
    step: 'Student submits',
    detail: 'Three documents uploaded and SHA-256 hashed before review begins.',
  },
  {
    step: 'Lecturer reviews',
    detail:
      "A named, verified lecturer from the student's institution assesses against a published rubric.",
  },
  {
    step: 'Platform anchors',
    detail: 'On approval, the hash and reviewer identity are recorded. Neither can be altered.',
  },
  {
    step: 'You verify',
    detail:
      'View the public portfolio entry. The hash is visible — re-compute from the submitted files to confirm authenticity independently.',
  },
] as const;

const INDEPENDENTLY_VERIFIABLE = [
  "The reviewer's institutional identity — their name and role are listed on the entry",
  "The submission hash — compute it yourself from the student's documents to confirm integrity",
  'The review rubric — published publicly, the same rubric applied to every submission',
  'The decision date — when the verification was issued and by whom',
] as const;

const IS_NOT_ITEMS = [
  'A reference that can be influenced by the student after submission',
  'A self-certified course certificate',
  'A portfolio the student can edit after verification',
  'A placement or recruitment service',
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';

export default function ForEmployersPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} max-w-4xl py-24`}>
          <AnimateIn>
            <p className="mb-4 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand-text">
              Education Hub — Employers
            </p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-fg md:text-5xl">
              Portfolio verification you can check{' '}
              <span className="text-brand-text">without asking the student</span>
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              Every portfolio entry on UmojaHub has been reviewed by a verified lecturer and
              cryptographically anchored. You can verify the submission hash and reviewer identity
              independently — without registering, contacting the student, or paying.
            </p>
          </AnimateIn>
          <AnimateIn delay={0.24}>
            <Link
              href="/knowledge"
              className="mt-8 inline-flex items-center rounded-sm border border-border-strong px-6 py-3 font-medium text-fg transition-all duration-standard ease-standard hover:bg-surface"
            >
              Read how verification works
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* ── Verification chain ── */}
      <section className="border-y border-border bg-surface-sunken">
        <div className={`${CONTAINER} py-24`}>
          <AnimateIn>
            <p className="mb-3 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              The chain of evidence
            </p>
            <h2 className="mb-12 text-3xl font-semibold tracking-tight text-fg md:text-4xl">
              Four steps from submission to your desk
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VERIFICATION_CHAIN.map((item, i) => (
              <AnimateIn key={item.step} delay={i * 0.08}>
                <div className="rounded-sm border border-border bg-surface p-6">
                  <p className="mb-2 font-ibm-mono text-xs text-brand">0{i + 1}</p>
                  <p className="mb-3 font-semibold text-fg">{item.step}</p>
                  <p className="text-sm leading-relaxed text-fg-muted">{item.detail}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Independently verifiable ── */}
      <section className="bg-background">
        <div className={`${CONTAINER} py-24`}>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <AnimateIn>
              <p className="mb-5 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
                Independently verifiable
              </p>
              <ul className="space-y-4">
                {INDEPENDENTLY_VERIFIABLE.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span className="text-fg">{item}</span>
                  </li>
                ))}
              </ul>
            </AnimateIn>
            <AnimateIn delay={0.08}>
              <p className="mb-5 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle">
                Not part of this system
              </p>
              <ul className="space-y-4">
                {IS_NOT_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fg-subtle" />
                    <span className="text-fg-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── Contact CTA ── */}
      <AnimateIn>
        <section className="theme-product bg-background">
          <div className={`${CONTAINER} max-w-3xl py-24 text-center`}>
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-fg md:text-4xl">
              Institutional partnerships
            </h2>
            <p className="mb-8 text-lg text-fg-muted">
              If your organisation reviews many portfolios, contact us to discuss bulk access and
              API integration options.
            </p>
            <a
              href="mailto:partnerships@umojahub.org"
              className="inline-flex items-center rounded-sm bg-brand px-8 py-4 font-semibold text-brand-fg transition-all duration-fast ease-standard hover:bg-brand-hover active:scale-95"
            >
              partnerships@umojahub.org
            </a>
          </div>
        </section>
      </AnimateIn>
    </>
  );
}
