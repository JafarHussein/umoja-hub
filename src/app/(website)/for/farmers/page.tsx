import type { Metadata } from 'next';
import Link from 'next/link';
import { MediaFrame } from '@/components/website/MediaFrame';

export const metadata: Metadata = {
  title: 'For Farmers: Food Security Hub · UmojaHub',
  description:
    'Verified farmers sell further. Connect to buyers outside your local network, get paid via M-Pesa before dispatch, and build a Trust Score with every transaction.',
};

const BENEFITS = [
  'Access to buyers outside your social and geographic network via a publicly searchable listing.',
  'Price transparency: your listed price compared against verified weekly market benchmarks for ten major Kenyan crops.',
  'M-Pesa payment confirmed before dispatch. Payment arrives via Safaricom to your registered phone.',
  'Trust Score that accumulates across transactions, increasing your listing visibility over time.',
  'SMS notifications for order status, payment confirmation, and price alerts.',
  'AI farm assistant available in your dashboard after registration.',
  'Cooperative group access for bulk agricultural input purchasing.',
] as const;

const LIMITATIONS = [
  'Buyers for your produce. Demand depends on market conditions.',
  'Higher income than your current channels.',
  'Produce quality verification on behalf of buyers.',
  'Dispute resolution for produce quality claims after delivery.',
] as const;

const DOCUMENTS = [
  { title: 'National ID or Kenyan passport', sub: 'Identity document' },
  { title: 'Land documentation', sub: 'Title deed, lease agreement, or tenancy letter' },
  { title: 'Farm or produce photograph', sub: 'Visual confirmation of farming activity' },
] as const;

const TRUST_COMPONENTS = [
  { index: '01', title: 'Verification status', desc: 'Binary: verified or not. Required to list.' },
  { index: '02', title: 'Transaction volume', desc: 'Count of completed, paid orders.' },
  { index: '03', title: 'Buyer ratings', desc: 'Average rating from post-transaction feedback.' },
  { index: '04', title: 'Order reliability', desc: 'Fulfilled orders vs total orders over a rolling window.' },
] as const;

const TRUST_TIERS = [
  { name: 'New', desc: 'Recently verified. Few or no completed transactions.' },
  { name: 'Established', desc: 'Verified with a documented transaction history.' },
  { name: 'Trusted', desc: 'Verified with strong history of positive ratings and consistent fulfillment.' },
  { name: 'Premium', desc: 'Highest tier. Deep transaction history and consistently high ratings.' },
] as const;

const MPESA_STEPS = [
  { n: '1', text: 'Buyer places order on the platform.' },
  { n: '2', text: "Platform initiates an M-Pesa STK Push to the buyer's registered phone." },
  { n: '3', text: 'Buyer receives a prompt on their device and enters their M-Pesa PIN.' },
  { n: '4', text: "Safaricom processes the transaction and confirms to UmojaHub's callback endpoint." },
  { n: '5', text: 'Order status updates from PENDING to PAID.' },
  { n: '6', text: 'Farmer receives an SMS with order details and payment confirmation.' },
  { n: '7', text: 'Farmer dispatches produce.' },
  { n: '8', text: 'Buyer marks order RECEIVED.' },
  { n: '9', text: 'Both parties submit ratings.' },
] as const;

