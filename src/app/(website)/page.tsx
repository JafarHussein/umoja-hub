import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';
import { D01DiagramLazy } from '@/components/website/D01DiagramLazy';
import { StoryWorldSection } from '@/components/website/StoryWorld';
import { StoryWorldV2Section } from '@/components/website/StoryWorld/v2';

// Dev-preview flag per STORYWORLD_V2 Resolved Decision 6: V2 renders behind
// NEXT_PUBLIC_STORYWORLD_V2 until launch, when it replaces V1 in place.
const STORYWORLD_V2 = process.env.NEXT_PUBLIC_STORYWORLD_V2 === 'true';

export const metadata: Metadata = {
  title: 'UmojaHub — East Africa\'s Verification Infrastructure',
  description:
    'Verified infrastructure connecting smallholder farmers, CS graduates, and trusted buyers across East Africa. No middlemen. No commissions. No self-reported credentials.',
};

const FARMER_FLOW = [
  { n: 1, title: 'Submit documents', desc: 'National ID, land documentation, farm photograph.' },
  { n: 2, title: 'Administrator review', desc: 'Named administrator reviews for consistency and plausibility.' },
  { n: 3, title: 'APPROVED or REJECTED', desc: 'Rejection includes a reason. Resubmission possible.' },
  { n: 4, title: 'Listings go live', desc: 'Verified farmer can list produce at their own price.' },
  { n: 5, title: 'Trust Score builds', desc: 'Each fulfilled order adds to the publicly visible Trust Score.' },
] as const;

const STUDENT_FLOW = [
  { n: 1, title: 'Submit project + documents', desc: '3 supporting documents per project submission.' },
  { n: 2, title: 'Peer review', desc: 'Anonymised review from fellow students.' },
  { n: 3, title: 'Lecturer review', desc: 'Verified, credentialed lecturer makes the final decision.' },
  { n: 4, title: 'VERIFIED, REVISION, or DENIED', desc: "Each outcome records the reviewer's name and reason." },
  { n: 5, title: 'Portfolio entry created', desc: 'Records: reviewer, credentials, decision, document hash.' },
] as const;

const AUDIENCE_ROW_1 = [
  {
    hub: 'FOOD SECURITY HUB',
    role: 'Farmers',
    desc: 'Sell verified produce to buyers outside your network. M-Pesa payment confirmed before dispatch.',
    cta: 'See what you get →',
    href: '/for/farmers',
  },
  {
    hub: 'EDUCATION HUB',
    role: 'Students',
    desc: 'Build a verifiable project portfolio. Reviewed by credentialed lecturers who record their decision.',
    cta: 'See what you get →',
    href: '/for/students',
  },
  {
    hub: 'FOOD SECURITY HUB',
    role: 'Buyers',
    desc: 'Purchase produce from farmers with visible transaction history, verified identity, and public Trust Score.',
    cta: 'See how it works →',
    href: '/for/buyers',
  },
] as const;

const AUDIENCE_ROW_2 = [
  {
    hub: 'EDUCATION HUB',
    role: 'Employers',
    desc: "Read student portfolios that include the reviewer's name, credentials, and decision rationale.",
    cta: 'See how to verify →',
    href: '/for/employers',
  },
  {
    hub: 'EDUCATION HUB',
    role: 'Lecturers',
    desc: 'Review student project submissions. Your name, credentials, and decision are recorded permanently.',
    cta: 'Apply as lecturer →',
    href: '/for/lecturers',
  },
  {
    hub: 'BOTH HUBS',
    role: 'NGOs & Government',
    desc: 'Mandate alignment and impact metrics with full methodology disclosure and auditable evidence chains.',
    cta: 'See impact data →',
    href: '/for/ngos',
  },
] as const;

const PRINCIPLES = [
  {
    label: 'HUMAN DECISION',
    desc: 'Verification is a human decision by a named administrator — not an automated checkbox.',
  },
  {
    label: 'EVIDENCE ON RECORD',
    desc: 'Every decision records the reviewer, the evidence reviewed, and the outcome. Auditable.',
  },
  {
    label: 'CORRECTABLE',
    desc: 'Rejection is not permanent. Resubmission with additional documentation is possible.',
  },
] as const;

// Shared section container — consistent max-width + responsive gutters.
const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const EYEBROW = 'font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand';

type AudienceCardData = {
  hub: string;
  role: string;
  desc: string;
  cta: string;
  href: string;
};

