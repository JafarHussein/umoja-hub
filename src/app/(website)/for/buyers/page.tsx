import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'For Buyers — Food Security Hub · UmojaHub',
  description:
    'Buy directly from verified Kenyan farmers. Every listing shows a Trust Score. Pay through M-Pesa.',
};

const TIERS = [
  {
    name: 'NEW',
    bg: 'bg-[#39414A]',
    labelColor: 'text-[#A9A29A]',
    desc: 'Verified identity. No transaction history yet. Use for trial orders.',
  },
  {
    name: 'ESTABLISHED',
    bg: 'bg-[#4A3A2A]',
    labelColor: 'text-[#D88A5A]',
    desc: 'Verified identity. Completed transactions on record. Suitable for standard orders.',
  },
  {
    name: 'TRUSTED',
    bg: 'bg-[#1E3535]',
    labelColor: 'text-[#56A8A2]',
    desc: 'Verified identity. Strong transaction history. Preferred for large or important orders.',
  },
  {
    name: 'PREMIUM',
    bg: 'bg-[#2D2645]',
    labelColor: 'text-[#9581CC]',
    desc: 'Verified identity. Excellent transaction record. Top-rated by buyers over sustained period.',
  },
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

export default function ForBuyersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#131619] px-[160px] py-[120px] flex flex-col gap-6">
        <p className="font-jakarta font-500 text-[0.875rem] tracking-[0.02em] text-[#56A8A2]">
          For Buyers
        </p>
        <h1 className="font-jakarta font-800 text-[4.5rem] leading-[1.05] tracking-[-0.03em] text-[#F2F0EC] w-[900px]">
          Verified procurement.
          <br />
          Read before you buy.
        </h1>
        <div className="flex flex-col w-[740px]">
          <p className="font-jakarta font-400 text-[1.25rem] leading-[1.6] text-[#A9A29A]">
            A verified listing tells you who you are transacting with.
          </p>
          <p className="font-jakarta font-400 text-[1.25rem] leading-[1.6] text-[#A9A29A]">
            It does not guarantee what arrives. Read what it means before you commit.
          </p>
        </div>
      </section>

      {/* S1 — What Verified Means */}
      <section className="bg-[#F5F4F0] px-[160px] py-[96px] flex flex-col gap-12">
        <div className="flex flex-col gap-3">
          <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#8A919A] uppercase">
            Section 01
          </p>
          <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15] w-[800px]">
            What verified procurement means
          </p>
          <p className="font-jakarta font-400 text-[1.125rem] leading-[1.6] text-[#353C45] w-[760px]">
            A verified farmer listing means their identity documents were reviewed by a platform
            administrator who confirmed they represent a real person with documented land access. The
            verification status is not self-asserted — it is a human review decision.
          </p>
        </div>

        <div className="flex gap-6 w-full">
          {/* IS card */}
          <div className="flex-1 bg-[#ECE8E1] border-b-2 border-[#2E7D78] p-10 flex flex-col gap-5">
            <p className="font-jakarta font-600 text-[1.125rem] leading-[1.3] text-[#2E7D78]">
              What this tells you
            </p>
            <p className="font-jakarta font-400 text-[1rem] leading-[1.6] text-[#353C45]">
              {'→  '}You are transacting with a real person whose identity has been reviewed
            </p>
            <p className="font-jakarta font-400 text-[1rem] leading-[1.6] text-[#353C45]">
              {'→  '}Their listing includes their Trust Score and tier — a visible record of
              transaction history and buyer ratings
            </p>
          </div>

          {/* IS NOT card */}
          <div className="flex-1 bg-[#ECE8E1] border-b-2 border-[#B86A3D] p-10 flex flex-col gap-5">
            <p className="font-jakarta font-600 text-[1.125rem] leading-[1.3] text-[#B86A3D]">
              What this does NOT tell you
            </p>
            <p className="font-jakarta font-400 text-[1rem] leading-[1.6] text-[#353C45]">
              {'×  '}Produce quality at the time of your order
            </p>
            <p className="font-jakarta font-400 text-[1rem] leading-[1.6] text-[#353C45]">
              {'×  '}Whether what arrives matches the listing exactly
            </p>
            <p className="font-jakarta font-400 text-[1rem] leading-[1.6] text-[#353C45]">
              {'×  '}An absolute guarantee of fulfillment
            </p>
          </div>
        </div>
      </section>

      {/* S2 — Trust Score Tiers */}
      <section className="bg-[#131619] px-[160px] py-[96px] flex flex-col gap-12">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#878078] uppercase">
          Section 02
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#F2F0EC] leading-[1.15] w-[800px]">
          How to read Trust Scores
        </p>
        <p className="font-jakarta font-400 text-[1.125rem] leading-[1.6] text-[#A9A29A] w-[760px]">
          Trust Score is calculated from four components: verification status, completed transaction
          count, buyer ratings, and order reliability. It is not an opinion — it is a record.
        </p>

        <div className="flex gap-4 w-full">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex-1 ${tier.bg} rounded-[2px] px-7 py-8 flex flex-col gap-4`}
            >
              <p
                className={`font-jakarta font-600 text-[0.8125rem] tracking-[0.08em] ${tier.labelColor}`}
              >
                {tier.name}
              </p>
              <p className="font-jakarta font-400 text-[0.875rem] leading-[1.6] text-[#D6D1CB]">
                {tier.desc}
              </p>
            </div>
          ))}
        </div>

        <p className="font-jakarta font-500 text-[1rem] leading-[1.6] text-[#878078] w-[900px]">
          For a large or important order, prefer a TRUSTED or PREMIUM farmer. For a trial order, a
          NEW farmer&#39;s verified status still confirms real identity.
        </p>
      </section>

      {/* S3 — Payment */}
      <section className="bg-[#ECE8E1] px-[160px] py-[96px] flex flex-col gap-12">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#8A919A] uppercase">
          Section 03
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15] w-[800px]">
          How payment works
        </p>

        {PAYMENT_STEPS.map((step) => (
          <div
            key={step.n}
            className="border-b border-[#C8C2BA] py-6 flex gap-8 items-start w-full"
          >
            <div className="bg-[#1D232A] px-3 py-[6px] shrink-0 flex items-center justify-center">
              <span className="font-jakarta font-600 text-[1rem] text-[#F2F0EC]">{step.n}</span>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <p className="font-jakarta font-600 text-[1.125rem] leading-[1.3] text-[#1D232A]">
                {step.title}
              </p>
              <p className="font-jakarta font-400 text-[1rem] leading-[1.6] text-[#636C76]">
                {step.body}
              </p>
            </div>
          </div>
        ))}

        <p className="font-jakarta font-500 text-[1rem] leading-[1.6] text-[#2E7D78] w-[900px]">
          You do not pay in advance of initiating an order — the STK Push is triggered at the moment
          of order placement, after you have seen all relevant information.
        </p>
      </section>

      {/* S4 — Buyer Risks */}
      <section className="bg-[#F5F4F0] px-[160px] py-[96px] flex flex-col gap-8">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#8A919A] uppercase">
          Section 04
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15] w-[800px]">
          What buyers risk
        </p>
        <p className="font-jakarta font-400 text-[1.125rem] leading-[1.6] text-[#353C45] w-[760px]">
          Documented honestly. Verification addresses identity — not fulfillment quality.
        </p>

        {RISKS.map((risk) => (
          <div key={risk} className="flex gap-4 items-center w-full">
            <span className="shrink-0 size-[8px] bg-[#B86A3D]" />
            <p className="flex-1 font-jakarta font-400 text-[1.0625rem] leading-[1.6] text-[#353C45]">
              {risk}
            </p>
          </div>
        ))}

        <div className="bg-[#ECE8E1] border-l-[3px] border-[#2E7D78] px-10 py-8 flex flex-col gap-3 w-full">
          <p className="font-jakarta font-600 text-[0.8125rem] tracking-[0.08em] text-[#2E7D78]">
            Recourse
          </p>
          <p className="font-jakarta font-400 text-[1rem] leading-[1.6] text-[#353C45]">
            Submit a rating with explanation after receiving your order. Ratings directly affect the
            farmer&#39;s Trust Score and future listing visibility. This is the recourse mechanism —
            it is how accountability accrues over time.
          </p>
        </div>
      </section>

      {/* S5 — Browse CTA */}
      <section className="bg-[#131619] px-[160px] py-[96px] flex flex-col gap-8">
        <p className="font-jakarta font-800 text-[3.25rem] leading-[1.1] tracking-[-0.02em] text-[#F2F0EC] w-[900px]">
          Browse before you commit.
        </p>
        <p className="font-jakarta font-400 text-[1.125rem] leading-[1.6] text-[#A9A29A] w-[740px]">
          Buyers can browse the full marketplace without registering. All active listings, farmer
          Trust Scores, county and crop filters — visible before you create an account. Registration
          is required only to place an order.
        </p>
        <div className="flex gap-4 items-center">
          <Link
            href="/marketplace"
            className="inline-flex items-center bg-[#B86A3D] px-8 py-4 font-jakarta font-600 text-[1rem] text-[#F2F0EC] hover:opacity-90 transition-opacity"
          >
            Browse the Marketplace
          </Link>
          <Link
            href="/auth/register?role=BUYER"
            className="inline-flex items-center border border-[#39414A] px-8 py-4 font-jakarta font-400 text-[1rem] text-[#A9A29A] hover:opacity-90 transition-opacity"
          >
            Register as a Buyer
          </Link>
        </div>
      </section>
    </>
  );
}
