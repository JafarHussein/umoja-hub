import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trust & Verification — UmojaHub',
  description:
    'The complete UmojaHub verification methodology. How farmers and students are verified, how Trust Scores are calculated, and how appeals work.',
};

const TRUST_COMPONENTS = [
  {
    index: '01',
    title: 'Verification Status',
    desc: 'Whether the farmer has passed identity verification.',
    changes: 'Administrator APPROVED decision (one-time).',
  },
  {
    index: '02',
    title: 'Transaction Volume',
    desc: 'Count of completed, fulfilled orders.',
    changes: 'Each RECEIVED order. Cancellations before fulfillment do not count.',
  },
  {
    index: '03',
    title: 'Buyer Ratings',
    desc: 'Average rating from post-transaction buyer feedback.',
    changes: 'Each submitted buyer rating recalculates this component.',
  },
  {
    index: '04',
    title: 'Order Reliability',
    desc: 'Ratio of fulfilled orders to total orders over a rolling window.',
    changes: 'Each dispatch confirmation and each non-dispatch within expected window.',
  },
] as const;

const TRUST_TIERS = [
  { name: 'NEW', desc: 'Recently verified, few or no completed transactions. Listing is possible at any tier.' },
  { name: 'ESTABLISHED', desc: 'Verified with a documented transaction history.' },
  { name: 'TRUSTED', desc: 'Verified with strong history of positive ratings and consistent fulfillment.' },
  {
    name: 'PREMIUM',
    desc: 'Highest tier. Deep transaction history and consistently high ratings. Highest listing visibility.',
  },
] as const;

const FARMER_ASSESSMENT = [
  { title: 'Consistency', desc: 'Do the documents reference each other coherently?' },
  { title: 'Plausibility', desc: 'Does the documentation represent a real person with documented land access?' },
  { title: 'Completeness', desc: 'Are all required documents present?' },
] as const;

const FARMER_DOES_NOT_ASSESS = ['Farm quality', 'Produce quality', 'Business viability', 'Farming experience'] as const;

const EDU_DIMENSIONS = [
  {
    code: 'D1  1—5',
    title: 'Clarity of problem understanding',
    desc: 'Does the student demonstrate they understand what they were asked to solve?',
  },
  {
    code: 'D2  1—5',
    title: 'Methodology appropriateness',
    desc: 'Is the chosen approach logical given the constraints of the brief?',
  },
  {
    code: 'D3  1—5',
    title: 'Documentation quality',
    desc: 'Are the three documents clear, structured, and specific?',
  },
  {
    code: 'D4  1—5',
    title: 'Reflection depth',
    desc: 'Does the Final Reflection demonstrate honest self-assessment of what worked and what failed?',
  },
] as const;

const FARMER_APPEALS = [
  'Rejection: resubmit with corrected or additional documentation. No fee. No limit on resubmissions.',
  'Dispute with a decision after approval: contact the verification team within 30 days.',
  'Escalation: named administrators handle escalated appeals. Contact details at /team.',
] as const;

const STUDENT_APPEALS = [
  'REVISION_REQUIRED: revise and resubmit within the window specified in the feedback. The feedback is specific and actionable.',
  'Conflict of interest claim: process available for claiming a reviewer had a conflict not caught by the system.',
  'Link to /team for named administrator accountability and contact.',
] as const;

