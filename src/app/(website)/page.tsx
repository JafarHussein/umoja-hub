import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { PlatformStatusWidget } from '@/components/website/PlatformStatusWidget';
import { HubCard } from '@/components/website/HubCard';
import { CentralStructuralDiagram } from '@/components/website/CentralStructuralDiagram';
import { AdminProfile } from '@/components/website/AdminProfile';
import { WorkflowStep } from '@/components/website/WorkflowStep';
import { LimitationPanel } from '@/components/website/LimitationPanel';
import { getTransparencyData } from '@/lib/transparency';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'UmojaHub — Verification Infrastructure for East Africa',
  description:
    'UmojaHub verifies farmers entering agricultural commerce and CS students entering the technology employment market in East Africa. Verification is performed by qualified administrators, not algorithms.',
};

function formatUpdatedAt(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin === 1) return '1 min ago';
  return `${diffMin} min ago`;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

const FOOD_STEPS = [
  { step: '01', actor: 'Farmer', action: 'Register and submit identity documents', detail: 'National ID or passport uploaded through the platform.' },
  { step: '02', actor: 'Platform', action: 'Documents enter verification queue', detail: 'Submission is timestamped and assigned to an administrator.' },
  { step: '03', actor: 'Administrator', action: 'Reviews documents against published criteria', detail: '1–3 business days. Decision criteria are publicly documented.' },
  { step: '04', actor: 'Platform', action: 'Trust Score is initialised at verified baseline', detail: 'Verification component: 40 points. Farmer receives SMS notification.' },
  { step: '05', actor: 'Farmer', action: 'Lists produce on the marketplace', detail: 'Verified status is visible to all buyers on each listing.' },
  { step: '06', actor: 'Buyer', action: 'Places order and pays via M-Pesa', detail: 'Payment held in escrow until order is confirmed fulfilled.' },
] as const;

const EDUCATION_STEPS = [
  { step: '01', actor: 'Student', action: 'Register and select a project track', detail: 'AI_BRIEF track (structured brief generator) or OPEN_SOURCE track.' },
  { step: '02', actor: 'Student', action: 'Submit three project documents', detail: 'Problem Breakdown, Approach Plan, and Final Reflection.' },
  { step: '03', actor: 'Platform', action: 'Submission enters the lecturer review queue', detail: 'Documents are hashed. Hash recorded in audit log.' },
  { step: '04', actor: 'Lecturer', action: 'Reviews work across four dimensions', detail: 'Technical depth, architectural reasoning, implementation quality, reflection quality.' },
  { step: '05', actor: 'Platform', action: 'Verified portfolio entry created', detail: 'Permanent public record with reviewer identity and decision rationale.' },
] as const;

