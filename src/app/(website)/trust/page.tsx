import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';

export const metadata: Metadata = {
  title: 'Trust & Verification — UmojaHub',
  description:
    'The complete UmojaHub verification methodology. How farmers and students are verified, how Trust Scores are calculated, and how appeals work.',
};

const TRUST_SCORE_FACTORS = [
  { pts: '40 pts', factor: 'Transaction history', detail: 'Volume, consistency, and recency of completed orders.' },
  { pts: '30 pts', factor: 'Verification depth', detail: 'Completeness of identity and farm documentation at time of verification.' },
  { pts: '20 pts', factor: 'Response rate', detail: 'How reliably the farmer responds to buyer enquiries and order confirmations.' },
  { pts: '10 pts', factor: 'Dispute record', detail: 'Number and outcome of disputes raised against the farmer.' },
] as const;

const FARMER_STEPS = [
  { n: '01', label: 'Application', detail: 'Submit identity documents and farm registration details.' },
  { n: '02', label: 'Document review', detail: 'An administrator reviews submitted documentation within 30 days.' },
  { n: '03', label: 'Decision', detail: 'APPROVED — account activated. REJECTED — reason stated, reapplication permitted after 90 days.' },
] as const;

const EDUCATION_STEPS = [
  { n: '01', label: 'Submission', detail: 'Student submits three documents. SHA-256 hash generated at submission time.' },
  { n: '02', label: 'Rubric assessment', detail: 'Verified lecturer reviews against the four-dimension rubric.' },
  { n: '03', label: 'Decision', detail: 'VERIFIED, REVISION REQUIRED (student may resubmit), or DENIED.' },
] as const;

const SCORE_DECAY = [
  { period: 'Month 1', score: 'Full score maintained' },
  { period: 'Month 3', score: '-5 points if no new transactions' },
  { period: 'Month 6', score: '-15 points total from inactivity' },
  { period: 'Month 12', score: 'Score floor: 10 (does not reach zero from inactivity alone)' },
] as const;

export default function TrustPage() {
  return (
    <>
      <section className="pt-32 pb-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-4">Methodology</p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="text-ws-h1 font-jakarta font-700 text-ws-text-heading leading-[1.15] tracking-[-0.02em]">
              Trust & Verification
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mt-5 text-ws-body font-jakarta text-ws-text-secondary leading-[1.6] max-w-2xl">
              This page documents the complete verification methodology for both hubs. Every claim
              on the platform is backed by a process described here. Where limitations exist, they
              are stated explicitly.
            </p>
          </AnimateIn>
          <AnimateIn delay={0.24}>
            <nav className="mt-8 flex flex-wrap gap-3" aria-label="Page sections">
              {['Trust Score', 'Farmer Verification', 'Education Verification', 'Appeals'].map((section) => (
                <a
                  key={section}
                  href={`#${section.toLowerCase().replace(/ /g, '-')}`}
                  className="px-3 py-1.5 bg-ws-surface-primary border border-ws-border-soft rounded-sm font-jakarta text-ws-meta text-ws-text-secondary hover:text-ws-text-heading hover:border-ws-border-default transition-all duration-fast ease-standard"
                >
                  {section}
                </a>
              ))}
            </nav>
          </AnimateIn>
        </div>
      </section>

      {/* Trust Score */}
      <section id="trust-score" className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">Trust Score</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-3">
              How scores are calculated
            </h2>
            <p className="text-ws-body font-jakarta text-ws-text-secondary max-w-xl mb-12">
              A Trust Score is a single number from 0 to 100 composed of four weighted factors.
              Scores update after every transaction.
            </p>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {TRUST_SCORE_FACTORS.map((item, i) => (
              <AnimateIn key={item.factor} delay={i * 0.08}>
                <div className="p-6 bg-canvas-base border border-ws-border-soft rounded-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-ibm-mono text-ws-meta text-teal">{item.pts}</span>
                    <p className="font-jakarta font-600 text-ws-text-heading">{item.factor}</p>
                  </div>
                  <p className="font-jakarta text-ws-body text-ws-text-secondary">{item.detail}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
          <AnimateIn delay={0.32}>
            <div className="p-6 bg-canvas-base border border-ws-border-soft rounded-sm">
              <p className="font-ibm-mono text-ws-meta text-teal mb-3">Score decay (inactive accounts)</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ws-border-soft">
                      <th className="text-left font-jakarta text-ws-meta font-600 text-ws-text-heading pb-3 pr-8">Period</th>
                      <th className="text-left font-jakarta text-ws-meta font-600 text-ws-text-heading pb-3">Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ws-border-soft">
                    {SCORE_DECAY.map((row) => (
                      <tr key={row.period}>
                        <td className="font-ibm-mono text-ws-meta text-ws-text-meta py-3 pr-8">{row.period}</td>
                        <td className="font-jakarta text-ws-body text-ws-text-body py-3">{row.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Farmer Verification */}
      <section id="farmer-verification" className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">Farmer Verification</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              Three-step identity and farm verification
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FARMER_STEPS.map((step, i) => (
              <AnimateIn key={step.n} delay={i * 0.08}>
                <div className="p-6 bg-ws-surface-primary border border-ws-border-soft rounded-sm">
                  <p className="font-ibm-mono text-ws-meta text-teal mb-2">{step.n}</p>
                  <p className="font-jakarta font-600 text-ws-text-heading mb-3">{step.label}</p>
                  <p className="font-jakarta text-ws-body text-ws-text-secondary">{step.detail}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Education Verification */}
      <section id="education-verification" className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">Education Verification</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              Cryptographic anchoring + human review
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EDUCATION_STEPS.map((step, i) => (
              <AnimateIn key={step.n} delay={i * 0.08}>
                <div className="p-6 bg-canvas-base border border-ws-border-soft rounded-sm">
                  <p className="font-ibm-mono text-ws-meta text-teal mb-2">{step.n}</p>
                  <p className="font-jakarta font-600 text-ws-text-heading mb-3">{step.label}</p>
                  <p className="font-jakarta text-ws-body text-ws-text-secondary">{step.detail}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Appeals */}
      <section id="appeals" className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">Appeals</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-6">
              Every decision can be appealed
            </h2>
            <div className="space-y-4 text-ws-body font-jakarta text-ws-text-body leading-[1.6]">
              <p>
                Any farmer or student who receives a REJECTED or DENIED decision may submit a
                formal appeal within 30 days. Appeals are reviewed by a different administrator
                than the one who issued the original decision.
              </p>
              <p>
                Appeal outcomes are either REVERSED (original decision overturned) or UPHELD
                (original decision confirmed). Both outcomes are logged permanently and attributed to
                the reviewing administrator.
              </p>
              <p>
                A second appeal on the same decision is not permitted. Reapplication after 90 days
                is always available regardless of appeal outcome.
              </p>
            </div>
            <div className="mt-8">
              <Link
                href="/team"
                className="font-jakarta text-ws-meta text-teal hover:underline underline-offset-2"
              >
                View the administrators who handle appeals →
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
