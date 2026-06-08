import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transparency — UmojaHub',
  description:
    'Real numbers. Published methodology. Honest omissions. Live platform statistics, infrastructure disclosure, and service status.',
};

const STATS = [
  {
    label: 'Verified Farmers',
    includes: 'Accounts with APPROVED status, currently active',
    excludes: 'Pending verifications, suspended accounts, total ever approved',
  },
  {
    label: 'Completed Transactions',
    includes: 'Orders with RECEIVED confirmation from buyer',
    excludes: 'Orders that are PAID but not yet received, cancelled orders',
  },
  {
    label: 'Transaction Value (KES)',
    includes: 'Sum of all RECEIVED orders in Kenyan Shillings',
    excludes: 'Cancelled orders, refunded amounts, pending orders',
  },
  {
    label: 'Counties Active',
    includes: 'Counties with at least one active listing',
    excludes: 'Counties with only inactive or expired listings',
  },
  {
    label: 'Verified Student Portfolios',
    includes: 'Portfolios with a VERIFIED lecturer decision',
    excludes: 'Submitted but unreviewed, REVISION_REQUIRED, DENIED',
  },
  {
    label: 'Verified Lecturers',
    includes: 'Administrator-approved reviewer accounts, currently active',
    excludes: 'Pending applications, inactive reviewer accounts',
  },
] as const;

const NOT_TRACKED = [
  'Farm income before and after registration',
  'Nutritional outcomes from marketplace transactions',
  'Whether verified students are employed after verification',
  'Salary outcomes for verified students',
  'Post-transaction produce quality scores',
  'County food security indices',
] as const;

const INFRASTRUCTURE = [
  {
    name: 'Safaricom Daraja API',
    role: 'M-Pesa payment processing',
    data: 'Data received: Phone number, transaction amount, order reference at time of STK Push',
  },
  {
    name: 'MongoDB Atlas',
    role: 'Database',
    data: 'Data received: All platform data including user accounts, transactions, and verification records',
  },
  {
    name: 'Cloudinary',
    role: 'Document and image storage',
    data: 'Data received: Farmer verification documents, farm photographs, student submission files',
  },
  {
    name: 'Groq API',
    role: 'AI farm assistant and AI mentor',
    data: 'Data received: User queries submitted to the assistant, session context',
  },
  {
    name: 'OpenAI API',
    role: 'Brief generation and content moderation',
    data: 'Data received: Content submitted for moderation checks, brief generation inputs',
  },
  {
    name: 'Vercel',
    role: 'Hosting and deployment',
    data: 'Data received: Request logs, edge network routing',
  },
  {
    name: 'SendGrid',
    role: 'Email notifications',
    data: 'Data received: Email address, notification content at time of send',
  },
  {
    name: "Africa's Talking",
    role: 'SMS notifications',
    data: 'Data received: Phone number, SMS content at time of send',
  },
  {
    name: 'OpenWeatherMap API',
    role: 'Weather data for farm assistant',
    data: 'Data received: County or region name, weather query parameters',
  },
] as const;

const STATUS_ROW_1 = [
  'Farmer verification queue',
  'Student review queue',
  'Marketplace',
  'M-Pesa payment processing',
] as const;

const STATUS_ROW_2 = ['AI farm assistant', 'AI mentor', 'SMS notifications'] as const;

