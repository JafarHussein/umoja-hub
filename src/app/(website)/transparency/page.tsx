import type { Metadata } from 'next';
import { MediaFrame } from '@/components/website/MediaFrame';

export const metadata: Metadata = {
  title: 'Transparency · UmojaHub',
  description:
    'Real numbers. Published methodology. Honest omissions. Live platform statistics, infrastructure disclosure, and service status.',
};

const STATS = [
  { label: 'Verified Farmers', includes: 'Accounts with APPROVED status, currently active', excludes: 'Pending verifications, suspended accounts, total ever approved' },
  { label: 'Completed Transactions', includes: 'Orders with RECEIVED confirmation from buyer', excludes: 'Orders that are PAID but not yet received, cancelled orders' },
  { label: 'Transaction Value (KES)', includes: 'Sum of all RECEIVED orders in Kenyan Shillings', excludes: 'Cancelled orders, refunded amounts, pending orders' },
  { label: 'Counties Active', includes: 'Counties with at least one active listing', excludes: 'Counties with only inactive or expired listings' },
  { label: 'Verified Student Portfolios', includes: 'Portfolios with a VERIFIED lecturer decision', excludes: 'Submitted but unreviewed, REVISION_REQUIRED, DENIED' },
  { label: 'Verified Lecturers', includes: 'Administrator-approved reviewer accounts, currently active', excludes: 'Pending applications, inactive reviewer accounts' },
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
  { name: 'Safaricom Daraja API', role: 'M-Pesa payment processing', data: 'Phone number, transaction amount, order reference at time of STK Push' },
  { name: 'MongoDB Atlas', role: 'Database', data: 'All platform data including user accounts, transactions, and verification records' },
  { name: 'Cloudinary', role: 'Document and image storage', data: 'Farmer verification documents, farm photographs, student submission files' },
  { name: 'Groq API', role: 'AI farm assistant and AI mentor', data: 'User queries submitted to the assistant, session context' },
  { name: 'OpenAI API', role: 'Brief generation and content moderation', data: 'Content submitted for moderation checks, brief generation inputs' },
  { name: 'Vercel', role: 'Hosting and deployment', data: 'Request logs, edge network routing' },
  { name: 'SendGrid', role: 'Email notifications', data: 'Email address, notification content at time of send' },
  { name: "Africa's Talking", role: 'SMS notifications', data: 'Phone number, SMS content at time of send' },
  { name: 'OpenWeatherMap API', role: 'Weather data for farm assistant', data: 'County or region name, weather query parameters' },
] as const;

const STATUS = [
  'Farmer verification queue',
  'Student review queue',
  'Marketplace',
  'M-Pesa payment processing',
  'AI farm assistant',
  'AI mentor',
  'SMS notifications',
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const H2 = 'text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl';

export default function TransparencyPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid items-center gap-12 pt-24 pb-20 md:pb-28 lg:grid-cols-12`}>
          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              Transparency
            </p>
            <h1 className="text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
              Real numbers.
              <br />
              Honest omissions.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
              A researcher, auditor, or funder arrives wanting evidence of real operations. This page
              provides real numbers, disclosed methodology, and an honest list of what we do not
              track.
            </p>
          </div>
          <div className="lg:col-span-5">
            <MediaFrame
              alt="Aggregate platform data on a screen"
              label="Live platform data"
              aspect="aspect-[4/5]"
              priority
            />
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <div className="flex flex-col gap-3">
            <h2 className={H2}>Live platform statistics</h2>
            <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
              Each metric states what the count includes, what it excludes, and how it is calculated.
              Updated every 5 minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-3 bg-surface px-7 py-8">
                <p className="font-ibm-mono text-xs uppercase tracking-wide text-fg-subtle">Live</p>
                <p className="text-lg font-semibold leading-snug text-fg">{stat.label}</p>
                <p className="text-xs leading-relaxed text-fg-muted">Includes: {stat.includes}</p>
                <p className="text-xs leading-relaxed text-fg-subtle">Excludes: {stat.excludes}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Not tracked */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <div className="flex flex-col gap-3">
            <h2 className={H2}>What we do not track</h2>
            <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
              Explicit disclosure. These are outcomes we do not measure, either because the data is
              not available on-platform, or because we do not claim them as results.
            </p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-border border-y border-border">
            {NOT_TRACKED.map((item, i) => (
              <div key={item} className="flex items-center gap-6 py-6">
                <p className="shrink-0 font-ibm-mono text-sm text-fg-subtle">{String(i + 1).padStart(2, '0')}</p>
                <p className="flex-1 text-lg leading-snug text-fg">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <div className="flex flex-col gap-3">
            <h2 className={H2}>Infrastructure disclosure</h2>
            <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
              Third-party services used by this platform. For each: what it does, and what data it
              receives.
            </p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-border border-y border-border">
            {INFRASTRUCTURE.map((service) => (
              <div key={service.name} className="flex flex-col items-start gap-2 py-6 md:flex-row md:gap-0">
                <div className="flex w-full shrink-0 flex-col gap-1 md:w-80">
                  <p className="font-semibold leading-snug text-fg">{service.name}</p>
                  <p className="text-sm leading-snug text-fg-subtle">{service.role}</p>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-fg-muted">
                  Data received: {service.data}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service status */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>Service status</h2>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {STATUS.map((name) => (
              <div key={name} className="flex flex-col gap-4 bg-surface px-6 py-7">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-sm bg-success/10 px-2.5 py-1.5 font-ibm-mono text-xs text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Operational
                </span>
                <p className="text-sm leading-snug text-fg">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
