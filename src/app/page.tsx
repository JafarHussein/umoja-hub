import React from 'react';
import Link from 'next/link';
import { connectDB } from '@/lib/db';
import PlatformImpactSummary from '@/lib/models/PlatformImpactSummary.model';

// ISR: revalidate every hour
export const revalidate = 3600;

interface IFoodMetrics {
  verifiedFarmerCount: number;
  activeBuyerCount: number;
  completedOrderCount: number;
  totalTransactionVolumeKES: number;
  countiesRepresented: number;
}

interface IEducationMetrics {
  registeredStudentCount: number;
  verifiedProjectCount: number;
  skillsIssuedCount: number;
  universitiesRepresented: number;
}

interface IMetric {
  label: string;
  value: string;
}

async function getImpactMetrics(): Promise<{ food: IFoodMetrics; education: IEducationMetrics } | null> {
  try {
    await connectDB();
    const summary = await PlatformImpactSummary.findOne({}).sort({ computedAt: -1 }).lean();
    if (!summary) return null;
    return {
      food: summary.food as IFoodMetrics,
      education: summary.education as IEducationMetrics,
    };
  } catch {
    return null;
  }
}

function formatKES(amount: number): string {
  if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(0)}K`;
  return `KES ${amount.toLocaleString('en-KE')}`;
}

function MetricChip({ label, value }: IMetric): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 bg-surface-elevated border border-white/5 rounded">
      <span className="font-mono text-t2 font-semibold text-text-primary">{value}</span>
      <span className="font-body text-t6 text-text-disabled uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default async function LandingPage(): Promise<React.ReactElement> {
  const metrics = await getImpactMetrics();

  const foodMetrics: IMetric[] = metrics
    ? [
        { label: 'Verified farmers', value: metrics.food.verifiedFarmerCount.toLocaleString('en-KE') },
        { label: 'Orders completed', value: metrics.food.completedOrderCount.toLocaleString('en-KE') },
        { label: 'Transaction volume', value: formatKES(metrics.food.totalTransactionVolumeKES) },
        { label: 'Counties', value: String(metrics.food.countiesRepresented) },
      ]
    : [
        { label: 'Verified farmers', value: '—' },
        { label: 'Orders completed', value: '—' },
        { label: 'Transaction volume', value: '—' },
        { label: 'Counties', value: '—' },
      ];

  const educationMetrics: IMetric[] = metrics
    ? [
        { label: 'Registered students', value: metrics.education.registeredStudentCount.toLocaleString('en-KE') },
        { label: 'Verified projects', value: metrics.education.verifiedProjectCount.toLocaleString('en-KE') },
        { label: 'Skills issued', value: metrics.education.skillsIssuedCount.toLocaleString('en-KE') },
        { label: 'Universities', value: String(metrics.education.universitiesRepresented) },
      ]
    : [
        { label: 'Registered students', value: '—' },
        { label: 'Verified projects', value: '—' },
        { label: 'Skills issued', value: '—' },
        { label: 'Universities', value: '—' },
      ];

  return (
    <main className="min-h-screen bg-surface-primary">
      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 h-14 border-b border-white/5 bg-surface-elevated">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-sm bg-accent-green shrink-0" />
          <span className="font-heading text-t4 font-semibold">
            <span className="text-text-primary">Umoja</span>
            <span className="text-accent-green">Hub</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/knowledge"
            className="text-t5 font-body text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Knowledge
          </Link>
          <Link
            href="/marketplace"
            className="text-t5 font-body text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Marketplace
          </Link>
          <Link
            href="/auth/login"
            className="text-t5 font-body text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center min-h-[36px] px-4 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-surface-elevated border border-white/5 rounded-[2px]">
          <div className="h-1.5 w-1.5 rounded-full bg-accent-green" />
          <span className="font-mono text-t6 text-text-secondary uppercase tracking-widest">
            Built for Kenya
          </span>
        </div>

        <h1 className="font-heading text-t1 font-semibold text-text-primary max-w-3xl mx-auto leading-tight">
          Food security infrastructure and verified talent — one platform
        </h1>

        <p className="font-body text-t4 text-text-secondary max-w-xl mx-auto mt-6">
          A verified farmer marketplace with M-Pesa checkout and a hands-on engineering
          experience platform for CS students across Kenya.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
          >
            Browse marketplace
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm border border-white/10 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
          >
            Create account
          </Link>
        </div>
      </section>

      {/* ── Impact metrics ──────────────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-surface-elevated">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest text-center mb-8">
            Platform impact
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {foodMetrics.map((m) => (
              <MetricChip key={m.label} label={m.label} value={m.value} />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {educationMetrics.map((m) => (
              <MetricChip key={m.label} label={m.label} value={m.value} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Food Hub section ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid sm:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
              Food Hub
            </p>
            <h2 className="font-heading text-t2 font-semibold text-text-primary mb-4">
              Verified farmers. Transparent prices. M-Pesa checkout.
            </h2>
            <p className="font-body text-t4 text-text-secondary mb-6">
              Browse produce from verified farmers across Kiambu, Nakuru, Meru, and six other
              counties. Trust scores are computed from verification, transaction history, and
              buyer ratings — not self-reported.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Composite trust score · max 100pts',
                'M-Pesa STK Push with idempotent order protection',
                'Price intelligence from Wakulima, Kongowea, and City Market',
                'Farm Assistant powered by Llama 3 (crop advisory + weather)',
                'Verified Supplier directory (KEBS · PCPB · KEPHIS)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 8L6 12L14 4"
                      stroke="#007F4E"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="font-body text-t5 text-text-secondary">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
            >
              Browse marketplace
            </Link>
          </div>

          {/* Feature card */}
          <div className="bg-surface-elevated border border-white/5 rounded p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-body text-t5 font-medium text-text-primary">Wanjiku Kamau</p>
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="#007F4E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-body text-t6 text-text-secondary">Verified</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-t3 font-semibold text-text-primary">87</span>
              <span className="font-mono text-t5 text-text-secondary">· TRUSTED</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Verification', score: 40, max: 40 },
                { label: 'Transactions', score: 22, max: 25 },
                { label: 'Ratings', score: 17, max: 20 },
                { label: 'Reliability', score: 8, max: 15 },
              ].map(({ label, score, max }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="font-body text-t6 text-text-disabled w-24 shrink-0">
                    {label}
                  </span>
                  <div className="flex-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-green rounded-full"
                      style={{ width: `${(score / max) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-t6 text-text-secondary w-10 text-right">
                    {score}/{max}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-white/5">
              <p className="font-body text-t6 text-text-disabled">
                Kiambu County · maize · beans · potatoes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Education Hub section ────────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-surface-elevated">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            {/* Feature card */}
            <div className="bg-surface-primary border border-white/5 rounded p-6 space-y-4 order-2 sm:order-1">
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
                Skills passport
              </p>
              <div className="space-y-3">
                {[
                  { skill: 'API Integration', tier: 'INTERMEDIATE', project: 'Daraja M-Pesa SDK' },
                  { skill: 'Database Design', tier: 'BEGINNER', project: 'MongoDB Schema' },
                  { skill: 'Process Documentation', tier: 'INTERMEDIATE', project: 'Food Hub' },
                ].map(({ skill, tier, project }) => (
                  <div
                    key={skill}
                    className="flex items-center justify-between bg-surface-secondary border border-white/5 rounded p-3"
                  >
                    <div>
                      <p className="font-body text-t5 font-medium text-text-primary">{skill}</p>
                      <p className="font-body text-t6 text-text-disabled">{project}</p>
                    </div>
                    <span className="font-mono text-t6 text-text-secondary border border-white/10 rounded-[2px] px-2 py-0.5">
                      {tier}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path
                    d="M1.5 6L4.5 9L10.5 3"
                    stroke="#007F4E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-body text-t6 text-text-secondary">
                  Verified by lecturer review · public portfolio URL
                </span>
              </div>
            </div>

            <div className="order-1 sm:order-2">
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
                Education Hub
              </p>
              <h2 className="font-heading text-t2 font-semibold text-text-primary mb-4">
                Real projects. Verified skills. A portfolio that proves it.
              </h2>
              <p className="font-body text-t4 text-text-secondary mb-6">
                CS students across Kenya get AI-generated briefs matched to real Kenyan
                problems, build in public, go through peer review, and receive
                lecturer-verified skill endorsements.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'AI brief generator — 8 Kenyan industry contexts',
                  'AI Mentor (Socratic) — guides without writing code',
                  'Peer review system with conflict-of-interest routing',
                  'Lecturer rubric across 4 dimensions (50-word minimum enforced)',
                  'Public employer portfolio with GitHub evidence',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 8L6 12L14 4"
                        stroke="#007F4E"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="font-body text-t5 text-text-secondary">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
              >
                Start your first project
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Knowledge Hub section ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
            Knowledge Hub
          </p>
          <h2 className="font-heading text-t2 font-semibold text-text-primary mb-3">
            Peer-reviewed agricultural guidance
          </h2>
          <p className="font-body text-t4 text-text-secondary max-w-xl mx-auto">
            Articles sourced and verified by KALRO, KEBS, KEPHIS, PCPB, and FAO Kenya.
            Covering fertilizer verification, seed quality, pest management, and market dynamics.
          </p>
        </div>
        <div className="flex justify-center">
          <Link
            href="/knowledge"
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm border border-white/10 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
          >
            Browse knowledge base
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-surface-elevated">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-sm bg-accent-green shrink-0" />
            <span className="font-heading text-t5 font-semibold">
              <span className="text-text-primary">Umoja</span>
              <span className="text-accent-green">Hub</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/marketplace"
              className="font-body text-t6 text-text-disabled hover:text-text-secondary transition-colors duration-150"
            >
              Marketplace
            </Link>
            <Link
              href="/knowledge"
              className="font-body text-t6 text-text-disabled hover:text-text-secondary transition-colors duration-150"
            >
              Knowledge
            </Link>
            <Link
              href="/auth/login"
              className="font-body text-t6 text-text-disabled hover:text-text-secondary transition-colors duration-150"
            >
              Sign in
            </Link>
          </div>
          <p className="font-mono text-t6 text-text-disabled">
            Kenya · KES · +254
          </p>
        </div>
      </footer>
    </main>
  );
}