export default function TransparencyPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#131619] px-[160px] py-[120px] flex flex-col gap-7">
        <p className="font-jakarta font-500 text-[0.875rem] tracking-[0.02em] text-[#878078]">
          Transparency
        </p>
        <h1 className="font-jakarta font-800 text-[4.5rem] leading-[1.05] tracking-[-0.03em] text-[#F2F0EC] max-w-[1000px]">
          Real numbers.
          <br />
          Published methodology.
          <br />
          Honest omissions.
        </h1>
        <p className="font-jakarta font-400 text-[1.25rem] leading-[1.6] text-[#A9A29A] max-w-[800px]">
          A researcher, auditor, or funder arrives wanting evidence of real operations. This page
          provides real numbers, disclosed methodology, and an honest list of what we do not track.
        </p>
      </section>

      {/* S1 — Live Stats */}
      <section className="bg-[#F5F4F0] px-[160px] py-[96px] flex flex-col gap-12">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#8A919A] uppercase">
          Section 01
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15] max-w-[800px]">
          Live platform statistics
        </p>
        <p className="font-jakarta font-400 text-[1.125rem] leading-[1.6] text-[#636C76] max-w-[760px]">
          Each metric states what the count includes, what it excludes, and how it is calculated.
          Updated every 5 minutes (ISR, revalidate 300s).
        </p>

        {/* Row 1 */}
        <div className="flex gap-4 w-full">
          {STATS.slice(0, 3).map((stat) => (
            <div
              key={stat.label}
              className="flex-1 bg-[#ECE8E1] border-b-2 border-[#C8C2BA] px-7 py-8 flex flex-col gap-4"
            >
              <p className="font-ibm-mono not-italic text-[2.25rem] leading-[1.2] text-[#1D232A]">
                —
              </p>
              <p className="font-jakarta font-600 text-[0.9375rem] leading-[1.35] text-[#353C45]">
                {stat.label}
              </p>
              <p className="font-jakarta font-400 text-[0.75rem] leading-[1.5] text-[#636C76]">
                Includes: {stat.includes}
              </p>
              <p className="font-jakarta font-400 text-[0.75rem] leading-[1.5] text-[#8A919A]">
                Excludes: {stat.excludes}
              </p>
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex gap-4 w-full">
          {STATS.slice(3).map((stat) => (
            <div
              key={stat.label}
              className="flex-1 bg-[#ECE8E1] border-b-2 border-[#C8C2BA] px-7 py-8 flex flex-col gap-4"
            >
              <p className="font-ibm-mono not-italic text-[2.25rem] leading-[1.2] text-[#1D232A]">
                —
              </p>
              <p className="font-jakarta font-600 text-[0.9375rem] leading-[1.35] text-[#353C45]">
                {stat.label}
              </p>
              <p className="font-jakarta font-400 text-[0.75rem] leading-[1.5] text-[#636C76]">
                Includes: {stat.includes}
              </p>
              <p className="font-jakarta font-400 text-[0.75rem] leading-[1.5] text-[#8A919A]">
                Excludes: {stat.excludes}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* S2 — Not Tracked */}
      <section className="bg-[#131619] px-[160px] py-[96px] flex flex-col">
        <div className="pb-12 flex flex-col gap-4">
          <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#878078] uppercase">
            Section 02
          </p>
          <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#F2F0EC] leading-[1.15] max-w-[800px]">
            What we do not track
          </p>
          <p className="font-jakarta font-400 text-[1.125rem] leading-[1.6] text-[#A9A29A] max-w-[760px]">
            Explicit disclosure. These are the outcomes we do not measure — either because the data
            is not available on-platform, or because we do not claim these outcomes as results.
          </p>
        </div>

        {NOT_TRACKED.map((item, i) => (
          <div
            key={item}
            className="border-b border-[#2A3138] py-6 flex gap-6 items-center"
          >
            <p className="font-ibm-mono not-italic text-[0.8125rem] text-[#49515A] shrink-0">
              {String(i + 1).padStart(2, '0')}
            </p>
            <p className="flex-1 font-jakarta font-400 text-[1.125rem] leading-[1.5] text-[#D6D1CB]">
              {item}
            </p>
          </div>
        ))}
      </section>

      {/* S3 — Infrastructure */}
      <section className="bg-[#ECE8E1] px-[160px] py-[96px] flex flex-col gap-8">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#8A919A] uppercase">
          Section 03
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15] max-w-[800px]">
          Infrastructure disclosure
        </p>
        <p className="font-jakarta font-400 text-[1.125rem] leading-[1.6] text-[#636C76] max-w-[760px]">
          Third-party services used by this platform. For each: what it does on the platform, what
          data it receives.
        </p>

        {INFRASTRUCTURE.map((service) => (
          <div
            key={service.name}
            className="border-b border-[#C8C2BA] py-6 flex items-start"
          >
            <div className="w-[300px] shrink-0 flex flex-col gap-1">
              <p className="font-jakarta font-600 text-[1rem] leading-[1.35] text-[#1D232A]">
                {service.name}
              </p>
              <p className="font-jakarta font-400 text-[0.875rem] leading-[1.4] text-[#8A919A]">
                {service.role}
              </p>
            </div>
            <p className="flex-1 font-jakarta font-400 text-[0.9375rem] leading-[1.6] text-[#636C76]">
              {service.data}
            </p>
          </div>
        ))}
      </section>

      {/* S4 — Service Status */}
      <section className="bg-[#1B2025] px-[160px] py-[96px] flex flex-col gap-8">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#878078] uppercase">
          Section 04
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#F2F0EC] leading-[1.15] max-w-[800px]">
          Service status
        </p>
        <p className="font-jakarta font-400 text-[1.125rem] leading-[1.6] text-[#A9A29A] max-w-[760px]">
          Operational status of each major platform function. States: OPERATIONAL / DEGRADED /
          PENDING.
        </p>

        {/* Row 1 — 4 cards */}
        <div className="flex gap-3 w-full">
          {STATUS_ROW_1.map((name) => (
            <div
              key={name}
              className="flex-1 bg-[#21272D] border border-[#2A3138] px-6 py-7 flex flex-col gap-4"
            >
              <div className="inline-flex self-start items-center gap-[6px] bg-[#1E3535] px-[10px] py-[6px]">
                <span className="w-[6px] h-[6px] rounded-full bg-[#2E7D78] shrink-0" />
                <span className="font-ibm-mono not-italic text-[0.75rem] tracking-[0.02em] text-[#2E7D78]">
                  OPERATIONAL
                </span>
              </div>
              <p className="font-jakarta font-400 text-[0.9375rem] leading-[1.4] text-[#D6D1CB]">
                {name}
              </p>
            </div>
          ))}
        </div>

        {/* Row 2 — 3 cards */}
        <div className="flex gap-3 w-full">
          {STATUS_ROW_2.map((name) => (
            <div
              key={name}
              className="flex-1 bg-[#21272D] border border-[#2A3138] px-6 py-7 flex flex-col gap-4"
            >
              <div className="inline-flex self-start items-center gap-[6px] bg-[#1E3535] px-[10px] py-[6px]">
                <span className="w-[6px] h-[6px] rounded-full bg-[#2E7D78] shrink-0" />
                <span className="font-ibm-mono not-italic text-[0.75rem] tracking-[0.02em] text-[#2E7D78]">
                  OPERATIONAL
                </span>
              </div>
              <p className="font-jakarta font-400 text-[0.9375rem] leading-[1.4] text-[#D6D1CB]">
                {name}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
