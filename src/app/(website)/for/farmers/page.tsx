import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'For Farmers — Food Security Hub · UmojaHub',
  description:
    'Verified farmers sell further. Connect to buyers outside your local network, get paid via M-Pesa before dispatch, and build a Trust Score with every transaction.',
};

const BENEFITS = [
  'Access to buyers outside your social and geographic network via a publicly searchable listing.',
  'Price transparency — your listed price compared against verified weekly market benchmarks for ten major Kenyan crops.',
  'M-Pesa payment confirmed before dispatch. Payment arrives via Safaricom to your registered phone.',
  'Trust Score that accumulates across transactions, increasing your listing visibility over time.',
  'SMS notifications for order status, payment confirmation, and price alerts.',
  'AI farm assistant available in your dashboard after registration.',
  'Cooperative group access for bulk agricultural input purchasing.',
] as const;

const LIMITATIONS = [
  'Buyers for your produce — demand depends on market conditions.',
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
  { name: 'NEW', desc: 'Recently verified. Few or no completed transactions.' },
  { name: 'ESTABLISHED', desc: 'Verified with a documented transaction history.' },
  { name: 'TRUSTED', desc: 'Verified with strong history of positive ratings and consistent fulfillment.' },
  { name: 'PREMIUM', desc: 'Highest tier. Deep transaction history and consistently high ratings.' },
] as const;

