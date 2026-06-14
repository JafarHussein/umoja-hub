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
    accentClass: 'text-copper',
  },
  {
    hub: 'EDUCATION HUB',
    role: 'Students',
    desc: 'Build a verifiable project portfolio. Reviewed by credentialed lecturers who record their decision.',
    cta: 'See what you get →',
    href: '/for/students',
    accentClass: 'text-teal',
  },
  {
    hub: 'FOOD SECURITY HUB',
    role: 'Buyers',
    desc: 'Purchase produce from farmers with visible transaction history, verified identity, and public Trust Score.',
    cta: 'See how it works →',
    href: '/for/buyers',
    accentClass: 'text-copper',
  },
] as const;

const AUDIENCE_ROW_2 = [
  {
    hub: 'EDUCATION HUB',
    role: 'Employers',
    desc: "Read student portfolios that include the reviewer's name, credentials, and decision rationale.",
    cta: 'See how to verify →',
    href: '/for/employers',
    accentClass: 'text-teal',
  },
  {
    hub: 'EDUCATION HUB',
    role: 'Lecturers',
    desc: 'Review student project submissions. Your name, credentials, and decision are recorded permanently.',
    cta: 'Apply as lecturer →',
    href: '/for/lecturers',
    accentClass: 'text-teal',
  },
  {
    hub: 'BOTH HUBS',
    role: 'NGOs & Government',
    desc: 'Mandate alignment and impact metrics with full methodology disclosure and auditable evidence chains.',
    cta: 'See impact data →',
    href: '/for/ngos',
    accentClass: 'text-violet',
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

export default function HomePage() {
  return (
    <>
      {/* ── S1: Hero ── */}
      <section className="bg-[#131619] px-[120px] py-[128px] flex flex-col gap-6 items-center">
        <AnimateIn>
          <p className="font-ibm-mono text-[0.6875rem] font-600 text-[#56A8A2] tracking-[0.08em] uppercase text-center">
            East Africa&apos;s Verification Infrastructure
          </p>
        </AnimateIn>
        <AnimateIn delay={0.08}>
          <h1 className="font-jakarta font-800 text-[4.5rem] leading-[1.05] tracking-[-0.03em] text-[#F2F0EC] max-w-[1080px] text-center">
            Verified Farmers.<br />
            Verified Talent.<br />
            East African Trust Infrastructure.
          </h1>
        </AnimateIn>
        <AnimateIn delay={0.16}>
          <p className="font-jakarta font-400 text-[1.125rem] text-[#A9A29A] leading-[1.6] max-w-[760px] text-center">
            The verification layer connecting smallholder farmers, agricultural graduates,
            and trusted buyers across East Africa.
          </p>
        </AnimateIn>
        <AnimateIn delay={0.24}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/for/farmers"
              className="inline-flex items-center px-[28px] py-[16px] bg-copper text-[#F5F4F0] font-jakarta font-600 text-[1rem] rounded-[4px] hover:bg-[#A05A30] active:scale-[0.98] transition-all duration-fast ease-standard"
            >
              Food Security Hub →
            </Link>
            <Link
              href="/education"
              className="inline-flex items-center px-[28px] py-[16px] border border-[#39414A] text-[#D6D1CB] font-jakarta font-600 text-[1rem] rounded-[4px] hover:border-[#49515A] transition-all duration-standard ease-standard"
            >
              Education Hub →
            </Link>
          </div>
        </AnimateIn>
        <AnimateIn delay={0.32}>
          <p className="font-jakarta font-500 text-[0.8125rem] text-[#636C76] tracking-[0.01em] text-center">
            Verification methodology published · Open appeals process · Named administrators
          </p>
        </AnimateIn>
      </section>

      {/* ── S2: Two Structural Failures ── */}
      <section className="bg-canvas-base px-[120px] py-[96px] flex flex-col gap-[56px]">
        <AnimateIn>
          <div className="flex flex-col gap-3">
            <p className="font-jakarta font-600 text-[0.6875rem] text-copper uppercase tracking-[0.06em]">
              Why Verification
            </p>
            <h2 className="font-jakarta font-600 text-[2.25rem] text-ws-text-heading tracking-[-0.02em] leading-[1.15]">
              Two industries.<br />
              One structural failure.
            </h2>
          </div>
        </AnimateIn>

        <div className="flex gap-8">
          <AnimateIn className="flex-1">
            <div className="p-[40px] bg-ws-surface-primary border border-ws-border-soft rounded-[2px] h-full flex flex-col gap-5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-copper shrink-0" />
                <p className="font-jakarta font-600 text-[0.6875rem] text-copper tracking-[0.04em] uppercase">
                  Food Security Hub
                </p>
              </div>
              <h3 className="font-jakarta font-600 text-[1.375rem] text-ws-text-heading tracking-[-0.01em] leading-[1.3]">
                The Farmer Problem
              </h3>
              <p className="font-jakarta font-400 text-[1rem] text-ws-text-body leading-[1.6]">
                Farmers sell through brokers who know the end-market price. The farmer does not.
                There is no mechanism to compare offers, signal reliability to buyers they have
                never met, or receive payment without physical presence. This is not individual
                bad actors — it is a structural information asymmetry.
              </p>
            </div>
          </AnimateIn>
          <AnimateIn delay={0.08} className="flex-1">
            <div className="p-[40px] bg-ws-surface-primary border border-ws-border-soft rounded-[2px] h-full flex flex-col gap-5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
                <p className="font-jakarta font-600 text-[0.6875rem] text-teal tracking-[0.04em] uppercase">
                  Education Hub
                </p>
              </div>
              <h3 className="font-jakarta font-600 text-[1.375rem] text-ws-text-heading tracking-[-0.01em] leading-[1.3]">
                The Student Problem
              </h3>
              <p className="font-jakarta font-400 text-[1rem] text-ws-text-body leading-[1.6]">
                CS graduates leave with degrees that certify attendance, GitHub repos that are
                self-reported, and CVs that describe claims no one can verify. Employers have seen
                AI-generated portfolios and inflated credentials. This is not student dishonesty —
                it is the absence of a trustworthy verification mechanism.
              </p>
            </div>
          </AnimateIn>
        </div>

        <AnimateIn>
          <p className="font-jakarta font-500 text-[1.125rem] text-ws-text-secondary leading-[1.6] tracking-[-0.005em] text-center w-[800px] mx-auto">
            Both problems share the same root: the absence of a mechanism to establish trust
            between strangers before a consequential transaction.
          </p>
        </AnimateIn>
      </section>

      {/* ── S3: Verification Philosophy ── */}
      <section className="bg-canvas-elevated px-[120px] py-[96px] flex flex-col gap-[48px] items-center">
        <AnimateIn className="text-center flex flex-col gap-3 items-center">
          <p className="font-jakarta font-600 text-[0.6875rem] text-teal uppercase tracking-[0.06em]">
            The Verification Philosophy
          </p>
          <h2 className="font-jakarta font-600 text-[2.25rem] text-ws-text-heading tracking-[-0.02em] leading-[1.15]">
            One infrastructure.<br />
            Two hubs.
          </h2>
          <p className="font-jakarta font-400 text-[1rem] text-ws-text-secondary leading-[1.6] max-w-[680px]">
            Nothing claimed on UmojaHub is unverified. Farmer identity, land documentation,
            produce listings — and student projects, reviewer credentials, portfolio entries —
            all pass through the same verification spine.
          </p>
        </AnimateIn>

        {/* D01 — Verification Spine Diagram */}
        <D01DiagramLazy />

        {/* 3 Principles */}
        <div className="flex gap-6 w-full">
          {PRINCIPLES.map((p, i) => (
            <AnimateIn key={p.label} delay={i * 0.08} className="flex-1">
              <div className="bg-[#E5E1DA] border border-[#C8C2BA] rounded-[2px] p-[28px] h-full flex flex-col gap-2.5">
                <p className="font-jakarta font-600 text-[0.8125rem] text-teal tracking-[0.01em] uppercase">
                  {p.label}
                </p>
                <p className="font-jakarta font-400 text-[0.9375rem] text-ws-text-body leading-[1.55]">
                  {p.desc}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ── S4: Verification in Practice ── */}
      <section className="bg-canvas-base px-[120px] py-[96px] flex flex-col gap-[48px]">
        <AnimateIn>
          <p className="font-jakarta font-600 text-[0.6875rem] text-copper uppercase tracking-[0.06em]">
            How It Works
          </p>
        </AnimateIn>
        <AnimateIn>
          <h2 className="font-jakarta font-600 text-[2.25rem] text-ws-text-heading tracking-[-0.02em] leading-[1.15]">
            Verification in practice.
          </h2>
        </AnimateIn>

        <div className="flex gap-8">
          {/* Farmer flow */}
          <AnimateIn className="flex-1">
            <div className="p-[40px] bg-ws-surface-primary border border-ws-border-soft rounded-[2px] h-full flex flex-col">
              <p className="font-jakarta font-600 text-[0.6875rem] text-copper uppercase tracking-[0.04em]">
                Food Security Hub
              </p>
              <div className="h-5" />
              {FARMER_FLOW.map((step, idx) => (
                <div key={step.n}>
                  <div className="flex gap-4 items-start">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-copper flex items-center justify-center">
                      <span className="font-jakarta font-600 text-[0.75rem] text-[#F5F4F0]">
                        {step.n}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1">
                      <p className="font-jakarta font-600 text-[0.875rem] text-ws-text-heading">
                        {step.title}
                      </p>
                      <p className="font-jakarta font-400 text-[0.8125rem] text-ws-text-secondary leading-[1.55]">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                  {idx < FARMER_FLOW.length - 1 && <div className="h-6" />}
                </div>
              ))}
            </div>
          </AnimateIn>

          {/* Student flow */}
          <AnimateIn delay={0.08} className="flex-1">
            <div className="p-[40px] bg-[#E5ECE8] border border-ws-border-soft rounded-[2px] h-full flex flex-col">
              <p className="font-jakarta font-600 text-[0.6875rem] text-teal uppercase tracking-[0.04em]">
                Education Hub
              </p>
              <div className="h-5" />
              {STUDENT_FLOW.map((step, idx) => (
                <div key={step.n}>
                  <div className="flex gap-4 items-start">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-teal flex items-center justify-center">
                      <span className="font-jakarta font-600 text-[0.75rem] text-[#F5F4F0]">
                        {step.n}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1">
                      <p className="font-jakarta font-600 text-[0.875rem] text-ws-text-heading">
                        {step.title}
                      </p>
                      <p className="font-jakarta font-400 text-[0.8125rem] text-ws-text-secondary leading-[1.55]">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                  {idx < STUDENT_FLOW.length - 1 && <div className="h-6" />}
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── S5: StoryWorld — The Commons (V2) behind dev flag, Witness (V1) default ── */}
      {STORYWORLD_V2 ? <StoryWorldV2Section /> : <StoryWorldSection />}

      {/* ── S6: Audience Routing ── */}
      <section className="bg-canvas-base px-[120px] py-[96px] flex flex-col gap-[48px]">
        <AnimateIn>
          <p className="font-jakarta font-600 text-[0.6875rem] text-violet uppercase tracking-[0.06em]">
            For Your Role
          </p>
        </AnimateIn>
        <AnimateIn>
          <h2 className="font-jakarta font-600 text-[2.25rem] text-ws-text-heading tracking-[-0.02em] leading-[1.15]">
            Who are you here for?
          </h2>
        </AnimateIn>

        {/* Row 1 */}
        <div className="flex gap-6">
          {AUDIENCE_ROW_1.map((card, i) => (
            <AnimateIn key={card.role} delay={i * 0.08} className="flex-1">
              <Link
                href={card.href}
                className="group flex flex-col gap-3 p-[32px] bg-ws-surface-primary border border-ws-border-soft rounded-[2px] h-full hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-standard ease-standard"
              >
                <p className={`font-jakarta font-600 text-[0.625rem] uppercase tracking-[0.04em] ${card.accentClass}`}>
                  {card.hub}
                </p>
                <p className="font-jakarta font-600 text-[1.25rem] text-ws-text-heading tracking-[-0.01em]">
                  {card.role}
                </p>
                <p className="font-jakarta font-400 text-[0.875rem] text-ws-text-secondary leading-[1.55]">
                  {card.desc}
                </p>
                <div className="h-2" />
                <p className={`font-jakarta font-600 text-[0.8125rem] ${card.accentClass}`}>
                  {card.cta}
                </p>
              </Link>
            </AnimateIn>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex gap-6">
          {AUDIENCE_ROW_2.map((card, i) => (
            <AnimateIn key={card.role} delay={i * 0.08} className="flex-1">
              <Link
                href={card.href}
                className="group flex flex-col gap-3 p-[32px] bg-ws-surface-primary border border-ws-border-soft rounded-[2px] h-full hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-standard ease-standard"
              >
                <p className={`font-jakarta font-600 text-[0.625rem] uppercase tracking-[0.04em] ${card.accentClass}`}>
                  {card.hub}
                </p>
                <p className="font-jakarta font-600 text-[1.25rem] text-ws-text-heading tracking-[-0.01em]">
                  {card.role}
                </p>
                <p className="font-jakarta font-400 text-[0.875rem] text-ws-text-secondary leading-[1.55]">
                  {card.desc}
                </p>
                <div className="h-2" />
                <p className={`font-jakarta font-600 text-[0.8125rem] ${card.accentClass}`}>
                  {card.cta}
                </p>
              </Link>
            </AnimateIn>
          ))}
        </div>
      </section>
    </>
  );
}
