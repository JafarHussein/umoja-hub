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

export default function AboutPage() {
  return (
    <>
      <section className="pt-32 pb-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-4">About</p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="text-ws-h1 font-jakarta font-700 text-ws-text-heading leading-[1.15] tracking-[-0.02em]">
              Why UmojaHub exists
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mt-5 text-ws-body font-jakarta text-ws-text-secondary leading-[1.6] max-w-2xl">
              UmojaHub was built to address structural gaps in how smallholder farmers sell produce
              and how CS graduates demonstrate skill in East Africa. Neither market failure is about
              effort or talent. Both are about the absence of verifiable trust infrastructure.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Structural failures */}
      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">The problems</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              Three structural failures this platform addresses
            </h2>
          </AnimateIn>
          <div className="space-y-4">
            {STRUCTURAL_FAILURES.map((item, i) => (
              <AnimateIn key={item.tag} delay={i * 0.08}>
                <div className="p-6 bg-canvas-base border border-ws-border-soft rounded-sm">
                  <span className="inline-block font-ibm-mono text-ws-meta text-teal mb-3">{item.tag}</span>
                  <p className="font-jakarta text-ws-body text-ws-text-body leading-[1.6]">{item.failure}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Hub status */}
      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-teal mb-3">What is built</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              Platform scope and status
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HUB_STATUS.map((item, i) => (
              <AnimateIn key={item.hub} delay={i * 0.08}>
                <div className="p-6 bg-ws-surface-primary border border-ws-border-soft rounded-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`font-ibm-mono text-ws-meta px-2 py-0.5 rounded-sm border ${
                      item.status === 'OPERATIONAL'
                        ? 'text-teal border-teal/30 bg-ws-surface-success'
                        : 'text-ws-text-secondary border-ws-border-default bg-ws-surface-primary'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="font-jakarta font-600 text-ws-text-heading mb-3">{item.hub}</p>
                  <p className="font-jakarta text-ws-body text-ws-text-secondary leading-[1.6]">{item.description}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* IS NOT */}
      <AnimateIn>
        <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
          <div className="mx-auto max-w-4xl">
            <p className="font-ibm-mono text-ws-meta text-ws-text-meta mb-3">What this is not</p>
            <h2 className="text-ws-h2 font-jakarta font-600 text-ws-text-heading mb-6">
              Five things outside our scope
            </h2>
            <ul className="space-y-3">
              {IS_NOT_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-ws-border-default" />
                  <span className="font-jakarta text-ws-body text-ws-text-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </AnimateIn>

      {/* Contact */}
      <AnimateIn>
        <section className="py-24 px-6 lg:px-8 bg-canvas-base">
          <div className="mx-auto max-w-7xl">
            <p className="font-ibm-mono text-ws-meta text-teal mb-8">Contact</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { purpose: 'Partnerships & institutional access', email: 'partnerships@umojahub.org' },
                { purpose: 'Press & policy enquiries', email: 'press@umojahub.org' },
                { purpose: 'General', email: 'hello@umojahub.org' },
              ].map((contact, i) => (
                <AnimateIn key={contact.email} delay={i * 0.08}>
                  <div className="p-6 bg-ws-surface-primary border border-ws-border-soft rounded-sm">
                    <p className="font-jakarta text-ws-meta text-ws-text-secondary mb-2">{contact.purpose}</p>
                    <a
                      href={`mailto:${contact.email}`}
                      className="font-ibm-mono text-ws-meta text-teal hover:underline underline-offset-2"
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
