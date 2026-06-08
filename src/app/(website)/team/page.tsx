import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';

export const metadata: Metadata = {
  title: 'Team — UmojaHub',
  description:
    'The administrators who verify farmers and students, review disputes, and handle appeals. Named accountability for every decision.',
};

const ADMINS = [
  {
    id: 'ADMIN-AG-001',
    role: 'Regional Administrator — Producer Verification',
    area: 'Food Security Hub',
    decisions: ['Farmer identity and farm verification (APPROVED / REJECTED)', 'Dispute reviews between farmers and buyers', 'First-level appeals on rejected farmer applications'],
    queue: 'Farmer verification queue',
    color: 'teal',
  },
  {
    id: 'ADMIN-ED-001',
    role: 'Regional Administrator — Education Verification',
    area: 'Education Hub',
    decisions: ['Lecturer credential verification', 'Student portfolio appeals (REVISION REQUIRED → VERIFIED)', 'Second-level appeals escalated from lecturer decisions'],
    queue: 'Education verification queue',
    color: 'violet',
  },
] as const;

const DECISION_TYPES = [
  {
    type: 'Farmer verification',
    outcomes: ['APPROVED — account activated, listings permitted', 'REJECTED — reason stated, reapplication after 90 days'],
  },
  {
    type: 'Student portfolio',
    outcomes: ['VERIFIED — entry publicly accessible', 'REVISION REQUIRED — student may resubmit', 'DENIED — project does not meet rubric threshold'],
  },
  {
    type: 'Dispute resolution',
    outcomes: ['RESOLVED FOR BUYER — escrow returned', 'RESOLVED FOR FARMER — escrow released'],
  },
] as const;

const APPEALS_PATHWAY = [
  { n: '01', text: 'Participant submits appeal within 30 days of decision.' },
  { n: '02', text: 'Appeal assigned to a different administrator than the original reviewer.' },
  { n: '03', text: 'Administrator reviews original submission, decision rationale, and appeal grounds.' },
  { n: '04', text: 'Outcome: REVERSED or UPHELD. Both outcomes permanently logged.' },
  { n: '05', text: 'No second appeal on the same decision. Reapplication after 90 days always permitted.' },
] as const;

export default function TeamPage() {
  return (
    <>
      <section className="pt-32 pb-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-4">The Team</p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="text-ws-h1 font-jakarta font-700 text-ws-text-heading leading-[1.15] tracking-[-0.02em]">
              Named administrators. Named decisions.
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mt-5 text-ws-body font-jakarta text-ws-text-secondary leading-[1.6] max-w-2xl">
              Every verification decision on UmojaHub is attributed to a named administrator. This
              page lists the roles, decision types, and appeals pathway — so any participant can
              identify who made a decision that affected them.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Administrator profiles */}
      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">Administrators</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              Two roles, distinct decision authorities
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ADMINS.map((admin, i) => (
              <AnimateIn key={admin.id} delay={i * 0.08}>
                <div className="p-6 bg-canvas-base border border-ws-border-soft rounded-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`font-ibm-mono text-ws-meta px-2 py-0.5 rounded-sm border ${
                        admin.color === 'teal'
                          ? 'text-teal border-teal/30 bg-ws-surface-success'
                          : 'text-violet border-violet/30 bg-[#F0EDF8]'
                      }`}
                    >
                      {admin.id}
                    </span>
                  </div>
                  <p className="font-jakarta font-600 text-ws-text-heading mb-1">{admin.role}</p>
                  <p className="font-ibm-mono text-ws-meta text-ws-text-meta mb-4">{admin.area}</p>
                  <p className="font-jakarta text-ws-meta font-600 text-ws-text-secondary mb-2">Decision authority</p>
                  <ul className="space-y-2">
                    {admin.decisions.map((d) => (
                      <li key={d} className="flex items-start gap-2">
                        <span className={`mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full ${admin.color === 'teal' ? 'bg-teal' : 'bg-violet'}`} />
                        <span className="font-jakarta text-ws-meta text-ws-text-body">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Decision types */}
      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">Decision types</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              Every possible outcome, documented
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DECISION_TYPES.map((item, i) => (
              <AnimateIn key={item.type} delay={i * 0.08}>
                <div className="p-6 bg-ws-surface-primary border border-ws-border-soft rounded-sm">
                  <p className="font-jakarta font-600 text-ws-text-heading mb-4">{item.type}</p>
                  <ul className="space-y-2">
                    {item.outcomes.map((o) => (
                      <li key={o} className="flex items-start gap-2">
                        <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-teal" />
                        <span className="font-jakarta text-ws-meta text-ws-text-body">{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Appeals */}
      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">Appeals pathway</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              Five steps from appeal to resolution
            </h2>
          </AnimateIn>
          <ol className="space-y-6">
            {APPEALS_PATHWAY.map((step, i) => (
              <AnimateIn key={step.n} delay={i * 0.08}>
                <li className="flex items-start gap-4">
                  <span className="shrink-0 font-ibm-mono text-ws-meta text-teal">{step.n}</span>
                  <p className="font-jakarta text-ws-body text-ws-text-body">{step.text}</p>
                </li>
              </AnimateIn>
            ))}
          </ol>
          <AnimateIn delay={0.4}>
            <p className="mt-10 font-jakarta text-ws-meta text-ws-text-meta">
              Full appeals methodology →{' '}
              <Link href="/trust#appeals" className="text-teal hover:underline underline-offset-2">
                Trust & Verification
              </Link>
            </p>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
