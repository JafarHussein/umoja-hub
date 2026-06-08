import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';

export const metadata: Metadata = {
  title: 'For Cooperatives — Food Security Hub · UmojaHub',
  description:
    'Pool orders across your farmer group. Access bulk purchasing at verified prices through a single cooperative account.',
};

const GROUP_STEPS = [
  { n: '01', text: 'One verified farmer registers the group and becomes the group administrator.' },
  { n: '02', text: 'Group members join using an invite code — each member must be individually verified.' },
  { n: '03', text: 'The group places a single bulk order from a buyer or aggregator, splitting the volume across members.' },
] as const;

const WHO_CAN_JOIN = [
  'Any individually verified farmer — NEW tier or above',
  'Groups of two or more verified farmers from the same county',
  'Existing farmer cooperatives with a registered group administrator',
];

const LIMITATIONS = [
  'Unverified farmers cannot join a group — verification must be completed individually first',
  'A group cannot place an order larger than the combined stock of verified member listings',
  'Payment is distributed to individual M-Pesa numbers — the group does not hold a pooled balance',
];

export default function ForCooperativesPage() {
  return (
    <>
      <section className="pt-32 pb-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-4">Food Security Hub — Cooperatives</p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="text-ws-h1 font-jakarta font-700 text-ws-text-heading leading-[1.15] tracking-[-0.02em]">
              Pool your capacity.{' '}
              <span className="text-teal">Access bulk orders together.</span>
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mt-5 text-ws-body font-jakarta text-ws-text-secondary leading-[1.6] max-w-2xl">
              Cooperative groups on UmojaHub let verified farmers combine their stock to fulfil
              larger orders than any single farm could handle. Payments go directly to each
              member — no pooled account, no cooperative handling fees.
            </p>
          </AnimateIn>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">How groups work</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              Three steps to a group order
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GROUP_STEPS.map((step, i) => (
              <AnimateIn key={step.n} delay={i * 0.08}>
                <div className="p-6 bg-canvas-base border border-ws-border-soft rounded-sm">
                  <p className="font-ibm-mono text-ws-meta text-teal mb-3">{step.n}</p>
                  <p className="font-jakarta text-ws-body text-ws-text-body leading-[1.6]">{step.text}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <AnimateIn>
              <p className="font-ibm-mono text-ws-meta text-teal mb-5">Who can join</p>
              <ul className="space-y-3">
                {WHO_CAN_JOIN.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-teal" />
                    <span className="font-jakarta text-ws-body text-ws-text-body">{item}</span>
                  </li>
                ))}
              </ul>
            </AnimateIn>
            <AnimateIn delay={0.08}>
              <p className="font-ibm-mono text-ws-meta text-ws-text-meta mb-5">Limitations</p>
              <ul className="space-y-3">
                {LIMITATIONS.map((item) => (
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

      <AnimateIn>
        <section className="py-24 px-6 lg:px-8 bg-canvas-base border-t border-ws-border-soft">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-4">
              Start with individual verification
            </h2>
            <p className="text-ws-body font-jakarta text-ws-text-secondary mb-10">
              Each farmer must be individually verified before joining a group. Register first, then
              create or join a cooperative.
            </p>
            <Link
              href="/auth/register?role=FARMER"
              className="inline-flex items-center px-8 py-4 bg-copper text-white font-jakarta font-600 text-[1.0625rem] rounded-sm hover:bg-[#A05A30] active:scale-[0.98] transition-all duration-fast ease-standard"
            >
              Register as a Farmer →
            </Link>
          </div>
        </section>
      </AnimateIn>
    </>
  );
}
