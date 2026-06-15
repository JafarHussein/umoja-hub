import type { Metadata } from 'next';
import Link from 'next/link';
import { MediaFrame } from '@/components/website/MediaFrame';

export const metadata: Metadata = {
  title: 'For Cooperatives: Food Security Hub · UmojaHub',
  description:
    'Pool orders across your farmer group. Access bulk purchasing at verified prices through a single cooperative account.',
};

const FLOW_STEPS = [
  {
    n: '1',
    title: 'Verified farmers form a group',
    body: 'Any verified farmer can create or join a cooperative group on the platform. There is no separate cooperative registration. You must be a verified farmer to participate.',
  },
  {
    n: '2',
    title: 'The group nominates a supplier and places a collective order',
    body: 'The group selects a verified supplier from the platform directory and places a collective input order. Payment is coordinated through the group, not handled individually.',
  },
  {
    n: '3',
    title: 'Supplier fulfills the order',
    body: 'The verified supplier fulfills the collective order. Delivery logistics are coordinated between the supplier and group members. The platform records the transaction.',
  },
] as const;

const UNLOCKS = [
  'Bulk agricultural input pricing not available to individual farmers',
  'Seeds, fertilizers, and tools at collective-order rates',
  'Coordinated ordering through a single verified supplier contact',
] as const;

const LIMITATIONS = [
  'Minimum group size for any specific order',
  'Supplier availability for every input type',
  'That collective input costs will be lower than individual purchasing in all cases',
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const H2 = 'text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl';

export default function ForCooperativesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid items-center gap-12 pt-24 pb-20 md:pb-28 lg:grid-cols-12`}>
          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              For cooperatives
            </p>
            <h1 className="text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
              Bulk input pricing,
              <br />
              unlocked as a group.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
              Individual smallholder farmers cannot access bulk pricing alone. Cooperative groups
              place collective orders from verified suppliers, unlocking pricing only available at
              scale.
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
              alt="A cooperative of farmers coordinating a collective order"
              label="Cooperative group"
              aspect="aspect-[4/5]"
              priority
            />
          </div>
        </div>
      </section>

      {/* What groups are */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <div className="flex flex-col gap-3">
            <h2 className={H2}>What cooperative groups are</h2>
            <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
              Cooperative groups are organized farmer groups that place collective bulk orders for
              agricultural inputs from verified suppliers. They exist inside the Food Security Hub,
              not as a separate registration pathway.
            </p>
          </div>
          <div className="flex w-full flex-col gap-4 rounded border-l-2 border-brand bg-surface p-10">
            <p className="text-sm font-semibold text-brand">What groups unlock</p>
            {UNLOCKS.map((item) => (
              <p key={item} className="leading-relaxed text-fg-muted">{item}</p>
            ))}
          </div>
        </div>
      </section>

      {/* How groups work */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>How groups work</h2>
          <div className="grid grid-cols-1 divide-y divide-border border-y border-border">
            {FLOW_STEPS.map((step) => (
              <div key={step.n} className="flex items-start gap-6 py-7">
                <div className="flex shrink-0 items-center rounded-sm bg-surface-sunken px-3.5 py-2">
                  <span className="font-semibold text-brand">{step.n}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <p className="text-lg font-semibold leading-snug text-fg">{step.title}</p>
                  <p className="leading-relaxed text-fg-muted">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who + limitations */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24 md:flex-row md:gap-16`}>
          <div className="flex flex-1 flex-col gap-5">
            <h2 className={H2}>Who can join</h2>
            <p className="text-base leading-relaxed text-fg-muted">
              Any verified farmer. There is no separate cooperative registration. If you are a
              verified farmer, you can create or join a cooperative group.
            </p>
            <p className="text-base leading-relaxed text-fg-muted">
              Verification is required before participation. Unverified farmers cannot place
              collective orders.
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-5">
            <h2 className={H2}>What the platform cannot guarantee</h2>
            {LIMITATIONS.map((lim) => (
              <div key={lim} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-fg-subtle" />
                <p className="flex-1 leading-relaxed text-fg-muted">{lim}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-6 py-24`}>
          <h2 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-fg md:text-5xl">
            Start with farmer verification.
          </h2>
          <p className="max-w-2xl text-lg leading-relaxed text-fg-muted">
            Cooperative group access is unlocked once you are a verified farmer. Complete farmer
            verification first, then join or form a group from your dashboard.
          </p>
          <Link
            href="/auth/register?role=FARMER"
            className="inline-flex items-center justify-center self-start rounded-sm bg-brand px-7 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover active:scale-95"
          >
            Register as a Farmer
          </Link>
        </div>
      </section>
    </>
  );
}