const FAILURE_MODES = [
  {
    title: 'Non-dispatch after payment',
    desc: 'If a farmer consistently fails to dispatch after payment, their order reliability score degrades. Administrators can review accounts with sustained non-dispatch patterns.',
  },
  {
    title: 'Review backlog',
    desc: 'If submission volume exceeds administrator capacity, the review queue backs up. Farmers in PENDING status cannot list until their review completes. There is no automated fallback.',
  },
  {
    title: 'Trust Score gaming',
    desc: 'The verification requirement connects any bad actor to a real, verified identity. The cost of building a fraudulent score is the real transactions required to do it.',
  },
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const H2 = 'text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl';

export default function ForFarmersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid items-center gap-12 pt-24 pb-20 md:pb-28 lg:grid-cols-12`}>
          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              For farmers
            </p>
            <h1 className="text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
              Sell further, at your price.
              <br />
              Paid before you dispatch.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
              UmojaHub connects verified smallholder farmers to buyers outside their local network.
              Verify once. Every listing and payment builds your Trust Score.
            </p>
            <Link
              href="/auth/register?role=FARMER"
              className="inline-flex items-center justify-center self-start rounded-sm bg-brand px-7 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover active:scale-95"
            >
              Register as a Farmer
            </Link>
          </div>
          <div className="lg:col-span-5">
            <MediaFrame
              alt="A verified farmer with produce ready for market"
              label="Farmer with produce"
              aspect="aspect-[4/5]"
              priority
            />
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <h2 className={H2}>What you get. No vague promises.</h2>
          <div className="flex w-full flex-col gap-8 md:flex-row">
            <div className="flex flex-1 flex-col gap-6 rounded border border-border bg-surface p-10">
              <p className="text-sm font-semibold text-brand">What participation gives you</p>
              {BENEFITS.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <p className="flex-1 text-sm leading-relaxed text-fg-muted">{item}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-5 rounded border border-border bg-surface p-10">
              <p className="text-sm font-semibold text-fg-subtle">What it does not guarantee</p>
              {LIMITATIONS.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="shrink-0 font-medium text-fg-subtle">/</span>
                  <p className="flex-1 text-sm leading-relaxed text-fg-muted">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Verification process */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <h2 className={H2}>Done once. Builds your record permanently.</h2>
          <div className="flex w-full flex-col gap-8 md:flex-row">
            <div className="flex flex-1 flex-col gap-5 rounded border border-border bg-surface p-10">
              <p className="text-sm font-semibold text-fg">Documents required</p>
              {DOCUMENTS.map((doc) => (
                <div key={doc.title} className="flex flex-col gap-1 rounded-sm bg-surface-sunken p-4">
                  <p className="text-sm font-semibold text-fg">{doc.title}</p>
                  <p className="text-sm text-fg-muted">{doc.sub}</p>
                </div>
              ))}
              <p className="font-ibm-mono text-xs leading-relaxed text-fg-subtle">
                Document content is not visible to buyers or other farmers. Only your verified or
                unverified status is public.
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-6 rounded border border-border bg-surface p-10">
              <p className="text-sm font-semibold text-fg">What the administrator does</p>
              <div className="flex flex-col gap-4 leading-relaxed text-fg-muted">
                <p>
                  A named administrator reviews your submitted documents for consistency and
                  plausibility. Are the documents consistent with each other? Do they represent a
                  real person with a documented connection to land?
                </p>
                <p>
                  The administrator does not assess farm quality, produce quality, or business
                  viability.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 rounded-sm bg-success/10 p-4">
                <p className="font-ibm-mono text-xs uppercase tracking-wide text-success">Approved</p>
                <p className="text-sm leading-relaxed text-fg-muted">
                  Farmer status becomes VERIFIED. Listings are immediately possible.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 rounded-sm bg-warning/10 p-4">
                <p className="font-ibm-mono text-xs uppercase tracking-wide text-warning">Rejected</p>
                <p className="text-sm leading-relaxed text-fg-muted">
                  You receive a reason via SMS. Rejection is correctable. Resubmit with additional
                  documentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Score */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <h2 className={H2}>Built from real transactions, not self-reporting.</h2>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_COMPONENTS.map((c) => (
              <div key={c.index} className="flex flex-col gap-3 bg-surface p-7">
                <span className="font-ibm-mono text-xs text-brand">{c.index}</span>
                <p className="font-semibold leading-snug text-fg">{c.title}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_TIERS.map((tier) => (
              <div key={tier.name} className="flex flex-col gap-2.5 bg-surface p-7">
                <p className="text-base font-semibold text-fg">{tier.name}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{tier.desc}</p>
              </div>
            ))}
          </div>

          <Link
            href="/trust"
            className="text-sm font-semibold text-brand transition-colors hover:text-brand-hover"
          >
            Complete Trust Score methodology at /trust
          </Link>
        </div>
      </section>

      {/* M-Pesa payment */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <h2 className={H2}>Payment confirmed before you dispatch.</h2>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {MPESA_STEPS.map((step) => (
              <div key={step.n} className="flex flex-col gap-3 bg-surface p-7">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand">
                  <span className="text-xs font-semibold text-brand-fg">{step.n}</span>
                </div>
                <p className="text-sm leading-relaxed text-fg-muted">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="flex w-full items-start gap-4 rounded-sm border border-warning/30 bg-warning/10 px-6 py-5">
            <span className="shrink-0 font-semibold text-warning">!</span>
            <p className="flex-1 text-sm leading-relaxed text-fg-muted">
              Payment failure (STK Push timeout, declined, or network error) moves no money. The
              order stays PENDING. The buyer can retry or cancel. There is no financial risk to the
              farmer. Payment must confirm before any dispatch obligation begins.
            </p>
          </div>
        </div>
      </section>

      {/* Failure modes */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>What can go wrong, and what happens.</h2>
          <div className="grid grid-cols-1 divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0">
            {FAILURE_MODES.map((item) => (
              <div key={item.title} className="flex flex-col gap-2.5 py-8 md:px-8 md:py-2 md:first:pl-0 md:last:pr-0">
                <p className="font-semibold text-fg">{item.title}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration CTA */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col items-center gap-6 py-24 text-center`}>
          <h2 className={H2}>Ready to register?</h2>
          <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
            Verification takes one round of document submission. Once approved, your listings are
            live immediately.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/auth/register?role=FARMER"
              className="inline-flex items-center justify-center rounded-sm bg-brand px-7 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover active:scale-95"
            >
              Register as a Farmer
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-sm border border-border-strong px-7 py-4 font-medium text-fg transition-colors hover:bg-surface-sunken"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
