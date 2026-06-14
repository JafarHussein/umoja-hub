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

export default function ForCooperativesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#131619] px-[160px] py-[120px] flex flex-col gap-7">
        <p className="font-jakarta font-500 text-[0.875rem] tracking-[0.02em] text-[#D88A5A]">
          For Cooperatives
        </p>
        <h1 className="font-jakarta font-800 text-[4.5rem] leading-[1.05] tracking-[-0.03em] text-[#F2F0EC] w-[900px]">
          Collective input purchasing.
          <br />
          Bulk pricing as a group.
        </h1>
        <p className="font-jakarta font-400 text-[1.25rem] leading-[1.6] text-[#A9A29A] w-[840px]">
          Individual smallholder farmers cannot access bulk pricing on their own. Cooperative groups
          on UmojaHub place collective orders from verified suppliers — unlocking input pricing only
          available at scale.
        </p>
      </section>

      {/* S1 — What Groups Are */}
      <section className="bg-[#F5F4F0] px-[160px] py-[96px] flex flex-col gap-10">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#8A919A] uppercase">
          Section 01
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15] w-[900px]">
          What cooperative groups are
        </p>
        <p className="font-jakarta font-400 text-[1.125rem] leading-[1.6] text-[#353C45] w-[900px]">
          Cooperative groups are organized farmer groups on the platform that place collective bulk
          orders for agricultural inputs from verified suppliers. They exist inside the Food Security
          Hub — not as a separate registration pathway.
        </p>

        <div className="bg-[#ECE8E1] border-b-2 border-[#B86A3D] p-10 flex flex-col gap-4 w-full">
          <p className="font-jakarta font-600 text-[0.9375rem] tracking-[0.02em] text-[#B86A3D]">
            What groups unlock
          </p>
          <p className="font-jakarta font-400 text-[1rem] leading-[1.6] text-[#353C45]">
            {'→  '}Bulk agricultural input pricing not available to individual farmers
          </p>
          <p className="font-jakarta font-400 text-[1rem] leading-[1.6] text-[#353C45]">
            {'→  '}Seeds, fertilizers, and tools at collective-order rates
          </p>
          <p className="font-jakarta font-400 text-[1rem] leading-[1.6] text-[#353C45]">
            {'→  '}Coordinated ordering through a single verified supplier contact
          </p>
        </div>
      </section>

      {/* S2 — How It Works */}
      <section className="bg-[#131619] px-[160px] py-[96px] flex flex-col gap-10">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#878078] uppercase">
          Section 02
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#F2F0EC] leading-[1.15] w-[800px]">
          How groups work
        </p>

        {FLOW_STEPS.map((step) => (
          <div
            key={step.n}
            className="border-b border-[#2A3138] py-7 flex gap-8 items-start w-full"
          >
            <div className="bg-[#4A3A2A] px-[14px] py-[8px] shrink-0 flex items-center">
              <span className="font-jakarta font-600 text-[1rem] text-[#D88A5A]">{step.n}</span>
            </div>
            <div className="flex-1 flex flex-col gap-[10px]">
              <p className="font-jakarta font-600 text-[1.125rem] leading-[1.3] text-[#F2F0EC]">
                {step.title}
              </p>
              <p className="font-jakarta font-400 text-[1rem] leading-[1.6] text-[#A9A29A]">
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* S3 — Who + Limitations */}
      <section className="bg-[#ECE8E1] px-[160px] py-[96px] flex flex-col gap-10">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#8A919A] uppercase">
          Section 03
        </p>

        <div className="flex gap-10 items-start w-full">
          {/* Who can join */}
          <div className="flex-1 flex flex-col gap-5">
            <p className="font-jakarta font-600 text-[1.75rem] tracking-[-0.01em] leading-[1.2] text-[#1D232A]">
              Who can join
            </p>
            <p className="font-jakarta font-400 text-[1.0625rem] leading-[1.65] text-[#353C45]">
              Any verified farmer. There is no separate cooperative registration — if you are a
              verified farmer on the platform, you can create or join a cooperative group.
            </p>
            <p className="font-jakarta font-400 text-[1.0625rem] leading-[1.65] text-[#353C45]">
              Verification is required before participation. Unverified farmers cannot place
              collective orders.
            </p>
          </div>

          {/* Divider */}
          <div className="self-stretch w-px bg-[#C8C2BA] shrink-0" />

          {/* Limitations */}
          <div className="flex-1 flex flex-col gap-5">
            <p className="font-jakarta font-600 text-[1.75rem] tracking-[-0.01em] leading-[1.2] text-[#1D232A]">
              What the platform cannot guarantee
            </p>
            {LIMITATIONS.map((lim) => (
              <div key={lim} className="flex gap-3 items-center">
                <span className="shrink-0 size-[6px] bg-[#B86A3D]" />
                <p className="flex-1 font-jakarta font-400 text-[1rem] leading-[1.6] text-[#636C76]">
                  {lim}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#131619] px-[160px] py-[80px] flex flex-col gap-6">
        <p className="font-jakarta font-800 text-[3rem] leading-[1.1] tracking-[-0.02em] text-[#F2F0EC] w-[800px]">
          Start with farmer verification.
        </p>
        <p className="font-jakarta font-400 text-[1.125rem] leading-[1.6] text-[#A9A29A] w-[760px]">
          Cooperative group access is unlocked once you are a verified farmer. Complete farmer
          verification first, then join or form a group from your dashboard.
        </p>
        <Link
          href="/auth/register?role=FARMER"
          className="inline-flex items-center self-start bg-[#B86A3D] px-[40px] py-[18px] font-jakarta font-600 text-[1rem] text-[#F2F0EC] hover:opacity-90 transition-opacity"
        >
          Register as a Farmer
        </Link>
      </section>
    </>
  );
}