const MPESA_STEPS = [
  { n: '1', text: 'Buyer places order on the platform.' },
  { n: '2', text: "Platform initiates an M-Pesa STK Push to the buyer's registered phone." },
  { n: '3', text: 'Buyer receives a prompt on their device and enters their M-Pesa PIN.' },
  { n: '4', text: "Safaricom processes the transaction and sends a confirmation to UmojaHub's callback endpoint." },
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
const EYEBROW = 'font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand';

export default function ForFarmersPage() {
  return (
    <>
      {/* Section/Hero */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-5 py-24`}>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-fg-subtle">Food Security Hub</span>
            <span className="text-fg-subtle">/</span>
            <span className="text-brand-text">For Farmers</span>
          </div>
          <p className={EYEBROW}>For Farmers</p>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
            Verified farmers sell further.
            <br />
            At their own price.
            <br />
            Paid before dispatch.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-fg-muted">
            UmojaHub connects verified smallholder farmers to buyers outside their local network.
            Verification is done once. Every listing and payment builds your Trust Score.
          </p>
          <Link
            href="/auth/register?role=FARMER"
            className="inline-flex items-center self-start rounded-sm bg-brand px-7 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
          >
            Register as a Farmer →
          </Link>
        </div>
      </section>

      {/* Section/WhatYouGet */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <p className={EYEBROW}>What You Get</p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            Precise. No vague promises.
          </h2>
          <div className="flex w-full flex-col gap-8 md:flex-row">
            {/* Benefits */}
            <div className="flex flex-1 flex-col gap-6 rounded-sm border border-border bg-surface p-10">
              <p className="font-semibold text-fg">What participation gives you</p>
              {BENEFITS.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <p className="flex-1 text-sm leading-relaxed text-fg-muted">{item}</p>
                </div>
              ))}
            </div>

            {/* Limitations */}
            <div className="flex flex-1 flex-col gap-5 rounded-sm border border-border bg-surface p-10">
              <p className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
                What It Does Not Guarantee
              </p>
              {LIMITATIONS.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="shrink-0 font-medium text-fg-subtle">—</span>
                  <p className="flex-1 text-sm leading-relaxed text-fg-muted">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section/VerificationProcess */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <p className={EYEBROW}>The Verification Process</p>
          <div className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            <p>Done once.</p>
            <p>Builds your record permanently.</p>
          </div>
          <div className="flex w-full flex-col gap-8 md:flex-row">
            {/* Documents */}
            <div className="flex flex-1 flex-col gap-5 rounded-sm border border-border bg-surface p-10">
              <p className="font-semibold text-fg">Documents required</p>
              {DOCUMENTS.map((doc) => (
                <div key={doc.title} className="flex flex-col gap-1 rounded-sm bg-surface-sunken p-4">
                  <p className="text-sm font-semibold text-fg">{doc.title}</p>
                  <p className="text-sm text-fg-muted">{doc.sub}</p>
                </div>
              ))}
              <p className="font-ibm-mono text-xs leading-relaxed text-fg-subtle">
                Document content is NOT visible to buyers or other farmers.
                <br />
                Only your verified / unverified status is public.
              </p>
            </div>

            {/* AdminReview */}
            <div className="flex flex-1 flex-col gap-6 rounded-sm border border-border bg-surface p-10">
              <p className="font-semibold text-fg">What the administrator does</p>
              <div className="flex flex-col gap-4 leading-relaxed text-fg-muted">
                <p>
                  A named administrator reviews your submitted documents for consistency and
                  plausibility — are the documents consistent with each other? Do they represent a
                  real person with a documented connection to land?
                </p>
                <p>
                  The administrator does NOT assess farm quality, produce quality, or business
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
                  You receive a reason via SMS. Rejection is correctable — resubmit with additional
                  documentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section/TrustScore */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand-text">
            Trust Score
          </p>
          <div className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            <p>Built from real transactions.</p>
            <p>Not from self-reporting.</p>
          </div>

          {/* 4 component cards */}
          <div className="flex w-full flex-col gap-4 md:flex-row">
            {TRUST_COMPONENTS.map((c) => (
              <div
                key={c.index}
                className="flex flex-1 flex-col gap-3 rounded-sm border border-border bg-surface px-6 py-7"
              >
                <span className="font-ibm-mono text-xs text-brand-text">{c.index}</span>
                <p className="font-semibold leading-snug text-fg">{c.title}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* 4 tier cards */}
          <div className="flex w-full flex-col gap-4 md:flex-row">
            {TRUST_TIERS.map((tier) => (
              <div
                key={tier.name}
                className="flex flex-1 flex-col gap-2.5 rounded-sm border border-border bg-surface p-6"
              >
                <div className="inline-flex self-start rounded-full border border-border-strong px-2.5 py-1">
                  <span className="font-ibm-mono text-xs tracking-wide text-fg-muted">{tier.name}</span>
                </div>
                <p className="text-sm leading-relaxed text-fg-muted">{tier.desc}</p>
              </div>
            ))}
          </div>

          <Link
            href="/trust"
            className="text-sm font-medium text-brand-text transition-opacity hover:opacity-80"
          >
            Complete Trust Score methodology → /trust
          </Link>
        </div>
      </section>

      {/* Section/MpesaPayment */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <p className={EYEBROW}>M-Pesa Payment</p>
          <div className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            <p>Payment confirmed</p>
            <p>before you dispatch.</p>
          </div>

          {/* 9-step grid — 3 rows of 3, adjacent tiles */}
          <div className="flex w-full flex-col">
            {[MPESA_STEPS.slice(0, 3), MPESA_STEPS.slice(3, 6), MPESA_STEPS.slice(6, 9)].map(
              (row, rowIdx) => (
                <div key={rowIdx} className="flex w-full flex-col sm:flex-row">
                  {row.map((step) => (
                    <div
                      key={step.n}
                      className="flex flex-1 flex-col gap-3 border border-border bg-surface p-7"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand">
                        <span className="text-xs font-semibold text-brand-fg">{step.n}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-fg-muted">{step.text}</p>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Failure notice */}
          <div className="flex w-full items-start gap-4 rounded-sm border border-warning/30 bg-warning/10 px-6 py-5">
            <span className="shrink-0 font-semibold text-warning">!</span>
            <p className="flex-1 text-sm leading-relaxed text-fg-muted">
              Payment failure (STK Push timeout, declined, or network error): no money moves. Order
              stays PENDING. Buyer can retry or cancel. There is no financial risk to the farmer —
              payment must confirm before dispatch obligation begins.
            </p>
          </div>
        </div>
      </section>

      {/* Section/FailureModes */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-20`}>
          <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle">
            Platform Limits — Disclosed
          </p>
          <p className="text-3xl font-semibold leading-tight tracking-tight text-fg">
            What can go wrong, and what happens.
          </p>
          <div className="flex w-full flex-col gap-6 md:flex-row">
            {FAILURE_MODES.map((item) => (
              <div
                key={item.title}
                className="flex flex-1 flex-col gap-2.5 rounded-sm border border-border bg-surface p-7"
              >
                <p className="font-semibold text-fg">{item.title}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section/RegistrationCTA */}
      <section className="bg-brand">
        <div className={`${CONTAINER} flex flex-col items-center gap-6 py-20`}>
          <p className="text-center text-3xl font-semibold leading-tight tracking-tight text-brand-fg md:text-4xl">
            Ready to register?
          </p>
          <p className="max-w-xl text-center leading-relaxed text-brand-fg/85">
            Verification takes one round of document submission. Once approved, your listings are
            live immediately.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/auth/register?role=FARMER"
              className="inline-flex items-center rounded-sm bg-brand-fg px-7 py-4 font-semibold text-brand transition-opacity hover:opacity-90"
            >
              Register as a Farmer →
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-sm border border-brand-fg/40 px-7 py-4 font-medium text-brand-fg transition-colors hover:bg-brand-fg/10"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
