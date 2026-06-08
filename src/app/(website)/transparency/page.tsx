import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';

export const metadata: Metadata = {
  title: 'Transparency — UmojaHub',
  description:
    'Live platform data, infrastructure disclosure, and service status. Everything UmojaHub tracks — and everything it does not.',
};

const LIVE_STATS = [
  { label: 'Verified farmers', includes: 'All farmers with APPROVED status', excludes: 'Pending applications, suspended accounts' },
  { label: 'Active listings', includes: 'Published listings from verified farmers', excludes: 'Draft listings, delisted produce' },
  { label: 'Completed transactions', includes: 'M-Pesa-settled orders with confirmed delivery', excludes: 'Disputed, cancelled, or in-escrow orders' },
  { label: 'Verified student portfolios', includes: 'Entries with VERIFIED status', excludes: 'Pending reviews, DENIED entries' },
  { label: 'Counties represented', includes: 'Counties with at least one verified farmer', excludes: 'Counties with pending-only applications' },
  { label: 'Platform dispute rate', includes: 'Disputes as a percentage of completed orders', excludes: 'Disputes resolved before escrow release' },
] as const;

const NOT_TRACKED = [
  'Revenue or financial performance of individual farmers',
  'Student academic grades or institutional GPA',
  'Buyer purchasing history or procurement budget',
  'Personal communications between platform participants',
  'Individual device identifiers or location data',
  'Third-party data from M-Pesa, Safaricom, or bank records',
  'IP address logging beyond security event detection',
  'Behavioural tracking across non-UmojaHub websites',
  'Biometric data of any kind',
  'Undisclosed data of any kind',
] as const;

const INFRASTRUCTURE = [
  { service: 'Database', provider: 'MongoDB Atlas (M10)', disclosure: 'East Africa region. Data encrypted at rest and in transit.' },
  { service: 'Hosting', provider: 'Vercel', disclosure: 'Serverless compute. No persistent server state.' },
  { service: 'Payments', provider: 'Safaricom Daraja API', disclosure: 'M-Pesa STK Push. UmojaHub does not store M-Pesa PINs.' },
  { service: 'Email', provider: 'SendGrid', disclosure: 'Transactional email only. No marketing without explicit opt-in.' },
  { service: 'AI assistant', provider: 'Groq (LLaMA)', disclosure: 'Farm assistant queries are not retained beyond the session.' },
  { service: 'File storage', provider: 'Cloudinary', disclosure: 'Submitted documents stored with access controls. Not publicly addressable.' },
] as const;

const SERVICE_STATUS = [
  { name: 'Marketplace', status: 'OPERATIONAL' },
  { name: 'M-Pesa payment gateway', status: 'OPERATIONAL' },
  { name: 'Education Hub', status: 'OPERATIONAL' },
  { name: 'Verification queue', status: 'OPERATIONAL' },
  { name: 'Knowledge Hub', status: 'OPERATIONAL' },
  { name: 'AI farm assistant', status: 'OPERATIONAL' },
  { name: 'Email notifications', status: 'OPERATIONAL' },
] as const;

export default function TransparencyPage() {
  return (
    <>
      <section className="pt-32 pb-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-4">Platform Transparency</p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="text-ws-h1 font-jakarta font-700 text-ws-text-heading leading-[1.15] tracking-[-0.02em]">
              What we track. What we do not. Who is responsible.
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mt-5 text-ws-body font-jakarta text-ws-text-secondary leading-[1.6] max-w-2xl">
              Honest omissions are more valuable than inflated claims. This page publishes the exact
              scope of every data point, every third-party service, and every operational decision.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Live stats */}
      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">Live data</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-3">
              Six metrics, fully disclosed
            </h2>
            <p className="text-ws-body font-jakarta text-ws-text-secondary max-w-xl mb-12">
              Each metric states exactly what is included and excluded from the count.
            </p>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LIVE_STATS.map((stat, i) => (
              <AnimateIn key={stat.label} delay={i * 0.06}>
                <div className="p-6 bg-canvas-base border border-ws-border-soft rounded-sm">
                  <p className="font-jakarta font-600 text-ws-text-heading mb-3">{stat.label}</p>
                  <p className="font-jakarta text-ws-meta text-teal mb-1">Includes: <span className="text-ws-text-secondary">{stat.includes}</span></p>
                  <p className="font-jakarta text-ws-meta text-ws-text-meta">Excludes: <span className="text-ws-text-secondary">{stat.excludes}</span></p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Not tracked */}
      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-ws-text-meta mb-3">Not tracked</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-8">
              Ten things we do not collect
            </h2>
          </AnimateIn>
          <div className="space-y-2">
            {NOT_TRACKED.map((item, i) => (
              <AnimateIn key={item} delay={i * 0.04}>
                <div className="flex items-start gap-3 py-3 border-b border-ws-border-soft last:border-0">
                  <span className="font-ibm-mono text-ws-meta text-ws-text-meta shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-jakarta text-ws-body text-ws-text-body">{item}</span>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">Infrastructure</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              Every third-party service disclosed
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INFRASTRUCTURE.map((item, i) => (
              <AnimateIn key={item.service} delay={i * 0.06}>
                <div className="p-6 bg-canvas-base border border-ws-border-soft rounded-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-jakarta font-600 text-ws-text-heading">{item.service}</p>
                    <p className="font-ibm-mono text-ws-meta text-teal">{item.provider}</p>
                  </div>
                  <p className="font-jakarta text-ws-body text-ws-text-secondary">{item.disclosure}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Service status */}
      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">Service status</p>
            <h2 className="text-ws-h2 font-jakarta font-600 text-ws-text-heading mb-8">
              Current platform status
            </h2>
          </AnimateIn>
          <div className="space-y-2">
            {SERVICE_STATUS.map((item, i) => (
              <AnimateIn key={item.name} delay={i * 0.04}>
                <div className="flex items-center justify-between py-3 border-b border-ws-border-soft last:border-0">
                  <p className="font-jakarta text-ws-body text-ws-text-body">{item.name}</p>
                  <span className="font-ibm-mono text-ws-meta text-teal bg-ws-surface-success border border-teal/20 px-2 py-0.5 rounded-sm">
                    {item.status}
                  </span>
                </div>
              </AnimateIn>
            ))}
          </div>
          <AnimateIn delay={0.28}>
            <p className="mt-8 font-jakarta text-ws-meta text-ws-text-meta">
              Questions about methodology or data →{' '}
              <Link href="/team" className="text-teal hover:underline underline-offset-2">
                Contact the team
              </Link>{' '}
              ·{' '}
              <Link href="/trust" className="text-teal hover:underline underline-offset-2">
                Trust & Verification
              </Link>
            </p>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