export default async function HomePage(): Promise<React.ReactElement> {
  const stats = await getTransparencyData().catch(() => ({
    verifiedFarmers: 0,
    counties: 0,
    completedOrders: 0,
    totalTransactionVolumeKES: 0,
    verifiedProjects: 0,
    verifiedLecturers: 0,
    articles: 0,
    pendingVerificationCount: 0,
    lastUpdated: new Date().toISOString(),
  }));

  const updatedAt = formatUpdatedAt(stats.lastUpdated);

  return (
    <>
      {/* ── Section 1: Platform Definition (above fold) ── */}
      <section className="bg-ws-surface-base border-b border-ws-border-light">
        <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">

            {/* Left column */}
            <div className="flex-1 min-w-0">
              <p className="font-geist-mono text-ws-caption text-ws-text-secondary uppercase mb-6">
                Verification Infrastructure · East Africa
              </p>
              <h1 className="font-display text-[32px] leading-[36px] tracking-[-0.03em] font-extrabold text-ws-text-primary mb-4 md:text-[40px] md:leading-[46px] lg:text-[56px] lg:leading-[62px]">
                UmojaHub
              </h1>
              <p className="font-display text-[18px] leading-[26px] font-normal text-ws-text-secondary mb-6 md:text-[22px] md:leading-[30px] lg:text-[28px] lg:leading-[36px]">
                Verified farmers. Verified portfolios. One platform.
              </p>
              <p className="font-geist text-[17px] leading-[26px] text-ws-text-secondary max-w-[520px]">
                UmojaHub verifies the identities and credentials of farmers entering
                agricultural commerce and CS students entering the technology employment
                market in East Africa. Verification is performed by qualified
                administrators, not algorithms.
              </p>
            </div>

            {/* Right column */}
            <div className="lg:w-[360px] shrink-0 flex flex-col gap-4">
              <PlatformStatusWidget
                status="operational"
                queueSize={stats.pendingVerificationCount}
                medianReviewDays={0}
                updatedAt={updatedAt}
              />
              <p className="font-geist text-ws-body-sm text-ws-text-secondary">
                Click a hub below to immediately filter the verification infrastructure
                for your specific workflow.
              </p>
              <div className="flex flex-col gap-2">
                <HubCard
                  hub="food"
                  label="Food Security Hub"
                  name="Food Security Hub"
                  audiences={['Farmers', 'Buyers', 'Suppliers', 'Cooperatives']}
                  href="/for/farmers"
                />
                <HubCard
                  hub="education"
                  label="Education Hub"
                  name="Education Hub"
                  audiences={['Students', 'Lecturers', 'Employers', 'Institutions']}
                  href="/education"
                />
                <HubCard
                  hub="governance"
                  label="Governance & Impact"
                  name="Governance & Impact"
                  audiences={['NGOs', 'Government', 'Researchers', 'Donors']}
                  href="/for/ngos"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: How the Infrastructure Works (dark) ── */}
      <section className="bg-ws-surface-dark border-b border-ws-border-dark">
        <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
          <div className="max-w-[640px] mb-10">
            <p className="font-geist-mono text-ws-caption text-ws-text-faint uppercase mb-4">
              How It Works
            </p>
            <h2 className="font-display text-[24px] leading-[30px] tracking-[-0.02em] font-bold text-ws-text-bright mb-4 md:text-[32px] md:leading-[38px] lg:text-[36px] lg:leading-[42px]">
              One verification engine. Two economic sectors.
            </h2>
            <p className="font-geist text-[17px] leading-[26px] text-ws-text-dim">
              The same verification mechanism that gives a farmer a Trust Score gives a
              CS student a verified portfolio. In both cases: documents are submitted, a
              qualified administrator reviews them against published criteria, and a
              permanent, public record is created. The education and agriculture sectors
              are connected — students work on real agricultural industry projects.
            </p>
          </div>
          <div className="animate-on-scroll">
            <CentralStructuralDiagram />
          </div>
          <div className="mt-8">
            <Link
              href="/trust"
              className="font-geist-mono text-ws-caption text-ws-text-dim hover:text-ws-text-bright transition-colors duration-150"
            >
              Read the full verification methodology →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 3: Food Security Hub (light) ── */}
      <section className="bg-ws-surface-base border-b border-ws-border-light">
        <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
          <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase mb-4">
            Food Security Hub
          </p>
          <h2 className="font-display text-[24px] leading-[30px] tracking-[-0.02em] font-bold text-ws-text-primary mb-10 md:text-[32px] md:leading-[38px] lg:text-[36px] lg:leading-[42px]">
            Verified farmers. Direct commerce. Fair prices.
          </h2>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-8">

            {/* Col 1: Verification process */}
            <div>
              <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
                The process
              </p>
              {FOOD_STEPS.map((s, i) => (
                <WorkflowStep
                  key={s.step}
                  step={s.step}
                  actor={s.actor}
                  action={s.action}
                  detail={s.detail}
                  hub="food"
                  isLast={i === FOOD_STEPS.length - 1}
                />
              ))}
            </div>

            {/* Col 2: Platform numbers */}
            <div>
              <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
                Platform data
              </p>
              <div className="flex flex-col divide-y divide-ws-border-light border border-ws-border-light">
                {[
                  { label: 'Verified farmers', value: formatNumber(stats.verifiedFarmers) },
                  { label: 'Completed transactions', value: formatNumber(stats.completedOrders) },
                  { label: 'Counties active', value: String(stats.counties) },
                ].map(({ label, value }) => (
                  <div key={label} className="px-5 py-5">
                    <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
                      {label}
                    </p>
                    <p className="font-geist-mono text-[36px] leading-[40px] font-semibold text-ws-text-primary tabular-nums">
                      {value}
                    </p>
                  </div>
                ))}
                <div className="px-5 py-3">
                  <p className="font-geist-mono text-ws-caption text-ws-text-tertiary">
                    Updated {updatedAt}
                  </p>
                </div>
              </div>
            </div>

            {/* Col 3: Audience entry points */}
            <div>
              <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
                Who it serves
              </p>
              <div className="flex flex-col gap-2">
                {[
                  {
                    label: 'For Farmers',
                    href: '/for/farmers',
                    desc: 'Identity verification, Trust Score, marketplace access, M-Pesa payments',
                  },
                  {
                    label: 'For Buyers',
                    href: '/for/buyers',
                    desc: 'Browse verified suppliers, place orders, dispute resolution',
                  },
                  {
                    label: 'For Suppliers',
                    href: '/for/suppliers',
                    desc: 'Regulatory credential verification, verified directory listing',
                  },
                  {
                    label: 'For Cooperatives',
                    href: '/for/cooperatives',
                    desc: 'Group formation, bulk ordering, supplier relationships',
                  },
                ].map(({ label, href, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-start justify-between gap-3 border border-ws-border-light p-4 hover:border-ws-hub-green transition-colors duration-150 group"
                  >
                    <div>
                      <p className="font-geist text-ws-label font-medium text-ws-text-primary">
                        {label}
                      </p>
                      <p className="font-geist text-ws-body-sm text-ws-text-secondary mt-0.5">
                        {desc}
                      </p>
                    </div>
                    <span
                      className="font-geist-mono text-ws-caption text-ws-text-tertiary shrink-0 mt-0.5 group-hover:text-ws-hub-green transition-colors duration-150"
                      aria-hidden
                    >
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <LimitationPanel eyebrow="What farmer verification does not confirm">
              Verification confirms that a farmer&apos;s identity documents are valid and on
              record. It does not assess produce quality in advance of an order, guarantee
              fulfillment of any specific delivery, or eliminate the possibility of
              disputes between parties.
            </LimitationPanel>
          </div>
        </div>
      </section>

      {/* ── Section 4: Education Hub (raised surface) ── */}
      <section className="bg-ws-surface-raised border-b border-ws-border-light">
        <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
          <p className="font-geist-mono text-ws-caption text-ws-hub-blue uppercase mb-4">
            Education Hub
          </p>
          <h2 className="font-display text-[24px] leading-[30px] tracking-[-0.02em] font-bold text-ws-text-primary mb-10 md:text-[32px] md:leading-[38px] lg:text-[36px] lg:leading-[42px]">
            Real projects. Expert review. Verified portfolios.
          </h2>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-8">

            {/* Col 1: Verification process */}
            <div>
              <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
                The process
              </p>
              {EDUCATION_STEPS.map((s, i) => (
                <WorkflowStep
                  key={s.step}
                  step={s.step}
                  actor={s.actor}
                  action={s.action}
                  detail={s.detail}
                  hub="education"
                  isLast={i === EDUCATION_STEPS.length - 1}
                />
              ))}
            </div>

            {/* Col 2: Platform numbers */}
            <div>
              <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
                Platform data
              </p>
              <div className="flex flex-col divide-y divide-ws-border-light border border-ws-border-light bg-ws-surface-base">
                {[
                  { label: 'Verified portfolio entries', value: formatNumber(stats.verifiedProjects) },
                  { label: 'Active lecturers', value: formatNumber(stats.verifiedLecturers) },
                  { label: 'Knowledge articles', value: formatNumber(stats.articles) },
                ].map(({ label, value }) => (
                  <div key={label} className="px-5 py-5">
                    <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
                      {label}
                    </p>
                    <p className="font-geist-mono text-[36px] leading-[40px] font-semibold text-ws-text-primary tabular-nums">
                      {value}
                    </p>
                  </div>
                ))}
                <div className="px-5 py-3">
                  <p className="font-geist-mono text-ws-caption text-ws-text-tertiary">
                    Updated {updatedAt}
                  </p>
                </div>
              </div>
            </div>

            {/* Col 3: Audience entry points */}
            <div>
              <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
                Who it serves
              </p>
              <div className="flex flex-col gap-2">
                {[
                  {
                    label: 'For Students',
                    href: '/for/students',
                    desc: 'Real agricultural projects, structured review, verified portfolio',
                  },
                  {
                    label: 'For Lecturers',
                    href: '/for/lecturers',
                    desc: 'Review student work against published criteria, build a verified record',
                  },
                  {
                    label: 'For Employers',
                    href: '/for/employers',
                    desc: 'Read verified portfolios, independently audit student credentials',
                  },
                  {
                    label: 'For Institutions',
                    href: '/for/institutions',
                    desc: 'Faculty participation, student engagement, partnership inquiry',
                  },
                ].map(({ label, href, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-start justify-between gap-3 border border-ws-border-light bg-ws-surface-base p-4 hover:border-ws-hub-blue transition-colors duration-150 group"
                  >
                    <div>
                      <p className="font-geist text-ws-label font-medium text-ws-text-primary">
                        {label}
                      </p>
                      <p className="font-geist text-ws-body-sm text-ws-text-secondary mt-0.5">
                        {desc}
                      </p>
                    </div>
                    <span
                      className="font-geist-mono text-ws-caption text-ws-text-tertiary shrink-0 mt-0.5 group-hover:text-ws-hub-blue transition-colors duration-150"
                      aria-hidden
                    >
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <LimitationPanel eyebrow="What portfolio verification does not confirm">
              Verification confirms that a student&apos;s submitted project was reviewed
              by a qualified lecturer against published criteria. It does not assess
              post-employment performance, guarantee employment outcomes, or validate
              skills not documented in the submitted project.
            </LimitationPanel>
          </div>
        </div>
      </section>

      {/* ── Section 5: Verification Team (dark) ── */}
      <section className="bg-ws-surface-dark border-b border-ws-border-dark">
        <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
          <p className="font-geist-mono text-ws-caption text-ws-text-faint uppercase mb-4">
            Who Performs Verification
          </p>
          <h2 className="font-display text-[24px] leading-[30px] tracking-[-0.02em] font-bold text-ws-text-bright mb-3 md:text-[32px] md:leading-[38px] lg:text-[36px] lg:leading-[42px]">
            Verification is done by people, not algorithms.
          </h2>
          <p className="font-geist text-[17px] leading-[26px] text-ws-text-dim mb-10 max-w-[640px]">
            Every farmer identity document and every student project submission is reviewed
            by a qualified administrator. Here is who reviews them.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AdminProfile
              name="Jafar H."
              title="Verification Administrator"
              background="Platform founder with direct experience in software engineering and East African agricultural commerce. Reviews farmer identity documents and supplier regulatory credentials against the published verification criteria."
              reviewScope="Farmer identity verification, Supplier credentials, Education project review coordination"
              activeSince="January 2025"
              criteriaHref="/trust"
            />
          </div>
          <p className="font-geist text-[15px] leading-[22px] text-ws-text-dim mt-8">
            Our verification criteria are published in full. Every decision references
            them.{' '}
            <Link
              href="/trust"
              className="text-ws-text-bright hover:opacity-80 transition-opacity duration-150"
            >
              Read the criteria →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Section 6: Live Platform Transparency (dark) ── */}
      <section className="bg-ws-surface-dark-2 border-b border-ws-border-dark">
        <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
          <p className="font-geist-mono text-ws-caption text-ws-text-faint uppercase mb-8">
            Platform Activity · Live
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-ws-border-dark border border-ws-border-dark">
            {[
              { label: 'Verified farmers', value: formatNumber(stats.verifiedFarmers) },
              { label: 'Completed transactions', value: formatNumber(stats.completedOrders) },
              { label: 'Portfolio entries', value: formatNumber(stats.verifiedProjects) },
              { label: 'Counties active', value: String(stats.counties) },
            ].map(({ label, value }) => (
              <div key={label} className="px-6 py-6">
                <p
                  className="font-geist-mono text-[40px] leading-[44px] font-semibold text-ws-text-bright tabular-nums mb-2 md:text-[48px] md:leading-[52px]"
                  aria-label={`${value} ${label}`}
                >
                  {value}
                </p>
                <p className="font-geist-mono text-ws-caption text-ws-text-faint uppercase">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <p className="font-geist-mono text-ws-caption text-ws-text-faint mt-4 mb-6">
            Updated {updatedAt}
          </p>
          <Link
            href="/transparency"
            className="font-geist-mono text-ws-caption text-ws-text-dim hover:text-ws-text-bright transition-colors duration-150"
          >
            View complete transparency data →
          </Link>
        </div>
      </section>

      {/* ── Section 7: Governance & Impact (light) ── */}
      <section className="bg-ws-surface-base">
        <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
            Governance & Impact
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <h2 className="font-display text-[24px] leading-[30px] tracking-[-0.02em] font-bold text-ws-text-primary mb-4 lg:text-[28px] lg:leading-[34px]">
                Transparency for institutions. Data for decision-makers.
              </h2>
              <p className="font-geist text-[17px] leading-[26px] text-ws-text-secondary">
                UmojaHub provides NGOs, government bodies, and researchers with live
                platform metrics, verification methodology documentation, and geographic
                activity data. Every number on this platform is auditable against its
                source query.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                {
                  label: 'For NGOs & Government',
                  href: '/for/ngos',
                  desc: 'Platform mission, impact metrics, geographic coverage, partnership inquiry',
                },
                {
                  label: 'Trust & Verification',
                  href: '/trust',
                  desc: 'Full verification methodology, published criteria, appeals process',
                },
                {
                  label: 'Transparency Dashboard',
                  href: '/transparency',
                  desc: 'Live operational metrics, verification queue, activity data',
                },
                {
                  label: 'How It Works',
                  href: '/how-it-works',
                  desc: 'Complete technical reference for all platform mechanisms',
                },
              ].map(({ label, href, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-start justify-between gap-3 border border-ws-border-light p-4 hover:border-ws-border-medium transition-colors duration-150 group"
                >
                  <div>
                    <p className="font-geist text-ws-label font-medium text-ws-text-primary">
                      {label}
                    </p>
                    <p className="font-geist text-ws-body-sm text-ws-text-secondary mt-0.5">
                      {desc}
                    </p>
                  </div>
                  <span
                    className="font-geist-mono text-ws-caption text-ws-text-tertiary shrink-0 mt-0.5 group-hover:text-ws-text-secondary transition-colors duration-150"
                    aria-hidden
                  >
                    →
                  </span>
                </Link>
              ))}
              <Link
                href="/for/ngos"
                className="font-geist-mono text-ws-caption text-ws-text-tertiary hover:text-ws-text-secondary transition-colors duration-150 mt-2"
              >
                Partnership and impact inquiries →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
