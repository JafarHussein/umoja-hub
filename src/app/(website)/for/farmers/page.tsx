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

const TRUST_TIERS_DARK = [
  { name: 'NEW', pillBorder: 'border-[#878078]', pillText: 'text-[#878078]', desc: 'Recently verified. Few or no completed transactions.' },
  { name: 'ESTABLISHED', pillBorder: 'border-[#B86A3D]', pillText: 'text-[#B86A3D]', desc: 'Verified with a documented transaction history.' },
  { name: 'TRUSTED', pillBorder: 'border-[#56A8A2]', pillText: 'text-[#56A8A2]', desc: 'Verified with strong history of positive ratings and consistent fulfillment.' },
  { name: 'PREMIUM', pillBorder: 'border-[#9581CC]', pillText: 'text-[#9581CC]', desc: 'Highest tier. Deep transaction history and consistently high ratings.' },
] as const;

const MPESA_STEPS = [
  { n: '1', text: 'Buyer places order on the platform.', badge: 'bg-[#B86A3D]' },
  { n: '2', text: "Platform initiates an M-Pesa STK Push to the buyer's registered phone.", badge: 'bg-[#B86A3D]' },
  { n: '3', text: 'Buyer receives a prompt on their device and enters their M-Pesa PIN.', badge: 'bg-[#B86A3D]' },
  { n: '4', text: "Safaricom processes the transaction and sends a confirmation to UmojaHub's callback endpoint.", badge: 'bg-[#B86A3D]' },
  { n: '5', text: 'Order status updates from PENDING to PAID.', badge: 'bg-[#2E7D78]' },
  { n: '6', text: 'Farmer receives an SMS with order details and payment confirmation.', badge: 'bg-[#2E7D78]' },
  { n: '7', text: 'Farmer dispatches produce.', badge: 'bg-[#B86A3D]' },
  { n: '8', text: 'Buyer marks order RECEIVED.', badge: 'bg-[#B86A3D]' },
  { n: '9', text: 'Both parties submit ratings.', badge: 'bg-[#B86A3D]' },
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

export default function ForFarmersPage() {
  return (
    <>
      {/* Section/Hero */}
      <section className="bg-[#131619] px-[120px] py-[96px] flex flex-col gap-5">
        <div className="flex items-center gap-2 font-jakarta font-500 text-[0.8125rem]">
          <span className="text-[#636C76]">Food Security Hub</span>
          <span className="text-[#39414A]">/</span>
          <span className="text-[#B86A3D]">For Farmers</span>
        </div>
        <p className="font-jakarta font-600 text-[0.6875rem] tracking-[0.06em] text-[#B86A3D] uppercase">
          For Farmers
        </p>
        <h1 className="font-jakarta font-800 text-[3.75rem] leading-[1.05] tracking-[-0.03em] text-[#F2F0EC] max-w-[900px]">
          Verified farmers sell further.
          <br />
          At their own price.
          <br />
          Paid before dispatch.
        </h1>
        <p className="font-jakarta font-400 text-[1.125rem] leading-[1.6] text-[#A9A29A] max-w-[680px]">
          UmojaHub connects verified smallholder farmers to buyers outside their local network.
          Verification is done once. Every listing and payment builds your Trust Score.
        </p>
        <Link
          href="/auth/register?role=FARMER"
          className="inline-flex self-start items-center px-[28px] py-[16px] rounded-[4px] bg-[#B86A3D] text-[#F5F4F0] font-jakarta font-600 text-[1rem] hover:bg-[#A05A30] transition-colors"
        >
          Register as a Farmer →
        </Link>
      </section>

      {/* Section/WhatYouGet */}
      <section className="bg-[#F5F4F0] px-[120px] py-[96px] flex flex-col gap-12">
        <p className="font-jakarta font-600 text-[0.6875rem] tracking-[0.06em] text-[#B86A3D] uppercase">
          What You Get
        </p>
        <p className="font-jakarta font-600 text-[2.25rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15]">
          Precise. No vague promises.
        </p>
        <div className="flex gap-8 w-full">
          {/* Benefits */}
          <div className="flex-1 bg-[#ECE8E1] border border-[#D8D3CC] rounded-[2px] p-[40px] flex flex-col gap-6">
            <p className="font-jakarta font-600 text-[1rem] tracking-[0.005em] text-[#1D232A]">
              What participation gives you
            </p>
            {BENEFITS.map((item) => (
              <div key={item} className="flex gap-3 items-start">
                <span className="shrink-0 w-[6px] h-[6px] rounded-full bg-[#B86A3D] mt-[9px]" />
                <p className="flex-1 font-jakarta font-400 text-[0.9375rem] text-[#353C45] leading-[1.55]">
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* Limitations */}
          <div className="flex-1 bg-[#E9E2DF] border border-[#C8A895] rounded-[2px] p-[40px] flex flex-col gap-5">
            <p className="font-jakarta font-600 text-[0.875rem] tracking-[0.01em] text-[#7A5342] uppercase">
              What It Does Not Guarantee
            </p>
            {LIMITATIONS.map((item) => (
              <div key={item} className="flex gap-3 items-start">
                <span className="font-jakarta font-500 text-[#B86A3D] shrink-0">—</span>
                <p className="flex-1 font-jakarta font-400 text-[0.875rem] text-[#7A5342] leading-[1.55]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section/VerificationProcess */}
      <section className="bg-[#F0EEE9] px-[120px] py-[96px] flex flex-col gap-12">
        <p className="font-jakarta font-600 text-[0.6875rem] tracking-[0.06em] text-[#B86A3D] uppercase">
          The Verification Process
        </p>
        <div className="font-jakarta font-600 text-[2.25rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15]">
          <p>Done once.</p>
          <p>Builds your record permanently.</p>
        </div>
        <div className="flex gap-8 w-full">
          {/* Documents */}
          <div className="flex-1 bg-[#ECE8E1] border border-[#D8D3CC] rounded-[2px] p-[40px] flex flex-col gap-5">
            <p className="font-jakarta font-600 text-[1rem] text-[#1D232A]">Documents required</p>
            {DOCUMENTS.map((doc) => (
              <div key={doc.title} className="bg-[#E5E1DA] rounded-[2px] p-4 flex flex-col gap-1">
                <p className="font-jakarta font-600 text-[0.875rem] text-[#1D232A]">{doc.title}</p>
                <p className="font-jakarta font-400 text-[0.8125rem] text-[#636C76]">{doc.sub}</p>
              </div>
            ))}
            <p className="font-ibm-mono not-italic text-[0.75rem] text-[#8A919A] leading-[1.5]">
              Document content is NOT visible to buyers or other farmers.
              <br />
              Only your verified / unverified status is public.
            </p>
          </div>

          {/* AdminReview */}
          <div className="flex-1 bg-[#ECE8E1] border border-[#D8D3CC] rounded-[2px] p-[40px] flex flex-col gap-6">
            <p className="font-jakarta font-600 text-[1rem] text-[#1D232A]">
              What the administrator does
            </p>
            <div className="font-jakarta font-400 text-[0.9375rem] text-[#353C45] leading-[1.6] flex flex-col gap-4">
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
            <div className="bg-[#E5ECE8] rounded-[2px] p-4 flex flex-col gap-[6px]">
              <p className="font-ibm-mono not-italic text-[0.75rem] tracking-[0.02em] text-[#2E7D78] uppercase">
                Approved
              </p>
              <p className="font-jakarta font-400 text-[0.875rem] text-[#353C45] leading-[1.55]">
                Farmer status becomes VERIFIED. Listings are immediately possible.
              </p>
            </div>
            <div className="bg-[#E9E2DF] rounded-[2px] p-4 flex flex-col gap-[6px]">
              <p className="font-ibm-mono not-italic text-[0.75rem] tracking-[0.02em] text-[#7A5342] uppercase">
                Rejected
              </p>
              <p className="font-jakarta font-400 text-[0.875rem] text-[#353C45] leading-[1.55]">
                You receive a reason via SMS. Rejection is correctable — resubmit with additional
                documentation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section/TrustScore */}
      <section className="bg-[#131619] px-[120px] py-[96px] flex flex-col gap-12">
        <p className="font-jakarta font-600 text-[0.6875rem] tracking-[0.06em] text-[#56A8A2] uppercase">
          Trust Score
        </p>
        <div className="font-jakarta font-600 text-[2.25rem] tracking-[-0.02em] text-[#F2F0EC] leading-[1.15]">
          <p>Built from real transactions.</p>
          <p>Not from self-reporting.</p>
        </div>

        {/* 4 component cards */}
        <div className="flex gap-4 w-full">
          {TRUST_COMPONENTS.map((c) => (
            <div
              key={c.index}
              className="flex-1 bg-[#1B2025] border border-[#2A3138] rounded-[2px] px-6 py-7 flex flex-col gap-3"
            >
              <span className="font-ibm-mono not-italic text-[0.6875rem] text-[#56A8A2]">{c.index}</span>
              <p className="font-jakarta font-600 text-[0.9375rem] text-[#F2F0EC] leading-[1.3]">{c.title}</p>
              <p className="font-jakarta font-400 text-[0.8125rem] text-[#A9A29A] leading-[1.55]">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* 4 tier cards */}
        <div className="flex gap-4 w-full">
          {TRUST_TIERS_DARK.map((tier) => (
            <div
              key={tier.name}
              className="flex-1 bg-[#1B2025] border border-[#2A3138] rounded-[2px] p-6 flex flex-col gap-[10px]"
            >
              <div className={`inline-flex self-start border ${tier.pillBorder} rounded-full px-[10px] py-[4px]`}>
                <span className={`font-ibm-mono not-italic text-[0.6875rem] tracking-[0.02em] ${tier.pillText}`}>
                  {tier.name}
                </span>
              </div>
              <p className="font-jakarta font-400 text-[0.8125rem] text-[#A9A29A] leading-[1.55]">
                {tier.desc}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/trust"
          className="font-jakarta font-500 text-[0.875rem] text-[#56A8A2] hover:opacity-80 transition-opacity"
        >
          Complete Trust Score methodology → /trust
        </Link>
      </section>

      {/* Section/MpesaPayment */}
      <section className="bg-[#F5F4F0] px-[120px] py-[96px] flex flex-col gap-12">
        <p className="font-jakarta font-600 text-[0.6875rem] tracking-[0.06em] text-[#B86A3D] uppercase">
          M-Pesa Payment
        </p>
        <div className="font-jakarta font-600 text-[2.25rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15]">
          <p>Payment confirmed</p>
          <p>before you dispatch.</p>
        </div>

        {/* 9-step grid — 3 rows of 3, adjacent tiles */}
        <div className="flex flex-col w-full">
          {[MPESA_STEPS.slice(0, 3), MPESA_STEPS.slice(3, 6), MPESA_STEPS.slice(6, 9)].map(
            (row, rowIdx) => (
              <div key={rowIdx} className="flex w-full">
                {row.map((step) => (
                  <div
                    key={step.n}
                    className="flex-1 bg-[#ECE8E1] border border-[#D8D3CC] p-7 flex flex-col gap-3"
                  >
                    <div
                      className={`w-7 h-7 rounded-full ${step.badge} flex items-center justify-center shrink-0`}
                    >
                      <span className="font-jakarta font-600 text-[0.75rem] text-[#F5F4F0]">
                        {step.n}
                      </span>
                    </div>
                    <p className="font-jakarta font-400 text-[0.875rem] text-[#353C45] leading-[1.55]">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Failure notice */}
        <div className="bg-[#E9E2DF] rounded-[2px] px-6 py-5 flex gap-4 items-start w-full">
          <span className="font-jakarta font-600 text-[0.875rem] text-[#B86A3D] shrink-0">!</span>
          <p className="flex-1 font-jakarta font-400 text-[0.875rem] text-[#7A5342] leading-[1.55]">
            Payment failure (STK Push timeout, declined, or network error): no money moves. Order
            stays PENDING. Buyer can retry or cancel. There is no financial risk to the farmer —
            payment must confirm before dispatch obligation begins.
          </p>
        </div>
      </section>

      {/* Section/FailureModes */}
      <section className="bg-[#F0EEE9] px-[120px] py-[80px] flex flex-col gap-10">
        <p className="font-jakarta font-600 text-[0.6875rem] tracking-[0.06em] text-[#636C76] uppercase">
          Platform Limits — Disclosed
        </p>
        <p className="font-jakarta font-600 text-[1.75rem] tracking-[-0.015em] text-[#1D232A] leading-[1.2]">
          What can go wrong, and what happens.
        </p>
        <div className="flex gap-6 w-full">
          {FAILURE_MODES.map((item) => (
            <div
              key={item.title}
              className="flex-1 bg-[#E5E1DA] border border-[#C8C2BA] rounded-[2px] p-7 flex flex-col gap-[10px]"
            >
              <p className="font-jakarta font-600 text-[0.9375rem] text-[#1D232A]">{item.title}</p>
              <p className="font-jakarta font-400 text-[0.875rem] text-[#636C76] leading-[1.55]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section/RegistrationCTA */}
      <section className="bg-[#B86A3D] px-[120px] py-[80px] flex flex-col gap-6 items-center">
        <p className="font-jakarta font-600 text-[2.25rem] tracking-[-0.02em] text-[#F5F4F0] text-center leading-[1.15]">
          Ready to register?
        </p>
        <p className="font-jakarta font-400 text-[1rem] text-[#F0EEE9] text-center leading-[1.55] max-w-[600px]">
          Verification takes one round of document submission. Once approved, your listings are
          live immediately.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/register?role=FARMER"
            className="inline-flex items-center px-[28px] py-[16px] rounded-[4px] bg-[#1D232A] text-[#F5F4F0] font-jakarta font-600 text-[1rem] hover:opacity-90 transition-opacity"
          >
            Register as a Farmer →
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-[28px] py-[16px] rounded-[4px] border border-[#F0EEE9] text-[#F0EEE9] font-jakarta font-500 text-[1rem] hover:opacity-80 transition-opacity"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </section>
    </>
  );
}
