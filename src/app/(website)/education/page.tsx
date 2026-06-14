import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Education Hub — UmojaHub',
  description:
    'Verified project work. Public record. Auditable chain. A structured verification platform for Kenyan CS students.',
};

const IS_ITEMS = [
  'A structured process — not a self-reported credential',
  'Three specific documents reviewed against a published rubric',
  'Peer review followed by an independent verified-lecturer decision',
  'A cryptographic hash confirming documents were not altered after review',
  'A permanent, publicly readable portfolio entry',
] as const;

const IS_NOT_ITEMS = [
  'An accredited academic credential',
  'A certification of employment readiness',
  'Affiliated with any university or government body',
  'A guarantee of code authorship',
  'A salary floor or benchmark',
] as const;

const AUDIENCE_CARDS = [
  {
    name: 'Students',
    desc: 'What Portfolio Verified means for you, what the process requires, and what an employer sees.',
    href: '/for/students',
    path: '/for/students',
  },
  {
    name: 'Lecturers',
    desc: 'What reviewer participation involves, how verification works, and why it matters.',
    href: '/for/lecturers',
    path: '/for/lecturers',
  },
  {
    name: 'Employers',
    desc: 'What was verified, by whom, with what evidence, and how to independently confirm it.',
    href: '/for/employers',
    path: '/for/employers',
  },
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const SECTION_LABEL = 'font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle';

export default function EducationHubPage() {
  return (
    <>
      {/* Hero */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-7 py-24`}>
          <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand-text">
            Education Hub
          </p>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
            Verified project work.
            <br />
            Public record.
            <br />
            Auditable chain.
          </h1>
          <p className="max-w-3xl text-xl leading-relaxed text-fg-muted">
            The Education Hub is a structured project verification platform for Kenyan CS students.
            Projects pass through a documented review process involving peer review and verified
            lecturer review. Successful projects are recorded in a permanent, publicly verifiable
            portfolio.
          </p>
        </div>
      </section>

      {/* S1 — What It Is */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <p className={SECTION_LABEL}>Section 01</p>
          <p className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            What the Education Hub is
          </p>
          <div className="flex w-full flex-col gap-8 md:flex-row">
            {/* IS column */}
            <div className="flex flex-1 flex-col gap-5 border-b-2 border-brand bg-surface p-10">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">What it IS</p>
              {IS_ITEMS.map((item) => (
                <p key={item} className="leading-relaxed text-fg-muted">
                  ✓{'  '}
                  {item}
                </p>
              ))}
            </div>

            {/* IS NOT column */}
            <div className="flex flex-1 flex-col gap-5 border-b-2 border-border-strong bg-surface p-10">
              <p className="text-sm font-semibold uppercase tracking-wide text-fg">What it IS NOT</p>
              {IS_NOT_ITEMS.map((item) => (
                <p key={item} className="leading-relaxed text-fg-muted">
                  ×{'  '}
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* S2 — Audience Routing */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <p className={SECTION_LABEL}>Section 02</p>
          <p className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            Find your page
          </p>
          <div className="flex w-full flex-col gap-5 md:flex-row">
            {AUDIENCE_CARDS.map((card) => (
              <Link
                key={card.name}
                href={card.href}
                className="flex flex-1 flex-col gap-5 rounded-sm border border-border bg-surface px-8 py-9 transition-colors hover:border-border-strong"
              >
                <p className="text-xl font-semibold tracking-tight text-fg">{card.name}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{card.desc}</p>
                <p className="font-ibm-mono text-xs text-brand-text">
                  {card.path}
                  {'  →'}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How-Strip */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col items-start gap-6 py-12 sm:flex-row sm:items-center`}>
          <p className="flex-1 text-lg leading-snug text-fg-muted">
            Want the complete end-to-end walkthrough?
          </p>
          <Link
            href="/how-it-works"
            className="inline-flex shrink-0 items-center rounded-sm bg-brand px-7 py-3.5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
          >
            How It Works
          </Link>
        </div>
      </section>
    </>
  );
}