const ANYONE_APPEALS = [
  'Named administrators are identified at /team — not anonymous roles.',
  'All decisions are recorded with the administrator’s identifier.',
  'Platform status and operational metrics are published at /transparency.',
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const FIELD_LABEL = 'font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle';

function SectionHeader({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-ibm-mono text-sm text-brand">{n}</span>
      <span className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-muted">
        {label}
      </span>
    </div>
  );
}

const APPEAL_COLUMNS = [
  { title: 'For Farmers', accent: true, items: FARMER_APPEALS },
  { title: 'For Students', accent: true, items: STUDENT_APPEALS },
  { title: 'For Anyone', accent: false, items: ANYONE_APPEALS },
] as const;

export default function TrustPage() {
  return (
    <>
      {/* Section/Hero */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-5 py-24`}>
          <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand-text">
            Trust &amp; Verification
          </p>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
            Complete methodology.
            <br />
            Published. Auditable.
            <br />
            No omissions.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-fg-muted">
            This page documents exactly how trust is created, measured, and reported on UmojaHub.
            Farmers, students, employers, and researchers can verify every claim made elsewhere on
            this platform against this document.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            {[
              { href: '#trust-score', label: 'Trust Score →' },
              { href: '#farmer-verification', label: 'Farmer Verification →' },
              { href: '#education-verification', label: 'Education Verification →' },
              { href: '#appeals', label: 'Appeals →' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-brand-text transition-opacity hover:opacity-80"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Section/TrustScore */}
      <section id="trust-score" className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <SectionHeader n="01" label="Trust Score — Food Security Hub" />
          <div className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            <p>Four components.</p>
            <p>Built from real transactions.</p>
          </div>

          {/* 4 component cards */}
          <div className="flex w-full flex-col gap-5 md:flex-row">
            {TRUST_COMPONENTS.map((c) => (
              <div
                key={c.index}
                className="flex flex-1 flex-col gap-3 rounded-sm border border-border bg-surface p-7"
              >
                <span className="font-ibm-mono text-xs text-brand">{c.index}</span>
                <p className="text-sm font-semibold leading-snug text-fg">{c.title}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{c.desc}</p>
                <div className="h-px bg-border" />
                <p className={FIELD_LABEL}>Changes via</p>
                <p className="text-sm leading-relaxed text-fg-muted">{c.changes}</p>
              </div>
            ))}
          </div>

          {/* Trust Tiers */}
          <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle">
            Trust Tiers
          </p>
          <div className="flex w-full flex-col gap-4 md:flex-row">
            {TRUST_TIERS.map((tier) => (
              <div
                key={tier.name}
                className="flex flex-1 flex-col gap-3 rounded-sm border border-border bg-surface p-7"
              >
                <div className="inline-flex self-start rounded-full border border-border-strong px-2.5 py-1">
                  <span className="font-ibm-mono text-xs tracking-wide text-fg-muted">{tier.name}</span>
                </div>
                <p className="text-sm leading-relaxed text-fg-muted">{tier.desc}</p>
              </div>
            ))}
          </div>

          {/* Limitations block */}
          <div className="flex flex-col gap-3 rounded-sm border border-warning/30 bg-warning/10 p-7">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-warning">
              What the Trust Score Cannot Do
            </p>
            <p className="leading-relaxed text-fg-muted">
              The Trust Score cannot detect sophisticated document fraud at the verification stage. It
              cannot prevent a bad actor willing to build score through real transactions before
              executing a fraudulent order. It creates accountability over time — not guaranteed
              performance on any single transaction.
            </p>
          </div>
        </div>
      </section>

      {/* Section/FarmerVerification */}
      <section id="farmer-verification" className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <SectionHeader n="02" label="Farmer Verification Methodology" />
          <div className="text-3xl font-semibold leading-tight tracking-tight text-fg">
            <p>What the administrator reviews.</p>
            <p>What they do not.</p>
          </div>

          <div className="flex w-full flex-col gap-8 md:flex-row">
            {/* Left: assessment criteria */}
            <div className="flex flex-1 flex-col gap-5 rounded-sm border border-border bg-surface p-9">
              <p className="text-sm font-semibold text-fg">What the administrator assesses</p>
              {FARMER_ASSESSMENT.map((item) => (
                <div key={item.title} className="flex flex-col gap-1 rounded-sm bg-surface-sunken px-4 py-3.5">
                  <p className="text-sm font-semibold text-fg">{item.title}</p>
                  <p className="text-sm text-fg-muted">{item.desc}</p>
                </div>
              ))}
              <p className={FIELD_LABEL}>Does not assess</p>
              {FARMER_DOES_NOT_ASSESS.map((item) => (
                <p key={item} className="text-sm text-fg-subtle">
                  — {item}
                </p>
              ))}
            </div>

            {/* Right: decision criteria */}
            <div className="flex flex-1 flex-col gap-6 rounded-sm border border-border bg-surface p-9">
              <p className="text-sm font-semibold text-fg">Decision criteria</p>

              <div className="flex flex-col gap-2.5 rounded-sm bg-success/10 p-5">
                <p className="font-ibm-mono text-xs uppercase tracking-wide text-success">Approved</p>
                <p className="text-sm leading-relaxed text-fg-muted">
                  Documents are consistent, plausible, and complete.
                </p>
                <p className={FIELD_LABEL}>Does not guarantee</p>
                <p className="text-sm leading-relaxed text-fg-muted">
                  That land is exactly as described. That produce quality will match listings. That
                  orders will be fulfilled.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 rounded-sm bg-warning/10 p-5">
                <p className="font-ibm-mono text-xs uppercase tracking-wide text-warning">Rejected</p>
                <p className="text-sm leading-relaxed text-fg-muted">
                  Documents are incomplete, inconsistent, or do not represent a plausible land
                  connection. Rejection reasons are specific and correctable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section/EducationVerification */}
      <section id="education-verification" className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <SectionHeader n="03" label="Education Hub Verification Methodology" />
          <div className="text-3xl font-semibold leading-tight tracking-tight text-fg">
            <p>Four rubric dimensions.</p>
            <p>One cryptographic anchor.</p>
          </div>

          {/* 4 dimension cards */}
          <div className="flex w-full flex-col gap-5 md:flex-row">
            {EDU_DIMENSIONS.map((d) => (
              <div
                key={d.code}
                className="flex flex-1 flex-col gap-2.5 rounded-sm border border-border bg-surface p-7"
              >
                <p className="whitespace-pre font-ibm-mono text-xs text-brand">{d.code}</p>
                <p className="text-sm font-semibold leading-snug text-fg">{d.title}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{d.desc}</p>
              </div>
            ))}
          </div>

          {/* SHA-256 + Peer Score Locking */}
          <div className="flex w-full flex-col gap-6 md:flex-row">
            <div className="flex flex-1 flex-col gap-3 rounded-sm border border-border bg-surface p-7">
              <p className="font-ibm-mono text-xs uppercase tracking-wide text-brand">
                SHA-256 Document Hash
              </p>
              <p className="text-sm leading-relaxed text-fg-muted">
                At submission, the platform creates a SHA-256 hash of the combined document content
                and records it in the audit log with a timestamp and submission ID. The hash is the
                authenticity anchor for the portfolio entry. Any alteration of the documents after
                this point causes the hash to fail.
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-3 rounded-sm border border-border bg-surface p-7">
              <p className="font-ibm-mono text-xs uppercase tracking-wide text-brand">
                Peer Score Locking
              </p>
              <p className="text-sm leading-relaxed text-fg-muted">
                Peer scores are recorded and locked before the submission enters the lecturer queue.
                Lecturers make their assessment independently before seeing the peer score. This
                prevents the peer score from anchoring the lecturer&apos;s judgment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section/AppealsRecourse */}
      <section id="appeals" className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <SectionHeader n="04" label="Appeals and Recourse" />
          <div className="text-3xl font-semibold leading-tight tracking-tight text-fg">
            <p>Every decision is reviewable.</p>
            <p>Every outcome is correctable.</p>
          </div>

          <div className="flex w-full flex-col gap-6 md:flex-row">
            {APPEAL_COLUMNS.map((col) => (
              <div
                key={col.title}
                className="flex flex-1 flex-col gap-4 rounded-sm border border-border bg-surface p-8"
              >
                <p className={`text-sm font-semibold ${col.accent ? 'text-brand-text' : 'text-fg-subtle'}`}>
                  {col.title}
                </p>
                {col.items.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <span
                      className={`mt-2 h-1 w-1 shrink-0 rounded-full ${col.accent ? 'bg-brand-text' : 'bg-fg-subtle'}`}
                    />
                    <p className="flex-1 text-sm leading-relaxed text-fg-muted">{item}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
