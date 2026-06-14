import type { Metadata } from 'next';
import { AnimateIn } from '@/components/website/AnimateIn';

export const metadata: Metadata = {
  title: 'For NGOs & Government — UmojaHub',
  description:
    'Live data on verified farmers, transactions, and trust distribution. Access aggregate impact data without registration.',
};

const MANDATE_ALIGNMENT = [
  {
    area: 'Food security',
    can: 'Access live data on verified farmer count, transaction volume, and county distribution.',
    cannot: 'Access individual farmer PII or transaction-level financial data.',
  },
  {
    area: 'Education outcomes',
    can: 'View aggregate student verification rates by institution and project category.',
    cannot: 'Access student identity, grades, or unapproved portfolio entries.',
  },
] as const;

const LIVE_STATS = [
  { label: 'Verified farmers', note: 'Updated in real time' },
  { label: 'Active listings', note: 'Verified produce only' },
  { label: 'Counties represented', note: 'Geographic reach' },
  { label: 'Verified student portfolios', note: 'Education Hub' },
  { label: 'Completed transactions', note: 'M-Pesa settled' },
  { label: 'Dispute rate', note: 'Platform-wide' },
] as const;

const CANNOT_PROVIDE = [
  'Individual farmer or student data without a formal data access agreement',
  'Predictive yield forecasting or agricultural risk modelling',
  'Loan, credit, or advance-payment services',
  'Government subsidy distribution or disbursement',
  'Regulatory compliance services',
];

const FAQ = [
  {
    q: 'Can we embed your data in our impact reports?',
    a: 'Yes — aggregate, anonymised data from the Transparency page is licensed for use in non-commercial impact reports with attribution. Contact us for specific arrangements.',
  },
  {
    q: 'Do you provide API access for bulk data pulls?',
    a: 'A read-only API for aggregate data is on the roadmap. Contact partnerships@umojahub.org to be notified when it launches.',
  },
  {
    q: 'Can field staff use the platform without smartphones?',
    a: 'The platform requires internet access and a smartphone for M-Pesa integration. SMS-based verification is not currently supported.',
  },
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';

export default function ForNGOsPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} max-w-4xl py-24`}>
          <AnimateIn>
            <p className="mb-4 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand-text">
              For NGOs &amp; Government
            </p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-fg md:text-5xl">
              Verified impact data.{' '}
              <span className="text-brand-text">No access agreement required to browse.</span>
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              UmojaHub publishes live aggregate data on verified farmer reach, transaction volume,
              and education outcomes. Field staff and programme analysts can access this data on the
              Transparency page without registering.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ── Mandate alignment ── */}
      <section className="border-y border-border bg-surface-sunken">
        <div className={`${CONTAINER} py-24`}>
          <AnimateIn>
            <p className="mb-3 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              Mandate alignment
            </p>
            <h2 className="mb-12 text-3xl font-semibold tracking-tight text-fg md:text-4xl">
              What we can and cannot provide
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {MANDATE_ALIGNMENT.map((item, i) => (
              <AnimateIn key={item.area} delay={i * 0.08}>
                <div className="rounded-sm border border-border bg-surface p-6">
                  <p className="mb-4 font-ibm-mono text-xs uppercase tracking-wide text-brand">
                    {item.area}
                  </p>
                  <div className="space-y-4">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
                        Can provide
                      </p>
                      <p className="text-fg">{item.can}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                        Cannot provide
                      </p>
                      <p className="text-fg-muted">{item.cannot}</p>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live data ── */}
      <section className="bg-background">
        <div className={`${CONTAINER} py-24`}>
          <AnimateIn>
            <p className="mb-3 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              Live data
            </p>
            <h2 className="mb-8 text-2xl font-semibold tracking-tight text-fg md:text-3xl">
              Six indicators available without registration
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {LIVE_STATS.map((stat, i) => (
              <AnimateIn key={stat.label} delay={i * 0.06}>
                <div className="rounded-sm border border-border bg-surface p-5">
                  <p className="mb-1 font-semibold text-fg">{stat.label}</p>
                  <p className="font-ibm-mono text-xs text-fg-subtle">{stat.note}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cannot provide ── */}
      <section className="border-y border-border bg-surface-sunken">
        <div className={`${CONTAINER} max-w-4xl py-24`}>
          <AnimateIn>
            <p className="mb-3 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle">
              Cannot provide
            </p>
            <h2 className="mb-6 text-2xl font-semibold tracking-tight text-fg md:text-3xl">
              Outside our scope
            </h2>
            <ul className="space-y-3">
              {CANNOT_PROVIDE.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fg-subtle" />
                  <span className="text-fg-muted">{item}</span>
                </li>
              ))}
            </ul>
          </AnimateIn>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-background">
        <div className={`${CONTAINER} max-w-4xl py-24`}>
          <AnimateIn>
            <p className="mb-6 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              Frequently asked
            </p>
          </AnimateIn>
          <div className="space-y-8">
            {FAQ.map((item, i) => (
              <AnimateIn key={item.q} delay={i * 0.08}>
                <div className="border-b border-border pb-8">
                  <p className="mb-3 font-semibold text-fg">{item.q}</p>
                  <p className="leading-relaxed text-fg-muted">{item.a}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <AnimateIn>
        <section className="border-t border-border bg-background">
          <div className={`${CONTAINER} py-16`}>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <p className="mb-1 font-semibold text-fg">Partnerships</p>
                <a
                  href="mailto:partnerships@umojahub.org"
                  className="font-ibm-mono text-sm text-brand underline-offset-2 hover:underline"
                >
                  partnerships@umojahub.org
                </a>
              </div>
              <div>
                <p className="mb-1 font-semibold text-fg">Press &amp; policy enquiries</p>
                <a
                  href="mailto:press@umojahub.org"
                  className="font-ibm-mono text-sm text-brand underline-offset-2 hover:underline"
                >
                  press@umojahub.org
                </a>
              </div>
            </div>
          </div>
        </section>
      </AnimateIn>
    </>
  );
}
