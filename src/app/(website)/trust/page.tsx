import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trust & Verification — UmojaHub',
  description:
    'The complete UmojaHub verification methodology. How farmers and students are verified, how Trust Scores are calculated, and how appeals work.',
};

const TRUST_COMPONENTS = [
  {
    index: '01',
    title: 'Verification Status',
    desc: 'Whether the farmer has passed identity verification.',
    changesLabel: 'CHANGES VIA',
    changes: 'Administrator APPROVED decision (one-time).',
  },
  {
    index: '02',
    title: 'Transaction Volume',
    desc: 'Count of completed, fulfilled orders.',
    changesLabel: 'CHANGES VIA',
    changes: 'Each RECEIVED order. Cancellations before fulfillment do not count.',
  },
  {
    index: '03',
    title: 'Buyer Ratings',
    desc: 'Average rating from post-transaction buyer feedback.',
    changesLabel: 'CHANGES VIA',
    changes: 'Each submitted buyer rating recalculates this component.',
  },
  {
    index: '04',
    title: 'Order Reliability',
    desc: 'Ratio of fulfilled orders to total orders over a rolling window.',
    changesLabel: 'CHANGES VIA',
    changes: 'Each dispatch confirmation and each non-dispatch within expected window.',
  },
] as const;

const TRUST_TIERS = [
  {
    name: 'NEW',
    bg: 'bg-[#ECE8E1]',
    pillBorder: 'border-[#8A919A]',
    pillText: 'text-[#8A919A]',
    desc: 'Recently verified, few or no completed transactions. Listing is possible at any tier.',
  },
  {
    name: 'ESTABLISHED',
    bg: 'bg-[#EFE7DA]',
    pillBorder: 'border-[#B86A3D]',
    pillText: 'text-[#B86A3D]',
    desc: 'Verified with a documented transaction history.',
  },
  {
    name: 'TRUSTED',
    bg: 'bg-[#E5ECE8]',
    pillBorder: 'border-[#2E7D78]',
    pillText: 'text-[#2E7D78]',
    desc: 'Verified with strong history of positive ratings and consistent fulfillment.',
  },
  {
    name: 'PREMIUM',
    bg: 'bg-[#EDEAF4]',
    pillBorder: 'border-[#6B5A9A]',
    pillText: 'text-[#6B5A9A]',
    desc: 'Highest tier. Deep transaction history and consistently high ratings. Highest listing visibility.',
  },
] as const;

const FARMER_ASSESSMENT = [
  {
    title: 'Consistency',
    desc: 'Do the documents reference each other coherently?',
  },
  {
    title: 'Plausibility',
    desc: 'Does the documentation represent a real person with documented land access?',
  },
  {
    title: 'Completeness',
    desc: 'Are all required documents present?',
  },
] as const;

const FARMER_DOES_NOT_ASSESS = ['Farm quality', 'Produce quality', 'Business viability', 'Farming experience'] as const;

const EDU_DIMENSIONS = [
  {
    code: 'D1  1—5',
    title: 'Clarity of problem understanding',
    desc: 'Does the student demonstrate they understand what they were asked to solve?',
  },
  {
    code: 'D2  1—5',
    title: 'Methodology appropriateness',
    desc: 'Is the chosen approach logical given the constraints of the brief?',
  },
  {
    code: 'D3  1—5',
    title: 'Documentation quality',
    desc: 'Are the three documents clear, structured, and specific?',
  },
  {
    code: 'D4  1—5',
    title: 'Reflection depth',
    desc: 'Does the Final Reflection demonstrate honest self-assessment of what worked and what failed?',
  },
] as const;

const FARMER_APPEALS = [
  'Rejection: resubmit with corrected or additional documentation. No fee. No limit on resubmissions.',
  'Dispute with a decision after approval: contact the verification team within 30 days.',
  'Escalation: named administrators handle escalated appeals. Contact details at /team.',
] as const;

const STUDENT_APPEALS = [
  'REVISION_REQUIRED: revise and resubmit within the window specified in the feedback. The feedback is specific and actionable.',
  'Conflict of interest claim: process available for claiming a reviewer had a conflict not caught by the system.',
  'Link to /team for named administrator accountability and contact.',
] as const;

const ANYONE_APPEALS = [
  'Named administrators are identified at /team — not anonymous roles.',
  'All decisions are recorded with the administrator’s identifier.',
  'Platform status and operational metrics are published at /transparency.',
] as const;

