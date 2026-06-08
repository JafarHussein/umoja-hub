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

export default function ForNGOsPage() {
  return (
    <>
      <section className="pt-32 pb-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-4">For NGOs & Government</p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="text-ws-h1 font-jakarta font-700 text-ws-text-heading leading-[1.15] tracking-[-0.02em]">
              Verified impact data.{' '}
              <span className="text-teal">No access agreement required to browse.</span>
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mt-5 text-ws-body font-jakarta text-ws-text-secondary leading-[1.6] max-w-2xl">
              UmojaHub publishes live aggregate data on verified farmer reach, transaction volume,
              and education outcomes. Field staff and programme analysts can access this data on the
              Transparency page without registering.
            </p>
          </AnimateIn>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">Mandate alignment</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              What we can and cannot provide
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MANDATE_ALIGNMENT.map((item, i) => (
              <AnimateIn key={item.area} delay={i * 0.08}>
                <div className="p-6 bg-canvas-base border border-ws-border-soft rounded-sm">
                  <p className="font-ibm-mono text-ws-meta text-teal mb-4">{item.area}</p>
                  <div className="space-y-4">
                    <div>
                      <p className="font-jakarta text-ws-meta font-600 text-teal mb-1">Can provide</p>
                      <p className="font-jakarta text-ws-body text-ws-text-body">{item.can}</p>
                    </div>
                    <div>
                      <p className="font-jakarta text-ws-meta font-600 text-ws-text-meta mb-1">Cannot provide</p>
                      <p className="font-jakarta text-ws-body text-ws-text-secondary">{item.cannot}</p>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">Live data</p>
            <h2 className="text-ws-h2 font-jakarta font-600 text-ws-text-heading mb-8">
              Six indicators available without registration
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {LIVE_STATS.map((stat, i) => (
              <AnimateIn key={stat.label} delay={i * 0.06}>
                <div className="p-5 bg-ws-surface-primary border border-ws-border-soft rounded-sm">
                  <p className="font-jakarta font-600 text-ws-text-heading mb-1">{stat.label}</p>
                  <p className="font-ibm-mono text-ws-meta text-ws-text-meta">{stat.note}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-ws-text-meta mb-3">Cannot provide</p>
            <h2 className="text-ws-h2 font-jakarta font-600 text-ws-text-heading mb-6">
              Outside our scope
            </h2>
            <ul className="space-y-3">
              {CANNOT_PROVIDE.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-ws-border-default" />
                  <span className="font-jakarta text-ws-body text-ws-text-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </AnimateIn>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-6">Frequently asked</p>
          </AnimateIn>
          <div className="space-y-8">
            {FAQ.map((item, i) => (
              <AnimateIn key={item.q} delay={i * 0.08}>
                <div className="border-b border-ws-border-soft pb-8">
                  <p className="font-jakarta font-600 text-ws-text-heading mb-3">{item.q}</p>
                  <p className="font-jakarta text-ws-body text-ws-text-secondary leading-[1.6]">{item.a}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <AnimateIn>
        <section className="py-16 px-6 lg:px-8 bg-canvas-base border-t border-ws-border-soft">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="font-jakarta font-600 text-ws-text-heading mb-1">Partnerships</p>
                <a href="mailto:partnerships@umojahub.org" className="font-ibm-mono text-ws-meta text-teal hover:underline underline-offset-2">
                  partnerships@umojahub.org
                </a>
              </div>
              <div>
                <p className="font-jakarta font-600 text-ws-text-heading mb-1">Press & policy enquiries</p>
                <a href="mailto:press@umojahub.org" className="font-ibm-mono text-ws-meta text-teal hover:underline underline-offset-2">
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
