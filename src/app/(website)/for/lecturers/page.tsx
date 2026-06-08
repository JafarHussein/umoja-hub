import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';

export const metadata: Metadata = {
  title: 'For Lecturers — Education Hub · UmojaHub',
  description:
    'Review CS student project submissions and issue verified assessments. Your institutional credentials anchor the verification chain.',
};

const PARTICIPATION = [
  {
    dimension: 'Time commitment',
    detail: 'One to four hours per submission. Review is asynchronous — no scheduled sessions.',
  },
  {
    dimension: 'Decision authority',
    detail: 'You decide VERIFIED, REVISION REQUIRED, or DENIED. Decisions are logged against your institutional identity.',
  },
  {
    dimension: 'Scope',
    detail: 'You review only submissions from students at your registered institution. No cross-institutional assignments without explicit consent.',
  },
] as const;

const RUBRIC_DIMENSIONS = [
  { score: '1–5', dimension: 'Technical depth', description: 'Quality and complexity of the implementation relative to stated scope.' },
  { score: '1–5', dimension: 'Documentation clarity', description: 'How clearly the Reflection Document explains methodology and outcomes.' },
  { score: '1–5', dimension: 'Evidence integrity', description: 'Whether the code repository matches the documented claims.' },
  { score: '1–5', dimension: 'Honest self-assessment', description: 'Quality of critical reflection on what failed and why.' },
] as const;

const CONSTRAINTS = [
  'You must be employed by a registered institution to apply',
  'Your institutional email is verified before your account is activated',
  'You cannot review submissions from your own students without a co-reviewer',
  'Decisions are permanent — VERIFIED entries cannot be withdrawn unilaterally',
] as const;

export default function ForLecturersPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-violet mb-4">Education Hub — Lecturers</p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="text-ws-h1 font-jakarta font-700 text-ws-text-heading leading-[1.15] tracking-[-0.02em]">
              Your institutional expertise{' '}
              <span className="text-violet">anchors the verification chain</span>
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mt-5 text-ws-body font-jakarta text-ws-text-secondary leading-[1.6] max-w-2xl">
              Verified lecturers review student project submissions against a published rubric. Your
              name and institutional role are attached to every decision you make — building a record
              of assessments that employers can independently verify.
            </p>
          </AnimateIn>
          <AnimateIn delay={0.24}>
            <Link
              href="/lecturers/apply"
              className="inline-flex items-center mt-8 px-6 py-3 bg-violet text-white font-jakarta font-600 text-[1rem] rounded-sm hover:bg-[#5A4A88] active:scale-[0.98] transition-all duration-fast ease-standard"
            >
              Apply as a Lecturer →
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* ── Participation blocks ── */}
      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-violet mb-3">What participation means</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              Three things to understand before applying
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PARTICIPATION.map((item, i) => (
              <AnimateIn key={item.dimension} delay={i * 0.08}>
                <div className="p-6 bg-canvas-base border border-ws-border-soft rounded-sm">
                  <p className="font-ibm-mono text-ws-meta text-violet mb-3">
                    0{i + 1}
                  </p>
                  <p className="font-jakarta font-600 text-ws-text-heading mb-3">{item.dimension}</p>
                  <p className="font-jakarta text-ws-body text-ws-text-secondary leading-[1.6]">
                    {item.detail}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rubric ── */}
      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-violet mb-3">The rubric</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-3">
              Four dimensions, scored 1 to 5
            </h2>
            <p className="text-ws-body font-jakarta text-ws-text-secondary max-w-xl mb-12">
              Every submission is assessed on the same four dimensions. The rubric is published
              publicly — students know what they are being assessed on before they submit.
            </p>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {RUBRIC_DIMENSIONS.map((item, i) => (
              <AnimateIn key={item.dimension} delay={i * 0.08}>
                <div className="p-6 bg-ws-surface-primary border border-ws-border-soft rounded-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-ibm-mono text-ws-meta text-violet">{item.score}</span>
                    <p className="font-jakarta font-600 text-ws-text-heading">{item.dimension}</p>
                  </div>
                  <p className="font-jakarta text-ws-body text-ws-text-secondary leading-[1.6]">
                    {item.description}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Constraints ── */}
      <AnimateIn>
        <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
          <div className="mx-auto max-w-4xl">
            <p className="font-ibm-mono text-ws-meta text-ws-text-meta mb-3">Constraints</p>
            <h2 className="text-ws-h2 font-jakarta font-600 text-ws-text-heading mb-6">
              What the system requires of you
            </h2>
            <ul className="space-y-3">
              {CONSTRAINTS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-ws-border-default" />
                  <span className="font-jakarta text-ws-body text-ws-text-body">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </AnimateIn>

      {/* ── CTA ── */}
      <AnimateIn>
        <section className="py-24 px-6 lg:px-8 bg-canvas-base">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-4">
              Apply to become a verified reviewer
            </h2>
            <p className="text-ws-body font-jakarta text-ws-text-secondary mb-10">
              Applications are reviewed within 30 days. Your institutional email must be active and
              verifiable.
            </p>
            <Link
              href="/lecturers/apply"
              className="inline-flex items-center px-8 py-4 bg-violet text-white font-jakarta font-600 text-[1.0625rem] rounded-sm hover:bg-[#5A4A88] active:scale-[0.98] transition-all duration-fast ease-standard"
            >
              Apply as a Lecturer →
            </Link>
          </div>
        </section>
      </AnimateIn>
    </>
  );
}
