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

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const SECTION_LABEL = 'font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle';

function StatCard({ stat }: { stat: (typeof STATS)[number] }) {
  return (
    <div className="flex flex-1 flex-col gap-4 border-b-2 border-border bg-surface px-7 py-8">
      <p className="font-ibm-mono text-4xl leading-tight text-fg">—</p>
      <p className="text-sm font-semibold leading-snug text-fg">{stat.label}</p>
      <p className="text-xs leading-relaxed text-fg-muted">Includes: {stat.includes}</p>
      <p className="text-xs leading-relaxed text-fg-subtle">Excludes: {stat.excludes}</p>
    </div>
  );
}

function StatusCard({ name }: { name: string }) {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-sm border border-border bg-surface px-6 py-7">
      <div className="inline-flex items-center gap-1.5 self-start rounded-sm bg-success/10 px-2.5 py-1.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
        <span className="font-ibm-mono text-xs tracking-wide text-success">OPERATIONAL</span>
      </div>
      <p className="text-sm leading-snug text-fg">{name}</p>
    </div>
  );
}

export default function TransparencyPage() {
  return (
    <>
      {/* Hero */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-7 py-24`}>
          <p className={SECTION_LABEL}>Transparency</p>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
            Real numbers.
            <br />
            Published methodology.
            <br />
            Honest omissions.
          </h1>
          <p className="max-w-3xl text-xl leading-relaxed text-fg-muted">
            A researcher, auditor, or funder arrives wanting evidence of real operations. This page
            provides real numbers, disclosed methodology, and an honest list of what we do not track.
          </p>
        </div>
      </section>

      {/* S1 — Live Stats */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <p className={SECTION_LABEL}>Section 01</p>
          <p className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            Live platform statistics
          </p>
          <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
            Each metric states what the count includes, what it excludes, and how it is calculated.
            Updated every 5 minutes (ISR, revalidate 300s).
          </p>

          <div className="flex w-full flex-col gap-4 md:flex-row">
            {STATS.slice(0, 3).map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
          <div className="flex w-full flex-col gap-4 md:flex-row">
            {STATS.slice(3).map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </section>

      {/* S2 — Not Tracked */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col py-24`}>
          <div className="flex flex-col gap-4 pb-12">
            <p className={SECTION_LABEL}>Section 02</p>
            <p className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
              What we do not track
            </p>
            <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
              Explicit disclosure. These are the outcomes we do not measure — either because the data
              is not available on-platform, or because we do not claim these outcomes as results.
            </p>
          </div>

          {NOT_TRACKED.map((item, i) => (
            <div key={item} className="flex items-center gap-6 border-b border-border py-6">
              <p className="shrink-0 font-ibm-mono text-sm text-fg-subtle">
                {String(i + 1).padStart(2, '0')}
              </p>
              <p className="flex-1 text-lg leading-snug text-fg">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* S3 — Infrastructure */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-8 py-24`}>
          <p className={SECTION_LABEL}>Section 03</p>
          <p className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            Infrastructure disclosure
          </p>
          <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
            Third-party services used by this platform. For each: what it does on the platform, what
            data it receives.
          </p>

          {INFRASTRUCTURE.map((service) => (
            <div
              key={service.name}
              className="flex flex-col items-start gap-2 border-b border-border py-6 md:flex-row md:gap-0"
            >
              <div className="flex w-full shrink-0 flex-col gap-1 md:w-80">
                <p className="font-semibold leading-snug text-fg">{service.name}</p>
                <p className="text-sm leading-snug text-fg-subtle">{service.role}</p>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-fg-muted">{service.data}</p>
            </div>
          ))}
        </div>
      </section>

      {/* S4 — Service Status */}
      <section className="theme-product bg-surface">
        <div className={`${CONTAINER} flex flex-col gap-8 py-24`}>
          <p className={SECTION_LABEL}>Section 04</p>
          <p className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            Service status
          </p>
          <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
            Operational status of each major platform function. States: OPERATIONAL / DEGRADED /
            PENDING.
          </p>

          <div className="flex w-full flex-col gap-3 md:flex-row">
            {STATUS_ROW_1.map((name) => (
              <StatusCard key={name} name={name} />
            ))}
          </div>
          <div className="flex w-full flex-col gap-3 md:flex-row">
            {STATUS_ROW_2.map((name) => (
              <StatusCard key={name} name={name} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
