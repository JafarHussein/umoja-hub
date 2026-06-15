import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';
import { D01DiagramLazy } from '@/components/website/D01DiagramLazy';
import { MediaFrame } from '@/components/website/MediaFrame';

export const metadata: Metadata = {
  title: "UmojaHub: East Africa's Verification Infrastructure",
  description:
    'Verified infrastructure connecting smallholder farmers, CS graduates, and trusted buyers across East Africa. No middlemen. No commissions. No self-reported credentials.',
};

const FARMER_FLOW = [
  { n: 1, title: 'Submit documents', desc: 'National ID, land documentation, farm photograph.' },
  { n: 2, title: 'Administrator review', desc: 'Named administrator reviews for consistency and plausibility.' },
  { n: 3, title: 'Approved or rejected', desc: 'Rejection includes a reason. Resubmission possible.' },
  { n: 4, title: 'Listings go live', desc: 'Verified farmer can list produce at their own price.' },
  { n: 5, title: 'Trust Score builds', desc: 'Each fulfilled order adds to the publicly visible Trust Score.' },
] as const;

const STUDENT_FLOW = [
  { n: 1, title: 'Submit project and documents', desc: '3 supporting documents per project submission.' },
  { n: 2, title: 'Peer review', desc: 'Anonymised review from fellow students.' },
  { n: 3, title: 'Lecturer review', desc: 'Verified, credentialed lecturer makes the final decision.' },
  { n: 4, title: 'Verified, revision, or denied', desc: "Each outcome records the reviewer's name and reason." },
  { n: 5, title: 'Portfolio entry created', desc: 'Records: reviewer, credentials, decision, document hash.' },
] as const;

const AUDIENCE = [
  {
    hub: 'Food Security Hub',
    role: 'Farmers',
    desc: 'Sell verified produce to buyers outside your network. M-Pesa payment confirmed before dispatch.',
    cta: 'See what you get',
    href: '/for/farmers',
  },
  {
    hub: 'Education Hub',
    role: 'Students',
    desc: 'Build a verifiable project portfolio. Reviewed by credentialed lecturers who record their decision.',
    cta: 'See what you get',
    href: '/for/students',
  },
  {
    hub: 'Food Security Hub',
    role: 'Buyers',
    desc: 'Purchase produce from farmers with visible transaction history, verified identity, and public Trust Score.',
    cta: 'See how it works',
    href: '/for/buyers',
  },
  {
    hub: 'Education Hub',
    role: 'Employers',
    desc: "Read student portfolios that include the reviewer's name, credentials, and decision rationale.",
    cta: 'See how to verify',
    href: '/for/employers',
  },
  {
    hub: 'Education Hub',
    role: 'Lecturers',
    desc: 'Review student project submissions. Your name, credentials, and decision are recorded permanently.',
    cta: 'Apply as lecturer',
    href: '/for/lecturers',
  },
  {
    hub: 'Both hubs',
    role: 'NGOs and Government',
    desc: 'Mandate alignment and impact metrics with full methodology disclosure and auditable evidence chains.',
    cta: 'See impact data',
    href: '/for/ngos',
  },
] as const;

