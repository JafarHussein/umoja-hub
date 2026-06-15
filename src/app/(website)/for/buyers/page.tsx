import type { Metadata } from 'next';
import Link from 'next/link';
import { MediaFrame } from '@/components/website/MediaFrame';

export const metadata: Metadata = {
  title: 'For Buyers: Food Security Hub · UmojaHub',
  description:
    'Buy directly from verified Kenyan farmers. Every listing shows a Trust Score. Pay through M-Pesa.',
};

const TIERS = [
  { name: 'New', desc: 'Verified identity. No transaction history yet. Use for trial orders.' },
  { name: 'Established', desc: 'Verified identity. Completed transactions on record. Suitable for standard orders.' },
  { name: 'Trusted', desc: 'Verified identity. Strong transaction history. Preferred for large or important orders.' },
  { name: 'Premium', desc: 'Verified identity. Excellent transaction record. Top-rated by buyers over a sustained period.' },
] as const;

const PAYMENT_STEPS = [
  {
    n: '1',
    title: 'Browse the marketplace',
    body: 'Filter by crop type, county, and Trust Score tier. All information is visible without logging in.',
  },
  {
    n: '2',
    title: 'Place your order',
    body: "Select a listing and confirm the order. You can review the farmer's profile, Trust Score, and verification status at this point.",
  },
  {
    n: '3',
    title: 'Authorize payment via M-Pesa',
    body: 'An STK Push notification is sent to your registered phone number. Enter your M-Pesa PIN to authorize. Payment is triggered at the moment of order placement.',
  },
  {
    n: '4',
    title: 'Farmer confirms and dispatches',
    body: 'The farmer receives notification of your order and confirms dispatch. You are notified when the order is marked as dispatched.',
  },
  {
    n: '5',
    title: 'Receive and rate',
    body: "When you receive your order, confirm receipt and submit a rating. Your rating directly affects the farmer's Trust Score.",
  },
] as const;

const RISKS = [
  'Produce that does not match the listing description',
  'Produce that is underweight, a different variety, or in poor condition',
  'No automated dispute resolution for quality claims',
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const H2 = 'text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl';

export default function ForBuyersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid items-center gap-12 pt-24 pb-20 md:pb-28 lg:grid-cols-12`}>
          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              For buyers
            </p>
            <h1 className="text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
              Verified procurement.
              <br />
              Read before you buy.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
              A verified listing tells you who you are transacting with. It does not guarantee what
              arrives. Read what verification means before you commit.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center self-start rounded-sm bg-brand px-7 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover active:scale-95"
            >
              Browse the Marketplace
            </Link>
          </div>
          <div className="lg:col-span-5">
            <MediaFrame
              alt="A buyer reviewing fresh produce at a market"
              label="Produce at market"
              aspect="aspect-[4/5]"
              priority
            />
          </div>
        </div>
      </section>

      {/* What verified means */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <div className="flex flex-col gap-3">
            <h2 className={H2}>What verified procurement means</h2>
            <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
              A verified farmer listing means their identity documents were reviewed by a platform
              administrator who confirmed they represent a real person with documented land access.
              The verification status is not self-asserted. It is a human review decision.
            </p>
          </div>
          <div className="flex w-full flex-col gap-6 md:flex-row">
            <div className="flex flex-1 flex-col gap-5 rounded border-b-2 border-brand bg-surface p-10">
              <p className="text-lg font-semibold leading-snug text-brand">What this tells you</p>
              <p className="leading-relaxed text-fg-muted">
                You are transacting with a real person whose identity has been reviewed.
              </p>
              <p className="leading-relaxed text-fg-muted">
                Their listing includes their Trust Score and tier, a visible record of transaction
                history and buyer ratings.
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-5 rounded border-b-2 border-border-strong bg-surface p-10">
              <p className="text-lg font-semibold leading-snug text-fg">What this does not tell you</p>
              <p className="leading-relaxed text-fg-muted">Produce quality at the time of your order.</p>
              <p className="leading-relaxed text-fg-muted">Whether what arrives matches the listing exactly.</p>
              <p className="leading-relaxed text-fg-muted">An absolute guarantee of fulfillment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust tiers */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <div className="flex flex-col gap-3">
            <h2 className={H2}>How to read Trust Scores</h2>
            <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
              Trust Score is calculated from four components: verification status, completed
              transaction count, buyer ratings, and order reliability. It is not an opinion. It is a
              record.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tier) => (
              <div key={tier.name} className="flex flex-col gap-3 bg-surface p-7">
                <p className="text-base font-semibold text-fg">{tier.name}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{tier.desc}</p>
              </div>
            ))}
          </div>
          <p className="max-w-3xl font-medium leading-relaxed text-fg-muted">
            For a large or important order, prefer a Trusted or Premium farmer. For a trial order, a
            New farmer&apos;s verified status still confirms real identity.
          </p>
        </div>
      </section>

      {/* Payment */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <h2 className={H2}>How payment works</h2>
          <div className="grid grid-cols-1 divide-y divide-border border-y border-border">
            {PAYMENT_STEPS.map((step) => (
              <div key={step.n} className="flex items-start gap-6 py-6">
                <div className="flex shrink-0 items-center justify-center rounded-sm bg-brand px-3 py-1.5">
                  <span className="font-semibold text-brand-fg">{step.n}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <p className="text-lg font-semibold leading-snug text-fg">{step.title}</p>
                  <p className="leading-relaxed text-fg-muted">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="max-w-3xl font-medium leading-relaxed text-brand">
            You do not pay in advance of initiating an order. The STK Push is triggered at the moment
            of order placement, after you have seen all relevant information.
          </p>
        </div>
      </section>

      {/* Buyer risks */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-8 py-24`}>
          <div className="flex flex-col gap-3">
            <h2 className={H2}>What buyers risk</h2>
            <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
              Documented honestly. Verification addresses identity, not fulfillment quality.
            </p>
          </div>
          {RISKS.map((risk) => (
            <div key={risk} className="flex w-full items-center gap-4 border-b border-border pb-5 last:border-0">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-fg-subtle" />
              <p className="flex-1 leading-relaxed text-fg-muted">{risk}</p>
            </div>
          ))}
          <div className="flex w-full flex-col gap-3 rounded border-l-2 border-brand bg-surface-sunken px-10 py-8">
            <p className="text-sm font-semibold text-brand">Recourse</p>
            <p className="leading-relaxed text-fg-muted">
              Submit a rating with explanation after receiving your order. Ratings directly affect
              the farmer&apos;s Trust Score and future listing visibility. This is the recourse
              mechanism. It is how accountability accrues over time.
            </p>
          </div>
        </div>
      </section>

      {/* Browse CTA */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-8 py-24`}>
          <h2 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-fg md:text-5xl">
            Browse before you commit.
          </h2>
          <p className="max-w-2xl text-lg leading-relaxed text-fg-muted">
            Buyers can browse the full marketplace without registering. All active listings, farmer
            Trust Scores, county and crop filters, visible before you create an account. Registration
            is required only to place an order.
          </p>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center rounded-sm bg-brand px-8 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover active:scale-95"
            >
              Browse the Marketplace
            </Link>
            <Link
              href="/auth/register?role=BUYER"
              className="inline-flex items-center justify-center rounded-sm border border-border-strong px-8 py-4 font-medium text-fg transition-colors hover:bg-surface"
            >
              Register as a Buyer
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
