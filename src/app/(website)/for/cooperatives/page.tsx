import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'For Cooperatives — Food Security Hub · UmojaHub',
  description:
    'Pool orders across your farmer group. Access bulk purchasing at verified prices through a single cooperative account.',
};

const FLOW_STEPS = [
  {
    n: '1',
    title: 'Verified farmers form a group',
    body: 'Any verified farmer can create or join a cooperative group on the platform. There is no separate cooperative registration — you must be a verified farmer to participate.',
  },
  {
    n: '2',
    title: 'The group nominates a supplier and places a collective order',
    body: 'The group selects a verified supplier from the platform directory and places a collective input order. Payment is coordinated through the group — not handled individually.',
  },
  {
    n: '3',
    title: 'Supplier fulfills the order',
    body: 'The verified supplier fulfills the collective order. Delivery logistics are coordinated between the supplier and group members. The platform records the transaction.',
  },
] as const;

const LIMITATIONS = [
  'Minimum group size for any specific order',
  'Supplier availability for every input type',
  'That collective input costs will be lower than individual purchasing in all cases',
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const SECTION_LABEL = 'font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle';

export default function ForCooperativesPage() {
  return (
    <>
      {/* Hero */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-7 py-24`}>
          <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand-text">
            For Cooperatives
          </p>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
            Collective input purchasing.
            <br />
            Bulk pricing as a group.
          </h1>
          <p className="max-w-3xl text-xl leading-relaxed text-fg-muted">
            Individual smallholder farmers cannot access bulk pricing on their own. Cooperative groups
            on UmojaHub place collective orders from verified suppliers — unlocking input pricing only
            available at scale.
          </p>
        </div>
      </section>

      {/* S1 — What Groups Are */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <p className={SECTION_LABEL}>Section 01</p>
          <p className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            What cooperative groups are
          </p>
          <p className="max-w-4xl text-lg leading-relaxed text-fg-muted">
            Cooperative groups are organized farmer groups on the platform that place collective bulk
            orders for agricultural inputs from verified suppliers. They exist inside the Food Security
            Hub — not as a separate registration pathway.
          </p>

          <div className="flex w-full flex-col gap-4 border-b-2 border-brand bg-surface p-10">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              What groups unlock
            </p>
            <p className="leading-relaxed text-fg-muted">
              {'→  '}Bulk agricultural input pricing not available to individual farmers
            </p>
            <p className="leading-relaxed text-fg-muted">
              {'→  '}Seeds, fertilizers, and tools at collective-order rates
            </p>
            <p className="leading-relaxed text-fg-muted">
              {'→  '}Coordinated ordering through a single verified supplier contact
            </p>
          </div>
        </div>
      </section>

      {/* S2 — How It Works */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <p className={SECTION_LABEL}>Section 02</p>
          <p className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            How groups work
          </p>

          {FLOW_STEPS.map((step) => (
            <div key={step.n} className="flex w-full items-start gap-8 border-b border-border py-7">
              <div className="flex shrink-0 items-center rounded-sm bg-surface-raised px-3.5 py-2">
                <span className="font-semibold text-brand-text">{step.n}</span>
              </div>
              <div className="flex flex-1 flex-col gap-2.5">
                <p className="text-lg font-semibold leading-snug text-fg">{step.title}</p>
                <p className="leading-relaxed text-fg-muted">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* S3 — Who + Limitations */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <p className={SECTION_LABEL}>Section 03</p>

          <div className="flex w-full flex-col items-start gap-10 md:flex-row">
            {/* Who can join */}
            <div className="flex flex-1 flex-col gap-5">
              <p className="text-2xl font-semibold leading-tight tracking-tight text-fg md:text-3xl">
                Who can join
              </p>
              <p className="text-base leading-relaxed text-fg-muted">
                Any verified farmer. There is no separate cooperative registration — if you are a
                verified farmer on the platform, you can create or join a cooperative group.
              </p>
              <p className="text-base leading-relaxed text-fg-muted">
                Verification is required before participation. Unverified farmers cannot place
                collective orders.
              </p>
            </div>

            {/* Divider */}
            <div className="hidden w-px self-stretch bg-border md:block" />

            {/* Limitations */}
            <div className="flex flex-1 flex-col gap-5">
              <p className="text-2xl font-semibold leading-tight tracking-tight text-fg md:text-3xl">
                What the platform cannot guarantee
              </p>
              {LIMITATIONS.map((lim) => (
                <div key={lim} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 shrink-0 bg-fg-subtle" />
                  <p className="flex-1 leading-relaxed text-fg-muted">{lim}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-6 py-20`}>
          <p className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-fg md:text-5xl">
            Start with farmer verification.
          </p>
          <p className="max-w-2xl text-lg leading-relaxed text-fg-muted">
            Cooperative group access is unlocked once you are a verified farmer. Complete farmer
            verification first, then join or form a group from your dashboard.
          </p>
          <Link
            href="/auth/register?role=FARMER"
            className="inline-flex items-center self-start rounded-sm bg-brand px-10 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
          >
            Register as a Farmer
          </Link>
        </div>
      </section>
    </>
  );
}