const PRINCIPLES = [
  {
    label: 'Human decision',
    desc: 'Verification is a human decision by a named administrator, not an automated checkbox.',
  },
  {
    label: 'Evidence on record',
    desc: 'Every decision records the reviewer, the evidence reviewed, and the outcome. Auditable.',
  },
  {
    label: 'Correctable',
    desc: 'Rejection is not permanent. Resubmission with additional documentation is possible.',
  },
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';

export default function HomePage() {
  return (
    <>
      {/* ── S1: Hero. Asymmetric split, light. ── */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid items-center gap-12 pt-24 pb-20 md:pb-28 lg:grid-cols-12`}>
          <div className="flex flex-col gap-6 lg:col-span-7">
            <AnimateIn>
              <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
                East Africa&apos;s verification infrastructure
              </p>
            </AnimateIn>
            <AnimateIn delay={0.08}>
              <h1 className="text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
                Verified farmers.
                <br />
                Verified graduates.
              </h1>
            </AnimateIn>
            <AnimateIn delay={0.16}>
              <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
                The verification layer connecting smallholder farmers, agricultural graduates, and
                trusted buyers across East Africa.
              </p>
            </AnimateIn>
            <AnimateIn delay={0.24}>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/for/farmers"
                  className="inline-flex items-center justify-center rounded-sm bg-brand px-7 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover active:scale-95"
                >
                  Food Security Hub
                </Link>
                <Link
                  href="/education"
                  className="inline-flex items-center justify-center rounded-sm border border-border-strong px-7 py-4 font-semibold text-fg transition-colors hover:bg-surface-sunken"
                >
                  Education Hub
                </Link>
              </div>
            </AnimateIn>
          </div>
          <AnimateIn delay={0.12} className="lg:col-span-5">
            <MediaFrame
              alt="A verified smallholder farmer at harvest in East Africa"
              label="Farmer at harvest"
              aspect="aspect-[4/5]"
              priority
            />
          </AnimateIn>
        </div>
      </section>

      {/* ── S2: Two structural failures ── */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-14 py-24`}>
          <AnimateIn>
            <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
              Two industries. One structural failure.
            </h2>
          </AnimateIn>

          <div className="flex flex-col gap-8 md:flex-row">
            <AnimateIn className="flex-1">
              <div className="flex h-full flex-col gap-5 rounded border border-border bg-surface p-10">
                <p className="text-sm font-semibold text-brand">Food Security Hub</p>
                <h3 className="text-xl font-semibold leading-snug tracking-tight text-fg">
                  The Farmer Problem
                </h3>
                <p className="leading-relaxed text-fg-muted">
                  Farmers sell through brokers who know the end-market price. The farmer does not.
                  There is no mechanism to compare offers, signal reliability to buyers they have
                  never met, or receive payment without physical presence. This is not individual
                  bad actors. It is a structural information asymmetry.
                </p>
              </div>
            </AnimateIn>
            <AnimateIn delay={0.08} className="flex-1">
              <div className="flex h-full flex-col gap-5 rounded border border-border bg-surface p-10">
                <p className="text-sm font-semibold text-brand">Education Hub</p>
                <h3 className="text-xl font-semibold leading-snug tracking-tight text-fg">
                  The Student Problem
                </h3>
                <p className="leading-relaxed text-fg-muted">
                  CS graduates leave with degrees that certify attendance, GitHub repos that are
                  self-reported, and CVs that describe claims no one can verify. Employers have seen
                  AI-generated portfolios and inflated credentials. This is not student dishonesty.
                  It is the absence of a trustworthy verification mechanism.
                </p>
              </div>
            </AnimateIn>
          </div>

          <AnimateIn>
            <p className="mx-auto max-w-3xl text-center text-lg font-medium leading-relaxed text-fg">
              Both problems share the same root: the absence of a mechanism to establish trust
              between strangers before a consequential transaction.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ── S3: Verification philosophy ── */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col items-center gap-12 py-24`}>
          <AnimateIn className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
              One infrastructure. Two hubs.
            </h2>
            <p className="max-w-2xl leading-relaxed text-fg-muted">
              Nothing claimed on UmojaHub is unverified. Farmer identity, land documentation, and
              produce listings, plus student projects, reviewer credentials, and portfolio entries,
              all pass through the same verification spine.
            </p>
          </AnimateIn>

          {/* D01 verification spine diagram */}
          <D01DiagramLazy />

          {/* 3 principles, grouped by dividers (not cards) */}
          <div className="grid w-full grid-cols-1 divide-y divide-border border-t border-border md:grid-cols-3 md:divide-x md:divide-y-0">
            {PRINCIPLES.map((p) => (
              <AnimateIn key={p.label} className="md:px-8 md:first:pl-0 md:last:pr-0">
                <div className="flex flex-col gap-2.5 py-8 md:py-2">
                  <p className="text-base font-semibold text-fg">{p.label}</p>
                  <p className="text-sm leading-relaxed text-fg-muted">{p.desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── S4: Verification in practice ── */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <AnimateIn>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
              Verification in practice.
            </h2>
          </AnimateIn>

          <div className="flex flex-col gap-8 md:flex-row">
            <AnimateIn className="flex-1">
              <div className="flex h-full flex-col rounded border border-border bg-surface p-10">
                <p className="text-sm font-semibold text-brand">Food Security Hub</p>
                <div className="h-5" />
                {FARMER_FLOW.map((step, idx) => (
                  <div key={step.n}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand">
                        <span className="text-xs font-semibold text-brand-fg">{step.n}</span>
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5">
                        <p className="text-sm font-semibold text-fg">{step.title}</p>
                        <p className="text-xs leading-relaxed text-fg-muted">{step.desc}</p>
                      </div>
                    </div>
                    {idx < FARMER_FLOW.length - 1 && <div className="h-6" />}
                  </div>
                ))}
              </div>
            </AnimateIn>

            <AnimateIn delay={0.08} className="flex-1">
              <div className="flex h-full flex-col rounded border border-border bg-surface p-10">
                <p className="text-sm font-semibold text-brand">Education Hub</p>
                <div className="h-5" />
                {STUDENT_FLOW.map((step, idx) => (
                  <div key={step.n}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand">
                        <span className="text-xs font-semibold text-brand-fg">{step.n}</span>
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5">
                        <p className="text-sm font-semibold text-fg">{step.title}</p>
                        <p className="text-xs leading-relaxed text-fg-muted">{step.desc}</p>
                      </div>
                    </div>
                    {idx < STUDENT_FLOW.length - 1 && <div className="h-6" />}
                  </div>
                ))}
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── S5: The thesis. Editorial manifesto beat. ── */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid gap-x-16 gap-y-10 py-28 lg:grid-cols-12 lg:py-36`}>
          <AnimateIn className="lg:col-span-8">
            <h2 className="text-4xl font-semibold leading-tight tracking-tight text-fg md:text-5xl lg:text-6xl">
              Trust you can check,
              <br />
              not trust you are asked to take.
            </h2>
          </AnimateIn>

          <AnimateIn delay={0.12} className="flex flex-col justify-end gap-6 lg:col-span-4">
            <p className="max-w-prose text-lg leading-relaxed text-fg-muted">
              Every farmer&apos;s record and every student&apos;s portfolio is built from real,
              recorded events. A named person verifies each one, and the result stays public for
              anyone to audit.
            </p>
            <Link
              href="/transparency"
              className="group inline-flex items-center gap-2 self-start text-base font-semibold text-brand transition-colors hover:text-brand-hover"
            >
              See the live numbers
              <span aria-hidden className="transition-transform duration-fast group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* ── S6: Audience directory ── */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <AnimateIn>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
              Who are you here for?
            </h2>
          </AnimateIn>

          <AnimateIn>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
              {AUDIENCE.map((card) => (
                <Link
                  key={card.role}
                  href={card.href}
                  className="group flex flex-col gap-3 bg-surface p-8 transition-colors hover:bg-surface-sunken"
                >
                  <p className="text-xs font-medium text-fg-subtle">{card.hub}</p>
                  <p className="text-xl font-semibold tracking-tight text-fg">{card.role}</p>
                  <p className="text-sm leading-relaxed text-fg-muted">{card.desc}</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                    {card.cta}
                    <span
                      aria-hidden
                      className="transition-transform duration-fast group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </p>
                </Link>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
