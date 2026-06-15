import type { Metadata } from 'next';
import Link from 'next/link';
import { MediaFrame } from '@/components/website/MediaFrame';

export const metadata: Metadata = {
  title: 'Education Hub · UmojaHub',
  description:
    'Verified project work. Public record. Auditable chain. A structured verification platform for Kenyan CS students.',
};

const IS_ITEMS = [
  'A structured process, not a self-reported credential',
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
  },
  {
    name: 'Lecturers',
    desc: 'What reviewer participation involves, how verification works, and why it matters.',
    href: '/for/lecturers',
  },
  {
    name: 'Employers',
    desc: 'What was verified, by whom, with what evidence, and how to independently confirm it.',
    href: '/for/employers',
  },
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const H2 = 'text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl';

export default function EducationHubPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid items-center gap-12 pt-24 pb-20 md:pb-28 lg:grid-cols-12`}>
          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              Education Hub
            </p>
            <h1 className="text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
              Verified project work.
              <br />
              Public, auditable record.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
              A structured project verification platform for Kenyan CS students. Projects pass through
              peer review and verified lecturer review, then enter a permanent, publicly verifiable
              portfolio.
            </p>
            <Link
              href="/for/students"
              className="inline-flex items-center justify-center self-start rounded-sm bg-brand px-7 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover active:scale-95"
            >
              Register as a Student
            </Link>
          </div>
          <div className="lg:col-span-5">
            <MediaFrame
              alt="A computer science student working on a verified project"
              label="Student at work"
              aspect="aspect-[4/5]"
              priority
            />
          </div>
        </div>
      </section>

      {/* What it is */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>What the Education Hub is</h2>
          <div className="flex w-full flex-col gap-8 md:flex-row">
            <div className="flex flex-1 flex-col gap-5 rounded border-b-2 border-brand bg-surface p-10">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">What it is</p>
              {IS_ITEMS.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="shrink-0 font-semibold text-brand">+</span>
                  <p className="leading-relaxed text-fg-muted">{item}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-5 rounded border-b-2 border-border-strong bg-surface p-10">
              <p className="text-sm font-semibold uppercase tracking-wide text-fg">What it is not</p>
              {IS_NOT_ITEMS.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="shrink-0 font-medium text-fg-subtle">/</span>
                  <p className="leading-relaxed text-fg-muted">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Audience directory */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>Find your page</h2>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border md:grid-cols-3">
            {AUDIENCE_CARDS.map((card) => (
              <Link
                key={card.name}
                href={card.href}
                className="group flex flex-col gap-3 bg-surface p-8 transition-colors hover:bg-surface-sunken"
              >
                <p className="text-xl font-semibold tracking-tight text-fg">{card.name}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{card.desc}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                  {card.href}
                  <span aria-hidden className="transition-transform duration-fast group-hover:translate-x-0.5">
                    →
                  </span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How-it-works strip */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col items-start gap-6 py-16 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-lg leading-snug text-fg-muted">Want the complete end-to-end walkthrough?</p>
          <Link
            href="/how-it-works"
            className="inline-flex shrink-0 items-center justify-center rounded-sm bg-brand px-7 py-3.5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover active:scale-95"
          >
            How It Works
          </Link>
        </div>
      </section>
    </>
  );
}
