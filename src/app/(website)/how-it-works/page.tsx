import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';

export const metadata: Metadata = {
  title: 'How It Works — UmojaHub',
  description:
    'Step-by-step flows for the Food Security Hub, Education Hub, and cooperative group orders.',
};

const FOOD_HUB_STEPS = [
  { n: '01', text: 'Farmer applies — submits identity documents and farm registration details.' },
  { n: '02', text: 'Administrator reviews within 30 days.' },
  { n: '03', text: 'Approved farmer publishes produce listings with price and quantity.' },
  { n: '04', text: 'Buyer browses verified listings, filtering by county, crop, or Trust Score tier.' },
  { n: '05', text: 'Buyer proceeds to checkout — M-Pesa STK Push sent to their number.' },
  { n: '06', text: 'Buyer confirms payment — funds held in escrow.' },
  { n: '07', text: 'Farmer prepares and dispatches produce.' },
  { n: '08', text: 'Buyer confirms receipt — funds released to farmer within 24 hours.' },
  { n: '09', text: "Transaction recorded. Farmer's Trust Score updated." },
] as const;

const EDUCATION_STEPS = [
  { n: '01', text: 'Student registers and verifies their institutional email.' },
  { n: '02', text: 'Student submits a project: Brief, Reflection Document, and code repository.' },
  { n: '03', text: 'Platform generates a SHA-256 hash of the submission at the moment of upload.' },
  { n: '04', text: 'Verified lecturer from the student\'s institution reviews against the four-dimension rubric.' },
  { n: '05', text: 'Lecturer issues: VERIFIED, REVISION REQUIRED, or DENIED.' },
  { n: '06', text: 'VERIFIED entry is published publicly. Employer can view it without registering.' },
  { n: '07', text: 'Employer independently verifies the hash and reviewer identity.' },
  { n: '08', text: 'Portfolio entry is permanent — neither the student nor the platform can alter a verified entry.' },
] as const;

const COOPERATIVE_STEPS = [
  { n: '01', text: 'A verified farmer creates a group and becomes the group administrator.' },
  { n: '02', text: 'Other verified farmers join using an invite code — each individually verified.' },
  { n: '03', text: 'The group administrator publishes a combined listing representing the group\'s stock.' },
  { n: '04', text: 'Buyer places a bulk order — M-Pesa payment covers the full order.' },
  { n: '05', text: 'Payment distributed to each member\'s M-Pesa number in proportion to their contribution.' },
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <section className="pt-32 pb-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-4">How It Works</p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="text-ws-h1 font-jakarta font-700 text-ws-text-heading leading-[1.15] tracking-[-0.02em]">
              Three complete flows, step by step
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mt-5 text-ws-body font-jakarta text-ws-text-secondary leading-[1.6] max-w-2xl">
              Each step below describes what happens on the platform, who takes the action, and
              what the system does in response. No steps are omitted or simplified.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Food Security Hub */}
      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">Food Security Hub</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              From verification to payment — 9 steps
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FOOD_HUB_STEPS.map((step, i) => (
              <AnimateIn key={step.n} delay={i * 0.06}>
                <div className="p-5 bg-canvas-base border border-ws-border-soft rounded-sm">
                  <p className="font-ibm-mono text-ws-meta text-teal mb-3">{step.n}</p>
                  <p className="font-jakarta text-ws-body text-ws-text-body leading-[1.6]">{step.text}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Education Hub */}
      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-violet mb-3">Education Hub</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              From submission to employer — 8 steps
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {EDUCATION_STEPS.map((step, i) => (
              <AnimateIn key={step.n} delay={i * 0.06}>
                <div className="p-5 bg-ws-surface-primary border border-ws-border-soft rounded-sm">
                  <p className="font-ibm-mono text-ws-meta text-violet mb-3">{step.n}</p>
                  <p className="font-jakarta text-ws-body text-ws-text-body leading-[1.6]">{step.text}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Cooperative */}
      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-copper mb-3">Cooperative Groups</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              Bulk orders — 5 steps
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {COOPERATIVE_STEPS.map((step, i) => (
              <AnimateIn key={step.n} delay={i * 0.08}>
                <div className="p-5 bg-canvas-base border border-ws-border-soft rounded-sm">
                  <p className="font-ibm-mono text-ws-meta text-copper mb-3">{step.n}</p>
                  <p className="font-jakarta text-ws-body text-ws-text-body leading-[1.6]">{step.text}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <AnimateIn>
        <section className="py-16 px-6 lg:px-8 bg-canvas-base border-t border-ws-border-soft">
          <div className="mx-auto max-w-4xl flex flex-wrap gap-6">
            <Link href="/trust" className="font-jakarta text-ws-meta text-teal hover:underline underline-offset-2">
              Full verification methodology →
            </Link>
            <Link href="/transparency" className="font-jakarta text-ws-meta text-teal hover:underline underline-offset-2">
              Platform transparency →
            </Link>
          </div>
        </section>
      </AnimateIn>
    </>
  );
}