export default function TrustPage() {
  return (
    <>
      {/* Section/Hero */}
      <section className="bg-[#131619] px-[120px] py-[96px] flex flex-col gap-5">
        <p className="font-ibm-mono text-[#56A8A2] text-[0.6875rem] tracking-[0.06em] uppercase not-italic">
          Trust &amp; Verification
        </p>
        <h1 className="font-jakarta font-800 text-[3.75rem] leading-[1.05] tracking-[-0.03em] text-[#F2F0EC] max-w-[900px]">
          Complete methodology.
          <br />
          Published. Auditable.
          <br />
          No omissions.
        </h1>
        <p className="font-jakarta font-400 text-[1.125rem] leading-[1.6] text-[#A9A29A] max-w-[720px]">
          This page documents exactly how trust is created, measured, and reported on UmojaHub.
          Farmers, students, employers, and researchers can verify every claim made elsewhere on
          this platform against this document.
        </p>
        <div className="flex items-center gap-6">
          <a
            href="#trust-score"
            className="font-jakarta font-500 text-[0.875rem] text-[#56A8A2] hover:opacity-80 transition-opacity"
          >
            Trust Score →
          </a>
          <a
            href="#farmer-verification"
            className="font-jakarta font-500 text-[0.875rem] text-[#B86A3D] hover:opacity-80 transition-opacity"
          >
            Farmer Verification →
          </a>
          <a
            href="#education-verification"
            className="font-jakarta font-500 text-[0.875rem] text-[#2E7D78] hover:opacity-80 transition-opacity"
          >
            Education Verification →
          </a>
          <a
            href="#appeals"
            className="font-jakarta font-500 text-[0.875rem] text-[#636C76] hover:opacity-80 transition-opacity"
          >
            Appeals →
          </a>
        </div>
      </section>

      {/* Section/TrustScore */}
      <section id="trust-score" className="bg-[#F5F4F0] px-[120px] py-[96px] flex flex-col gap-12">
        {/* Section header */}
        <div className="flex items-center gap-4">
          <span className="font-ibm-mono not-italic text-[0.75rem] text-[#B86A3D]">01</span>
          <span className="font-jakarta font-600 text-[0.6875rem] tracking-[0.05em] text-[#636C76] uppercase">
            Trust Score — Food Security Hub
          </span>
        </div>

        <div className="font-jakarta font-600 text-[2.25rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15]">
          <p>Four components.</p>
          <p>Built from real transactions.</p>
        </div>

        {/* 4 component cards */}
        <div className="flex gap-5 w-full">
          {TRUST_COMPONENTS.map((c) => (
            <div
              key={c.index}
              className="flex-1 bg-[#ECE8E1] border border-[#D8D3CC] rounded-[2px] p-[28px] flex flex-col gap-3"
            >
              <span className="font-ibm-mono not-italic text-[0.6875rem] text-[#B86A3D]">{c.index}</span>
              <p className="font-jakarta font-600 text-[0.9375rem] text-[#1D232A] leading-[1.3]">{c.title}</p>
              <p className="font-jakarta font-400 text-[0.8125rem] text-[#636C76] leading-[1.55]">{c.desc}</p>
              <div className="h-px bg-[#D8D3CC]" />
              <p className="font-ibm-mono not-italic text-[0.625rem] tracking-[0.02em] text-[#8A919A] uppercase">
                {c.changesLabel}
              </p>
              <p className="font-jakarta font-400 text-[0.75rem] text-[#353C45] leading-[1.5]">{c.changes}</p>
            </div>
          ))}
        </div>

        {/* Trust Tiers label */}
        <p className="font-jakarta font-600 text-[0.6875rem] tracking-[0.04em] text-[#636C76] uppercase">
          Trust Tiers
        </p>

        {/* Tier cards — adjacent, no gap */}
        <div className="flex w-full">
          {TRUST_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex-1 ${tier.bg} border border-[#D8D3CC] p-[28px] flex flex-col gap-3`}
            >
              <div
                className={`inline-flex self-start border ${tier.pillBorder} rounded-full px-[10px] py-[4px]`}
              >
                <span className={`font-ibm-mono not-italic text-[0.6875rem] tracking-[0.02em] ${tier.pillText}`}>
                  {tier.name}
                </span>
              </div>
              <p className="font-jakarta font-400 text-[0.8125rem] text-[#353C45] leading-[1.55]">{tier.desc}</p>
            </div>
          ))}
        </div>

        {/* Limitations block */}
        <div className="bg-[#E9E2DF] border border-[#C8A895] rounded-[2px] p-[28px] flex flex-col gap-3">
          <p className="font-jakarta font-600 text-[0.75rem] tracking-[0.03em] text-[#7A5342] uppercase">
            What the Trust Score Cannot Do
          </p>
          <p className="font-jakarta font-400 text-[0.875rem] text-[#7A5342] leading-[1.6]">
            The Trust Score cannot detect sophisticated document fraud at the verification stage. It
            cannot prevent a bad actor willing to build score through real transactions before
            executing a fraudulent order. It creates accountability over time — not guaranteed
            performance on any single transaction.
          </p>
        </div>
      </section>

      {/* Section/FarmerVerification */}
      <section id="farmer-verification" className="bg-[#F0EEE9] px-[120px] py-[96px] flex flex-col gap-10">
        {/* Section header */}
        <div className="flex items-center gap-4">
          <span className="font-ibm-mono not-italic text-[0.75rem] text-[#B86A3D]">02</span>
          <span className="font-jakarta font-600 text-[0.6875rem] tracking-[0.05em] text-[#636C76] uppercase">
            Farmer Verification Methodology
          </span>
        </div>

        <div className="font-jakarta font-600 text-[2rem] tracking-[-0.015em] text-[#1D232A] leading-[1.15]">
          <p>What the administrator reviews.</p>
          <p>What they do not.</p>
        </div>

        {/* 2-column layout */}
        <div className="flex gap-8 w-full">
          {/* Left: assessment criteria */}
          <div className="flex-1 bg-[#ECE8E1] border border-[#D8D3CC] rounded-[2px] p-[36px] flex flex-col gap-5">
            <p className="font-jakarta font-600 text-[0.875rem] text-[#1D232A]">
              What the administrator assesses
            </p>
            {FARMER_ASSESSMENT.map((item) => (
              <div key={item.title} className="bg-[#E5E1DA] rounded-[2px] px-4 py-[14px] flex flex-col gap-1">
                <p className="font-jakarta font-600 text-[0.875rem] text-[#1D232A]">{item.title}</p>
                <p className="font-jakarta font-400 text-[0.8125rem] text-[#636C76]">{item.desc}</p>
              </div>
            ))}
            <p className="font-jakarta font-600 text-[0.75rem] tracking-[0.02em] text-[#8A919A] uppercase">
              Does Not Assess
            </p>
            {FARMER_DOES_NOT_ASSESS.map((item) => (
              <p key={item} className="font-jakarta font-400 text-[0.8125rem] text-[#8A919A]">
                — {item}
              </p>
            ))}
          </div>

          {/* Right: decision criteria */}
          <div className="flex-1 bg-[#ECE8E1] border border-[#D8D3CC] rounded-[2px] p-[36px] flex flex-col gap-6">
            <p className="font-jakarta font-600 text-[0.875rem] text-[#1D232A]">Decision criteria</p>

            {/* APPROVED block */}
            <div className="bg-[#E5ECE8] rounded-[2px] p-5 flex flex-col gap-[10px]">
              <p className="font-ibm-mono not-italic text-[0.6875rem] tracking-[0.02em] text-[#2E7D78] uppercase">
                Approved
              </p>
              <p className="font-jakarta font-400 text-[0.875rem] text-[#353C45] leading-[1.55]">
                Documents are consistent, plausible, and complete.
              </p>
              <p className="font-jakarta font-600 text-[0.6875rem] tracking-[0.02em] text-[#8A919A] uppercase">
                Does Not Guarantee
              </p>
              <p className="font-jakarta font-400 text-[0.8125rem] text-[#7A5342] leading-[1.5]">
                That land is exactly as described. That produce quality will match listings. That
                orders will be fulfilled.
              </p>
            </div>

            {/* REJECTED block */}
            <div className="bg-[#E9E2DF] rounded-[2px] p-5 flex flex-col gap-[10px]">
              <p className="font-ibm-mono not-italic text-[0.6875rem] tracking-[0.02em] text-[#7A5342] uppercase">
                Rejected
              </p>
              <p className="font-jakarta font-400 text-[0.875rem] text-[#353C45] leading-[1.55]">
                Documents are incomplete, inconsistent, or do not represent a plausible land
                connection. Rejection reasons are specific and correctable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section/EducationVerification */}
      <section
        id="education-verification"
        className="bg-[#F5F4F0] px-[120px] py-[96px] flex flex-col gap-10"
      >
        {/* Section header */}
        <div className="flex items-center gap-4">
          <span className="font-ibm-mono not-italic text-[0.75rem] text-[#2E7D78]">03</span>
          <span className="font-jakarta font-600 text-[0.6875rem] tracking-[0.05em] text-[#636C76] uppercase">
            Education Hub Verification Methodology
          </span>
        </div>

        <div className="font-jakarta font-600 text-[2rem] tracking-[-0.015em] text-[#1D232A] leading-[1.15]">
          <p>Four rubric dimensions.</p>
          <p>One cryptographic anchor.</p>
        </div>

        {/* 4 dimension cards */}
        <div className="flex gap-5 w-full">
          {EDU_DIMENSIONS.map((d) => (
            <div
              key={d.code}
              className="flex-1 bg-[#ECE8E1] border border-[#D8D3CC] rounded-[2px] p-[28px] flex flex-col gap-[10px]"
            >
              <p className="font-ibm-mono not-italic text-[0.6875rem] text-[#2E7D78] whitespace-pre">
                {d.code}
              </p>
              <p className="font-jakarta font-600 text-[0.875rem] text-[#1D232A] leading-[1.3]">{d.title}</p>
              <p className="font-jakarta font-400 text-[0.8125rem] text-[#636C76] leading-[1.55]">{d.desc}</p>
            </div>
          ))}
        </div>

        {/* SHA-256 + Peer Score Locking */}
        <div className="flex gap-6 w-full">
          <div className="flex-1 bg-[#E3E6E8] border border-[#A8B1B9] rounded-[2px] p-[28px] flex flex-col gap-3">
            <p className="font-ibm-mono not-italic text-[0.6875rem] tracking-[0.02em] text-[#2E7D78] uppercase">
              SHA-256 Document Hash
            </p>
            <p className="font-jakarta font-400 text-[0.875rem] text-[#353C45] leading-[1.6]">
              At submission, the platform creates a SHA-256 hash of the combined document content
              and records it in the audit log with a timestamp and submission ID. The hash is the
              authenticity anchor for the portfolio entry. Any alteration of the documents after
              this point causes the hash to fail.
            </p>
          </div>
          <div className="flex-1 bg-[#E3E6E8] border border-[#A8B1B9] rounded-[2px] p-[28px] flex flex-col gap-3">
            <p className="font-ibm-mono not-italic text-[0.6875rem] tracking-[0.02em] text-[#56A8A2] uppercase">
              Peer Score Locking
            </p>
            <p className="font-jakarta font-400 text-[0.875rem] text-[#353C45] leading-[1.6]">
              Peer scores are recorded and locked before the submission enters the lecturer queue.
              Lecturers make their assessment independently before seeing the peer score. This
              prevents the peer score from anchoring the lecturer&apos;s judgment.
            </p>
          </div>
        </div>
      </section>

      {/* Section/AppealsRecourse */}
      <section id="appeals" className="bg-[#131619] px-[120px] py-[96px] flex flex-col gap-10">
        {/* Section header */}
        <div className="flex items-center gap-4">
          <span className="font-ibm-mono not-italic text-[0.75rem] text-[#636C76]">04</span>
          <span className="font-jakarta font-600 text-[0.6875rem] tracking-[0.05em] text-[#636C76] uppercase">
            Appeals and Recourse
          </span>
        </div>

        <div className="font-jakarta font-600 text-[2rem] tracking-[-0.015em] text-[#F2F0EC] leading-[1.15]">
          <p>Every decision is reviewable.</p>
          <p>Every outcome is correctable.</p>
        </div>

        {/* 3 columns */}
        <div className="flex gap-6 w-full">
          {/* For Farmers */}
          <div className="flex-1 bg-[#1B2025] border border-[#2A3138] rounded-[2px] p-8 flex flex-col gap-4">
            <p className="font-jakarta font-600 text-[0.875rem] tracking-[0.01em] text-[#B86A3D]">
              For Farmers
            </p>
            {FARMER_APPEALS.map((item) => (
              <div key={item} className="flex gap-[10px] items-start">
                <span className="w-[5px] h-5 shrink-0 mt-[3px] rounded-full bg-[#B86A3D] opacity-60" />
                <p className="flex-1 font-jakarta font-400 text-[0.875rem] text-[#A9A29A] leading-[1.55]">
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* For Students */}
          <div className="flex-1 bg-[#1B2025] border border-[#2A3138] rounded-[2px] p-8 flex flex-col gap-4">
            <p className="font-jakarta font-600 text-[0.875rem] tracking-[0.01em] text-[#2E7D78]">
              For Students
            </p>
            {STUDENT_APPEALS.map((item) => (
              <div key={item} className="flex gap-[10px] items-start">
                <span className="w-[5px] h-5 shrink-0 mt-[3px] rounded-full bg-[#2E7D78] opacity-60" />
                <p className="flex-1 font-jakarta font-400 text-[0.875rem] text-[#A9A29A] leading-[1.55]">
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* For Anyone */}
          <div className="flex-1 bg-[#1B2025] border border-[#2A3138] rounded-[2px] p-8 flex flex-col gap-4">
            <p className="font-jakarta font-600 text-[0.875rem] tracking-[0.01em] text-[#636C76]">
              For Anyone
            </p>
            {ANYONE_APPEALS.map((item) => (
              <div key={item} className="flex gap-[10px] items-start">
                <span className="w-[5px] h-5 shrink-0 mt-[3px] rounded-full bg-[#636C76] opacity-60" />
                <p className="flex-1 font-jakarta font-400 text-[0.875rem] text-[#A9A29A] leading-[1.55]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
