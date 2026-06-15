import type { Metadata } from 'next';
import { MediaFrame } from '@/components/website/MediaFrame';

export const metadata: Metadata = {
  title: 'About · UmojaHub',
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
    failure: 'CS graduates cannot demonstrate the quality of their work to employers who have no access to university assessment. Employers cannot distinguish skill from credential.',
  },
  {
    tag: 'Both hubs',
    failure: 'No shared verification infrastructure exists for smallholder economic participation in East Africa. Existing platforms require formal banking, smartphones with data, or international payment rails.',
  },
] as const;

const HUB_STATUS = [
  { hub: 'Food Security Hub', status: 'Operational', live: true, description: 'Farmer verification, marketplace, M-Pesa payments, and cooperative group orders are live.' },
  { hub: 'Education Hub', status: 'Operational', live: true, description: 'Student submission, SHA-256 hashing, lecturer review, and portfolio publication are live.' },
  { hub: 'Price Intelligence', status: 'In scope', live: false, description: 'Live market benchmarking for verified farmers. Roadmap item.' },
] as const;

const IS_NOT_ITEMS = [
  'A charity, NGO, or grant-funded initiative',
  'A government programme or state-affiliated platform',
  'A microfinance, loan, or credit product',
  'An aggregator or intermediary that takes margin between farmers and buyers',
  'A certification body or accreditation authority',
] as const;

const CONTACTS = [
  { purpose: 'Partnerships and institutional access', email: 'partnerships@umojahub.org' },
  { purpose: 'Press and policy enquiries', email: 'press@umojahub.org' },
  { purpose: 'General', email: 'hello@umojahub.org' },
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const H2 = 'text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl';

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid items-center gap-12 pt-24 pb-20 md:pb-28 lg:grid-cols-12`}>
          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              About
            </p>
            <h1 className="text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
              Why UmojaHub exists.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
              Built to address structural gaps in how smallholder farmers sell produce and how CS
              graduates demonstrate skill. Neither failure is about effort or talent. Both are about
              the absence of verifiable trust.
            </p>
          </div>
          <div className="lg:col-span-5">
            <MediaFrame
              alt="Smallholder farmland in East Africa"
              label="East African farmland"
              aspect="aspect-[4/5]"
              priority
            />
          </div>
        </div>
      </section>

      {/* Structural failures */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>Three structural failures this platform addresses</h2>
          <div className="grid grid-cols-1 divide-y divide-border border-y border-border">
            {STRUCTURAL_FAILURES.map((item) => (
              <div key={item.tag} className="flex flex-col gap-3 py-8 md:flex-row md:gap-10">
                <p className="w-full shrink-0 text-base font-semibold text-fg md:w-64">{item.tag}</p>
                <p className="flex-1 leading-relaxed text-fg-muted">{item.failure}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hub status */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>Platform scope and status</h2>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border md:grid-cols-3">
            {HUB_STATUS.map((item) => (
              <div key={item.hub} className="flex flex-col gap-3 bg-surface p-7">
                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-sm px-2.5 py-1 font-ibm-mono text-xs ${
                    item.live ? 'bg-success/10 text-success' : 'border border-border-strong text-fg-subtle'
                  }`}
                >
                  {item.live && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
                  {item.status}
                </span>
                <p className="font-semibold text-fg">{item.hub}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What this is not */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} max-w-4xl py-24`}>
          <h2 className={H2}>Five things outside our scope</h2>
          <ul className="mt-8 flex flex-col gap-3">
            {IS_NOT_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fg-subtle" />
                <span className="text-fg-muted">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>Contact</h2>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border md:grid-cols-3">
            {CONTACTS.map((contact) => (
              <div key={contact.email} className="flex flex-col gap-2 bg-surface p-7">
                <p className="text-sm text-fg-muted">{contact.purpose}</p>
                <a
                  href={`mailto:${contact.email}`}
                  className="font-ibm-mono text-sm text-brand underline-offset-2 hover:underline"
                >
                  {contact.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
