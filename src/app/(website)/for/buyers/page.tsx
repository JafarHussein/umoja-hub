import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';
import { ImageSlot } from '@/components/website/ImageSlot';

export const metadata: Metadata = {
  title: 'For Buyers — Food Security Hub · UmojaHub',
  description:
    'Buy directly from verified Kenyan farmers. Every listing shows a Trust Score. Pay through M-Pesa with escrow protection.',
};

const TRUST_TIERS = [
  {
    tier: 'PREMIUM',
    score: '85–100',
    description: 'Longest verified record, lowest dispute rate, highest response reliability.',
    color: 'text-copper',
    border: 'border-copper',
  },
  {
    tier: 'TRUSTED',
    score: '60–84',
    description: 'Consistent verified history with multiple successful transactions.',
    color: 'text-teal',
    border: 'border-teal',
  },
  {
    tier: 'ESTABLISHED',
    score: '25–59',
    description: 'Growing track record. Verified identity and at least one completed order.',
    color: 'text-violet',
    border: 'border-violet',
  },
  {
    tier: 'NEW',
    score: '0–24',
    description: 'Recently verified farmer. No transaction history yet on the platform.',
    color: 'text-ws-text-secondary',
    border: 'border-ws-border-default',
  },
] as const;

const BUYER_STEPS = [
  { n: '01', text: 'Browse verified listings — filter by county, crop type, or Trust Score tier' },
  { n: '02', text: "View the farmer's Trust Score breakdown and verified profile before committing" },
  { n: '03', text: 'Select quantity and proceed to checkout — no account required to browse' },
  { n: '04', text: 'Confirm payment via M-Pesa STK Push — funds held in escrow until delivery' },
  { n: '05', text: 'Confirm receipt of produce — funds released to the farmer within 24 hours' },
] as const;

const RECOURSE_ITEMS = [
  'If produce does not match the listing description, raise a dispute before confirming receipt',
  'Disputes are reviewed by a human administrator within 72 hours',
  'Escrow is held until the dispute is resolved — you do not pay for undelivered or misrepresented goods',
  'Repeated disputes against a farmer reduce their Trust Score automatically',
];

export default function ForBuyersPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="pt-32 pb-0 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <AnimateIn>
                <p className="font-ibm-mono text-ws-meta text-copper mb-4">Food Security Hub — Buyers</p>
              </AnimateIn>
              <AnimateIn delay={0.08}>
                <h1 className="text-ws-h1 font-jakarta font-700 text-ws-text-heading leading-[1.15] tracking-[-0.02em]">
                  Buy from verified farmers.{' '}
                  <span className="text-copper">Every listing, every time.</span>
                </h1>
              </AnimateIn>
              <AnimateIn delay={0.16}>
                <p className="mt-5 text-ws-body font-jakarta text-ws-text-secondary leading-[1.6] max-w-lg">
                  Every farmer on UmojaHub has been verified by a human administrator. Every listing
                  displays a Trust Score based on their transaction history. Pay through M-Pesa with
                  escrow protection — your money is only released when you confirm delivery.
                </p>
              </AnimateIn>
              <AnimateIn delay={0.24}>
                <div className="mt-8">
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center px-6 py-3 bg-copper text-white font-jakarta font-600 text-[1rem] rounded-sm hover:bg-[#A05A30] active:scale-[0.98] transition-all duration-fast ease-standard"
                  >
                    Browse the Marketplace →
                  </Link>
                </div>
              </AnimateIn>
            </div>

            {/* Image slot — drop /public/images/buyers-hero.jpg here */}
            <AnimateIn delay={0.12} className="lg:self-end">
              <ImageSlot
                src="/images/buyers-hero.jpg"
                alt="A buyer reviewing verified produce listings"
                aspectRatio="4/3"
                priority
                className="rounded-sm"
              />
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── Trust Score tiers ── */}
      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-copper mb-3">What Trust Scores mean for you</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-3">
              Read the score before you pay
            </h2>
            <p className="text-ws-body font-jakarta text-ws-text-secondary max-w-xl mb-12">
              Every listing shows the farmer&apos;s current Trust Score tier. The score is calculated
              from four factors and updated after every transaction.
            </p>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST_TIERS.map((t, i) => (
              <AnimateIn key={t.tier} delay={i * 0.08}>
                <div
                  className={`p-6 bg-canvas-base border rounded-sm ${t.border}`}
                  style={{ borderWidth: '1px' }}
                >
                  <p className={`font-ibm-mono text-ws-meta font-600 mb-2 ${t.color}`}>{t.tier}</p>
                  <p className="font-jakarta text-[1.75rem] font-700 text-ws-text-heading mb-3">
                    {t.score}
                  </p>
                  <p className="font-jakarta text-ws-meta text-ws-text-secondary leading-[1.5]">
                    {t.description}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
          <AnimateIn delay={0.32}>
            <p className="mt-6 font-jakarta text-ws-meta text-ws-text-meta">
              Full Trust Score methodology →{' '}
              <Link href="/trust" className="text-teal hover:underline underline-offset-2">
                Trust & Verification
              </Link>
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ── 5-step buyer flow ── */}
      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-copper mb-3">How it works</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              From browse to delivery
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {BUYER_STEPS.map((step, i) => (
              <AnimateIn key={step.n} delay={i * 0.08}>
                <div className="p-5 bg-ws-surface-primary border border-ws-border-soft rounded-sm">
                  <p className="font-ibm-mono text-ws-meta text-ws-text-meta mb-3">{step.n}</p>
                  <p className="font-jakarta text-ws-body text-ws-text-body leading-[1.6]">
                    {step.text}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recourse ── */}
      <AnimateIn>
        <section className="py-24 px-6 lg:px-8 bg-ws-surface-warning border-y border-[#C7A27D]">
          <div className="mx-auto max-w-4xl">
            <p className="font-ibm-mono text-ws-meta text-[#8B6544] mb-3">Your recourse</p>
            <h2 className="text-ws-h2 font-jakarta font-600 text-ws-text-heading mb-6">
              What happens if something goes wrong
            </h2>
            <ul className="space-y-3">
              {RECOURSE_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-copper" />
                  <span className="font-jakarta text-ws-body text-ws-text-body">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 font-jakarta text-ws-meta text-ws-text-secondary">
              Full dispute and appeals process →{' '}
              <Link href="/transparency" className="text-teal hover:underline underline-offset-2">
                Transparency
              </Link>
            </p>
          </div>
        </section>
      </AnimateIn>

      {/* ── Bottom CTA ── */}
      <AnimateIn>
        <section className="py-24 px-6 lg:px-8 bg-canvas-base">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-4">
              Browse verified produce now
            </h2>
            <p className="text-ws-body font-jakarta text-ws-text-secondary mb-10">
              No account required to browse. Create an account when you&apos;re ready to purchase.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center px-8 py-4 bg-copper text-white font-jakarta font-600 text-[1.0625rem] rounded-sm hover:bg-[#A05A30] active:scale-[0.98] transition-all duration-fast ease-standard"
            >
              Go to Marketplace →
            </Link>
          </div>
        </section>
      </AnimateIn>
    </>
  );
}
