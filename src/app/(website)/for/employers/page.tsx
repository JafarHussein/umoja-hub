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

export default function ForEmployersPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-4">Education Hub — Employers</p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="text-ws-h1 font-jakarta font-700 text-ws-text-heading leading-[1.15] tracking-[-0.02em]">
              Portfolio verification you can check{' '}
              <span className="text-teal">without asking the student</span>
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mt-5 text-ws-body font-jakarta text-ws-text-secondary leading-[1.6] max-w-2xl">
              Every portfolio entry on UmojaHub has been reviewed by a verified lecturer and
              cryptographically anchored. You can verify the submission hash and reviewer identity
              independently — without registering, contacting the student, or paying.
            </p>
          </AnimateIn>
          <AnimateIn delay={0.24}>
            <Link
              href="/knowledge"
              className="inline-flex items-center mt-8 px-6 py-3 border border-ws-border-default text-ws-text-heading font-jakarta font-500 text-[1rem] rounded-sm hover:bg-ws-surface-primary transition-all duration-standard ease-standard"
            >
              Read how verification works
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* ── Verification chain ── */}
      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">The chain of evidence</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              Four steps from submission to your desk
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VERIFICATION_CHAIN.map((item, i) => (
              <AnimateIn key={item.step} delay={i * 0.08}>
                <div className="p-6 bg-canvas-base border border-ws-border-soft rounded-sm">
                  <p className="font-ibm-mono text-ws-meta text-teal mb-2">
                    0{i + 1}
                  </p>
                  <p className="font-jakarta font-600 text-ws-text-heading mb-3">{item.step}</p>
                  <p className="font-jakarta text-ws-body text-ws-text-secondary leading-[1.6]">
                    {item.detail}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Independently verifiable ── */}
      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <AnimateIn>
              <p className="font-ibm-mono text-ws-meta text-teal mb-5">
                Independently verifiable
              </p>
              <ul className="space-y-4">
                {INDEPENDENTLY_VERIFIABLE.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-teal" />
                    <span className="font-jakarta text-ws-body text-ws-text-body">{item}</span>
                  </li>
                ))}
              </ul>
            </AnimateIn>
            <AnimateIn delay={0.08}>
              <p className="font-ibm-mono text-ws-meta text-ws-text-meta mb-5">
                Not part of this system
              </p>
              <ul className="space-y-4">
                {IS_NOT_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-ws-border-default" />
                    <span className="font-jakarta text-ws-body text-ws-text-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── Contact CTA ── */}
      <AnimateIn>
        <section className="py-24 px-6 lg:px-8 bg-ws-text-heading">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-ws-h1 font-jakarta font-600 text-[#F2F0EC] mb-4">
              Institutional partnerships
            </h2>
            <p className="text-ws-body font-jakarta text-[#A9A29A] mb-8">
              If your organisation reviews many portfolios, contact us to discuss bulk access and
              API integration options.
            </p>
            <a
              href="mailto:partnerships@umojahub.org"
              className="inline-flex items-center px-8 py-4 bg-teal text-white font-jakarta font-600 text-[1.0625rem] rounded-sm hover:bg-[#256663] active:scale-[0.98] transition-all duration-fast ease-standard"
            >
              partnerships@umojahub.org
            </a>
          </div>
        </section>
      </AnimateIn>
    </>
  );
}