function AudienceCard({ card, delay }: { card: AudienceCardData; delay: number }) {
  return (
    <AnimateIn delay={delay} className="flex-1">
      <Link
        href={card.href}
        className="group flex h-full flex-col gap-3 rounded-sm border border-border bg-surface p-8 transition-all duration-standard ease-standard hover:-translate-y-0.5 hover:border-border-strong"
      >
        <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle">
          {card.hub}
        </p>
        <p className="text-xl font-semibold tracking-tight text-fg">{card.role}</p>
        <p className="text-sm leading-relaxed text-fg-muted">{card.desc}</p>
        <p className="mt-2 text-sm font-semibold text-brand transition-transform duration-fast group-hover:translate-x-0.5">
          {card.cta}
        </p>
      </Link>
    </AnimateIn>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ── S1: Hero (inverted dark band inside the light website) ── */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col items-center gap-6 py-28 md:py-32 text-center`}>
          <AnimateIn>
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand-text">
              East Africa&apos;s Verification Infrastructure
            </p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="max-w-5xl text-5xl font-extrabold leading-none tracking-tight text-fg md:text-7xl">
              Verified Farmers.<br />
              Verified Talent.<br />
              East African Trust Infrastructure.
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="max-w-2xl text-lg leading-relaxed text-fg-muted">
              The verification layer connecting smallholder farmers, agricultural graduates,
              and trusted buyers across East Africa.
            </p>
          </AnimateIn>
          <AnimateIn delay={0.24}>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/for/farmers"
                className="inline-flex items-center rounded-sm bg-brand px-7 py-4 font-semibold text-brand-fg transition-all duration-fast ease-standard hover:bg-brand-hover active:scale-95"
              >
                Food Security Hub →
              </Link>
              <Link
                href="/education"
                className="inline-flex items-center rounded-sm border border-border-strong px-7 py-4 font-semibold text-fg transition-all duration-standard ease-standard hover:border-fg-subtle"
              >
                Education Hub →
              </Link>
            </div>
          </AnimateIn>
          <AnimateIn delay={0.32}>
            <p className="text-sm font-medium text-fg-subtle">
              Verification methodology published · Open appeals process · Named administrators
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ── S2: Two Structural Failures ── */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-14 py-24`}>
          <AnimateIn>
            <div className="flex flex-col gap-3">
              <p className={EYEBROW}>Why Verification</p>
              <h2 className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
                Two industries.<br />
                One structural failure.
              </h2>
            </div>
          </AnimateIn>

          <div className="flex flex-col gap-8 md:flex-row">
            <AnimateIn className="flex-1">
              <div className="flex h-full flex-col gap-5 rounded-sm border border-border bg-surface p-10">
                <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
                  Food Security Hub
                </p>
                <h3 className="text-xl font-semibold leading-snug tracking-tight text-fg">
                  The Farmer Problem
                </h3>
                <p className="leading-relaxed text-fg-muted">
                  Farmers sell through brokers who know the end-market price. The farmer does not.
                  There is no mechanism to compare offers, signal reliability to buyers they have
                  never met, or receive payment without physical presence. This is not individual
                  bad actors — it is a structural information asymmetry.
                </p>
              </div>
            </AnimateIn>
            <AnimateIn delay={0.08} className="flex-1">
              <div className="flex h-full flex-col gap-5 rounded-sm border border-border bg-surface p-10">
                <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
                  Education Hub
                </p>
                <h3 className="text-xl font-semibold leading-snug tracking-tight text-fg">
                  The Student Problem
                </h3>
                <p className="leading-relaxed text-fg-muted">
                  CS graduates leave with degrees that certify attendance, GitHub repos that are
                  self-reported, and CVs that describe claims no one can verify. Employers have seen
                  AI-generated portfolios and inflated credentials. This is not student dishonesty —
                  it is the absence of a trustworthy verification mechanism.
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

      {/* ── S3: Verification Philosophy ── */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col items-center gap-12 py-24`}>
          <AnimateIn className="flex flex-col items-center gap-3 text-center">
            <p className={EYEBROW}>The Verification Philosophy</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
              One infrastructure.<br />
              Two hubs.
            </h2>
            <p className="max-w-2xl leading-relaxed text-fg-muted">
              Nothing claimed on UmojaHub is unverified. Farmer identity, land documentation,
              produce listings — and student projects, reviewer credentials, portfolio entries —
              all pass through the same verification spine.
            </p>
          </AnimateIn>

          {/* D01 — Verification Spine Diagram */}
          <D01DiagramLazy />

          {/* 3 Principles */}
          <div className="flex w-full flex-col gap-6 md:flex-row">
            {PRINCIPLES.map((p, i) => (
              <AnimateIn key={p.label} delay={i * 0.08} className="flex-1">
                <div className="flex h-full flex-col gap-2.5 rounded-sm border border-border bg-surface p-7">
                  <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
                    {p.label}
                  </p>
                  <p className="text-sm leading-relaxed text-fg-muted">{p.desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── S4: Verification in Practice ── */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <AnimateIn>
            <p className={EYEBROW}>How It Works</p>
          </AnimateIn>
          <AnimateIn>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
              Verification in practice.
            </h2>
          </AnimateIn>

          <div className="flex flex-col gap-8 md:flex-row">
            {/* Farmer flow */}
            <AnimateIn className="flex-1">
              <div className="flex h-full flex-col rounded-sm border border-border bg-surface p-10">
                <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
                  Food Security Hub
                </p>
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

            {/* Student flow */}
            <AnimateIn delay={0.08} className="flex-1">
              <div className="flex h-full flex-col rounded-sm border border-border bg-surface p-10">
                <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
                  Education Hub
                </p>
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

      {/* ── S5: StoryWorld — The Commons (V2) behind dev flag, Witness (V1) default ── */}
      {STORYWORLD_V2 ? <StoryWorldV2Section /> : <StoryWorldSection />}

      {/* ── S6: Audience Routing ── */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <AnimateIn>
            <p className={EYEBROW}>For Your Role</p>
          </AnimateIn>
          <AnimateIn>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
              Who are you here for?
            </h2>
          </AnimateIn>

          <div className="flex flex-col gap-6 md:flex-row">
            {AUDIENCE_ROW_1.map((card, i) => (
              <AudienceCard key={card.role} card={card} delay={i * 0.08} />
            ))}
          </div>

          <div className="flex flex-col gap-6 md:flex-row">
            {AUDIENCE_ROW_2.map((card, i) => (
              <AudienceCard key={card.role} card={card} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
