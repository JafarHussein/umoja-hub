import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';
import { ImageSlot } from '@/components/website/ImageSlot';

export const metadata: Metadata = {
  title: 'For Farmers — Food Security Hub · UmojaHub',
  description:
    'Sell verified produce to buyers who pay through M-Pesa. Build a Trust Score that grows with every successful transaction.',
};

const IS_ITEMS = [
  'A verified produce marketplace — buyers know exactly who they are buying from',
  'A Trust Score that persists across every listing you publish',
  'M-Pesa STK Push payment — no cash handling, no third parties',
  'Price intelligence based on live market data from your county',
  'A cooperative group system for bulk orders with neighbouring farmers',
];

const IS_NOT_ITEMS = [
  'A charity or subsidy programme — your earnings are yours',
  'An intermediary that takes a cut before you are paid',
  'A platform that accepts unverified listings',
  'A loan, credit, or advance-payment product',
];

const TRUST_TIERS = [
  { tier: 'NEW', score: '0–24', label: 'Getting started', color: 'text-ws-text-secondary' },
  { tier: 'ESTABLISHED', score: '25–59', label: 'Consistent record', color: 'text-violet' },
  { tier: 'TRUSTED', score: '60–84', label: 'Verified history', color: 'text-teal' },
  { tier: 'PREMIUM', score: '85–100', label: 'Top verified farmer', color: 'text-copper' },
] as const;

const MPESA_STEPS = [
  { n: '01', text: 'Buyer selects your listing and proceeds to checkout' },
  { n: '02', text: "Platform sends an STK Push to the buyer's M-Pesa number" },
  { n: '03', text: 'Buyer confirms on their phone — no app, no card required' },
  { n: '04', text: 'Platform holds payment in escrow until delivery is confirmed' },
  { n: '05', text: 'Funds released to your registered M-Pesa number within 24 hours' },
] as const;

export default function ForFarmersPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="pt-32 pb-0 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <AnimateIn>
                <p className="font-ibm-mono text-ws-meta text-teal mb-4">Food Security Hub</p>
              </AnimateIn>
              <AnimateIn delay={0.08}>
                <h1 className="text-ws-h1 font-jakarta font-700 text-ws-text-heading leading-[1.15] tracking-[-0.02em]">
                  Your produce, verified.{' '}
                  <span className="text-copper">Your payment, guaranteed.</span>
                </h1>
              </AnimateIn>
              <AnimateIn delay={0.16}>
                <p className="mt-5 text-ws-body font-jakarta text-ws-text-secondary leading-[1.6] max-w-lg">
                  UmojaHub verifies your identity and farm before your first listing goes live.
                  Buyers see your Trust Score on every listing — and pay through M-Pesa with no
                  intermediary taking a cut.
                </p>
              </AnimateIn>
              <AnimateIn delay={0.24}>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/auth/register?role=FARMER"
                    className="inline-flex items-center px-6 py-3 bg-copper text-white font-jakarta font-600 text-[1rem] rounded-sm hover:bg-[#A05A30] active:scale-[0.98] transition-all duration-fast ease-standard"
                  >
                    Register as a Farmer →
                  </Link>
                  <Link
                    href="/trust"
                    className="inline-flex items-center px-6 py-3 border border-ws-border-default text-ws-text-heading font-jakarta font-500 text-[1rem] rounded-sm hover:bg-ws-surface-primary transition-all duration-standard ease-standard"
                  >
                    Read the methodology
                  </Link>
                </div>
              </AnimateIn>
            </div>

            {/* Image slot — drop /public/images/farmers-hero.webp here */}
            <AnimateIn delay={0.12} className="lg:self-end">
              <ImageSlot
                src="/images/farmers-hero.webp"
                alt="A verified farmer in their field in Kenya"
                aspectRatio="4/3"
                priority
                className="rounded-sm"
              />
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── IS / IS NOT ── */}
      <AnimateIn>
        <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <p className="font-ibm-mono text-ws-meta text-teal mb-5">What it is</p>
                <ul className="space-y-3">
                  {IS_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-teal" />
                      <span className="font-jakarta text-ws-body text-ws-text-body">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-ibm-mono text-ws-meta text-ws-text-meta mb-5">What it is not</p>
                <ul className="space-y-3">
                  {IS_NOT_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-ws-border-default" />
                      <span className="font-jakarta text-ws-body text-ws-text-secondary">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </AnimateIn>

      {/* ── Trust Score tiers ── */}
      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-copper mb-3">Trust Score</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-3">
              Your score grows with your record
            </h2>
            <p className="text-ws-body font-jakarta text-ws-text-secondary max-w-xl mb-12">
              Four factors — transaction history, verification depth, response rate, and dispute
              record — combine into a single score that buyers see on every listing.
            </p>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST_TIERS.map((t, i) => (
              <AnimateIn key={t.tier} delay={i * 0.08}>
                <div className="p-6 bg-ws-surface-primary border border-ws-border-soft rounded-sm">
                  <p className={`font-ibm-mono text-ws-meta font-600 mb-2 ${t.color}`}>{t.tier}</p>
                  <p className="font-jakarta text-[2rem] font-700 text-ws-text-heading mb-1">
                    {t.score}
                  </p>
                  <p className="font-jakarta text-ws-meta text-ws-text-secondary">{t.label}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
          <AnimateIn delay={0.32}>
            <p className="mt-6 font-jakarta text-ws-meta text-ws-text-meta">
              Full methodology →{' '}
              <Link href="/trust" className="text-teal hover:underline underline-offset-2">
                Trust & Verification
              </Link>
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ── M-Pesa payment flow ── */}
      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimateIn>
              <p className="font-ibm-mono text-ws-meta text-teal mb-3">How you get paid</p>
              <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-6">
                M-Pesa, end to end
              </h2>
              <ol className="space-y-4">
                {MPESA_STEPS.map((step) => (
                  <li key={step.n} className="flex items-start gap-4">
                    <span className="shrink-0 font-ibm-mono text-ws-meta text-ws-text-meta pt-0.5">
                      {step.n}
                    </span>
                    <span className="font-jakarta text-ws-body text-ws-text-body">{step.text}</span>
                  </li>
                ))}
              </ol>
            </AnimateIn>

            {/* Image slot — drop /public/images/mpesa-flow.webp here */}
            <AnimateIn delay={0.12}>
              <ImageSlot
                src="/images/mpesa-flow.webp"
                alt="M-Pesa STK Push payment confirmation on a mobile device"
                aspectRatio="3/4"
                className="rounded-sm"
              />
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <AnimateIn>
        <section className="py-24 px-6 lg:px-8 bg-canvas-base">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-4">
              Start building your verified record
            </h2>
            <p className="text-ws-body font-jakarta text-ws-text-secondary mb-10">
              Verification takes up to 30 days. Once approved, your listings go live immediately.
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
