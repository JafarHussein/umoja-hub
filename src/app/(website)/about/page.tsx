import type { Metadata } from 'next';
import { AnimateIn } from '@/components/website/AnimateIn';

export const metadata: Metadata = {
  title: 'About — UmojaHub',
  description:
    'Why UmojaHub exists, what problems it was built to address, and what it is not attempting to solve.',
};

const STRUCTURAL_FAILURES = [
  {
    tag: 'Food Security Hub',
    failure: 'Farmers cannot prove their identity or track record to distant buyers. Buyers cannot assess risk before committing. Intermediaries capture the margin between them.',
  },
  {
    tag: 'Education Hub',
    failure: "CS graduates cannot demonstrate the quality of their work to employers who have no access to university assessment. Employers cannot distinguish skill from credential.",
  },
  {
    tag: 'Both hubs',
    failure: 'No shared verification infrastructure exists for smallholder economic participation in East Africa. Existing platforms require access to formal banking, smartphones with data, or international payment rails.',
  },
] as const;

const HUB_STATUS = [
  { hub: 'Food Security Hub', status: 'OPERATIONAL', description: 'Farmer verification, marketplace, M-Pesa payments, and cooperative group orders are live.' },
  { hub: 'Education Hub', status: 'OPERATIONAL', description: 'Student submission, SHA-256 hashing, lecturer review, and portfolio publication are live.' },
  { hub: 'Price Intelligence', status: 'IN SCOPE', description: 'Live market benchmarking for verified farmers. Roadmap item.' },
] as const;

const IS_NOT_ITEMS = [
  'A charity, NGO, or grant-funded initiative',
  'A government programme or state-affiliated platform',
  'A microfinance, loan, or credit product',
  'An aggregator or intermediary that takes margin between farmers and buyers',
  'A certification body or accreditation authority',
] as const;

const CONTACTS = [
  { purpose: 'Partnerships & institutional access', email: 'partnerships@umojahub.org' },
  { purpose: 'Press & policy enquiries', email: 'press@umojahub.org' },
  { purpose: 'General', email: 'hello@umojahub.org' },
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';

export default function AboutPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} max-w-4xl py-24`}>
          <AnimateIn>
            <p className="mb-4 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand-text">
              About
            </p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-fg md:text-5xl">
              Why UmojaHub exists
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              UmojaHub was built to address structural gaps in how smallholder farmers sell produce
              and how CS graduates demonstrate skill in East Africa. Neither market failure is about
              effort or talent. Both are about the absence of verifiable trust infrastructure.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Structural failures */}
      <section className="border-y border-border bg-surface-sunken">
        <div className={`${CONTAINER} py-24`}>
          <AnimateIn>
            <p className="mb-3 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              The problems
            </p>
            <h2 className="mb-12 text-3xl font-semibold tracking-tight text-fg md:text-4xl">
              Three structural failures this platform addresses
            </h2>
          </AnimateIn>
          <div className="space-y-4">
            {STRUCTURAL_FAILURES.map((item, i) => (
              <AnimateIn key={item.tag} delay={i * 0.08}>
                <div className="rounded-sm border border-border bg-surface p-6">
                  <span className="mb-3 inline-block font-ibm-mono text-xs uppercase tracking-wide text-brand">
                    {item.tag}
                  </span>
                  <p className="leading-relaxed text-fg-muted">{item.failure}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Hub status */}
      <section className="bg-background">
        <div className={`${CONTAINER} py-24`}>
          <AnimateIn>
            <p className="mb-3 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              What is built
            </p>
            <h2 className="mb-12 text-3xl font-semibold tracking-tight text-fg md:text-4xl">
              Platform scope and status
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {HUB_STATUS.map((item, i) => (
              <AnimateIn key={item.hub} delay={i * 0.08}>
                <div className="rounded-sm border border-border bg-surface p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`rounded-sm border px-2 py-0.5 font-ibm-mono text-xs ${
                        item.status === 'OPERATIONAL'
                          ? 'border-success/30 bg-success/10 text-success'
                          : 'border-border-strong text-fg-subtle'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mb-3 font-semibold text-fg">{item.hub}</p>
                  <p className="leading-relaxed text-fg-muted">{item.description}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* IS NOT */}
      <AnimateIn>
        <section className="border-y border-border bg-surface-sunken">
          <div className={`${CONTAINER} max-w-4xl py-24`}>
            <p className="mb-3 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle">
              What this is not
            </p>
            <h2 className="mb-6 text-2xl font-semibold tracking-tight text-fg md:text-3xl">
              Five things outside our scope
            </h2>
            <ul className="space-y-3">
              {IS_NOT_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fg-subtle" />
                  <span className="text-fg-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </AnimateIn>

      {/* Contact */}
      <AnimateIn>
        <section className="bg-background">
          <div className={`${CONTAINER} py-24`}>
            <p className="mb-8 font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              Contact
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {CONTACTS.map((contact, i) => (
                <AnimateIn key={contact.email} delay={i * 0.08}>
                  <div className="rounded-sm border border-border bg-surface p-6">
                    <p className="mb-2 text-sm text-fg-muted">{contact.purpose}</p>
                    <a
                      href={`mailto:${contact.email}`}
                      className="font-ibm-mono text-sm text-brand underline-offset-2 hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>
      </AnimateIn>
    </>
  );
}
