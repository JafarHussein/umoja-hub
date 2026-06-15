import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'For NGOs and Government · UmojaHub',
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
    a: 'Yes. Aggregate, anonymised data from the Transparency page is licensed for use in non-commercial impact reports with attribution. Contact us for specific arrangements.',
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
const H2 = 'text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl';

export default function ForNGOsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className={`${CONTAINER} max-w-4xl pt-24 pb-20 md:pb-28`}>
          <p className="mb-4 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
            For NGOs and government
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-fg md:text-6xl">
            Verified impact data.
            <br />
            No agreement required to browse.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            UmojaHub publishes live aggregate data on verified farmer reach, transaction volume, and
            education outcomes. Field staff and programme analysts can access it on the Transparency
            page without registering.
          </p>
        </div>
      </section>

      {/* Mandate alignment */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <h2 className={H2}>What we can and cannot provide</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {MANDATE_ALIGNMENT.map((item) => (
              <div key={item.area} className="rounded border border-border bg-surface p-8">
                <p className="mb-4 text-sm font-semibold text-brand">{item.area}</p>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">Can provide</p>
                    <p className="text-fg">{item.can}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Cannot provide</p>
                    <p className="text-fg-muted">{item.cannot}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live data */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>Six indicators available without registration</h2>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {LIVE_STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1 bg-surface p-6">
                <p className="font-semibold text-fg">{stat.label}</p>
                <p className="font-ibm-mono text-xs text-fg-subtle">{stat.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cannot provide */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} max-w-4xl py-24`}>
          <h2 className={H2}>Outside our scope</h2>
          <ul className="mt-8 flex flex-col gap-3">
            {CANNOT_PROVIDE.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fg-subtle" />
                <span className="text-fg-muted">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-background">
        <div className={`${CONTAINER} max-w-4xl py-24`}>
          <h2 className={H2}>Frequently asked</h2>
          <div className="mt-10 grid grid-cols-1 divide-y divide-border border-y border-border">
            {FAQ.map((item) => (
              <div key={item.q} className="py-8">
                <p className="mb-3 text-lg font-semibold text-fg">{item.q}</p>
                <p className="leading-relaxed text-fg-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} grid grid-cols-1 gap-8 py-16 md:grid-cols-2`}>
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
            <p className="mb-1 font-semibold text-fg">Press and policy enquiries</p>
            <a
              href="mailto:press@umojahub.org"
              className="font-ibm-mono text-sm text-brand underline-offset-2 hover:underline"
            >
              press@umojahub.org
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
