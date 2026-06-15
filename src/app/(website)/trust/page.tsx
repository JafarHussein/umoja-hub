import type { Metadata } from 'next';
import { MediaFrame } from '@/components/website/MediaFrame';

export const metadata: Metadata = {
  title: 'Trust and Verification · UmojaHub',
  description:
    'The complete UmojaHub verification methodology. How farmers and students are verified, how Trust Scores are calculated, and how appeals work.',
};

const TRUST_COMPONENTS = [
  { index: '01', title: 'Verification Status', desc: 'Whether the farmer has passed identity verification.', changes: 'Administrator APPROVED decision (one-time).' },
  { index: '02', title: 'Transaction Volume', desc: 'Count of completed, fulfilled orders.', changes: 'Each RECEIVED order. Cancellations before fulfillment do not count.' },
  { index: '03', title: 'Buyer Ratings', desc: 'Average rating from post-transaction buyer feedback.', changes: 'Each submitted buyer rating recalculates this component.' },
  { index: '04', title: 'Order Reliability', desc: 'Ratio of fulfilled orders to total orders over a rolling window.', changes: 'Each dispatch confirmation and each non-dispatch within the expected window.' },
] as const;

const TRUST_TIERS = [
  { name: 'New', desc: 'Recently verified, few or no completed transactions. Listing is possible at any tier.' },
  { name: 'Established', desc: 'Verified with a documented transaction history.' },
  { name: 'Trusted', desc: 'Verified with a strong history of positive ratings and consistent fulfillment.' },
  { name: 'Premium', desc: 'Highest tier. Deep transaction history and consistently high ratings. Highest listing visibility.' },
] as const;

const FARMER_ASSESSMENT = [
  { title: 'Consistency', desc: 'Do the documents reference each other coherently?' },
  { title: 'Plausibility', desc: 'Does the documentation represent a real person with documented land access?' },
  { title: 'Completeness', desc: 'Are all required documents present?' },
] as const;

const FARMER_DOES_NOT_ASSESS = ['Farm quality', 'Produce quality', 'Business viability', 'Farming experience'] as const;

const EDU_DIMENSIONS = [
  { code: 'D1', range: '1 to 5', title: 'Clarity of problem understanding', desc: 'Does the student demonstrate they understand what they were asked to solve?' },
  { code: 'D2', range: '1 to 5', title: 'Methodology appropriateness', desc: 'Is the chosen approach logical given the constraints of the brief?' },
  { code: 'D3', range: '1 to 5', title: 'Documentation quality', desc: 'Are the three documents clear, structured, and specific?' },
  { code: 'D4', range: '1 to 5', title: 'Reflection depth', desc: 'Does the Final Reflection demonstrate honest self-assessment of what worked and what failed?' },
] as const;

const FARMER_APPEALS = [
  'Rejection: resubmit with corrected or additional documentation. No fee. No limit on resubmissions.',
  'Dispute a decision after approval: contact the verification team within 30 days.',
  'Escalation: named administrators handle escalated appeals. Contact details at /team.',
] as const;

const STUDENT_APPEALS = [
  'Revision required: revise and resubmit within the window specified in the feedback. The feedback is specific and actionable.',
  'Conflict of interest claim: a process is available for claiming a reviewer had a conflict the system did not catch.',
  'See /team for named administrator accountability and contact.',
] as const;

const ANYONE_APPEALS = [
  'Named administrators are identified at /team, not anonymous roles.',
  "All decisions are recorded with the administrator's identifier.",
  'Platform status and operational metrics are published at /transparency.',
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const H2 = 'text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl';
const FIELD = 'font-ibm-mono text-xs font-semibold uppercase tracking-wide text-fg-subtle';

const ANCHORS = [
  { href: '#trust-score', label: 'Trust Score' },
  { href: '#farmer-verification', label: 'Farmer verification' },
  { href: '#education-verification', label: 'Education verification' },
  { href: '#appeals', label: 'Appeals' },
] as const;

const APPEAL_COLUMNS = [
  { title: 'For farmers', items: FARMER_APPEALS },
  { title: 'For students', items: STUDENT_APPEALS },
  { title: 'For anyone', items: ANYONE_APPEALS },
] as const;

export default function TrustPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid items-center gap-12 pt-24 pb-20 md:pb-28 lg:grid-cols-12`}>
          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              Trust and verification
            </p>
            <h1 className="text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
              Complete methodology.
              <br />
              Published and auditable.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
              Exactly how trust is created, measured, and reported on UmojaHub. Verify every claim made
              elsewhere on this platform against this document.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {ANCHORS.map((a) => (
                <a key={a.href} href={a.href} className="text-sm font-semibold text-brand transition-colors hover:text-brand-hover">
                  {a.label}
                </a>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5">
            <MediaFrame
              alt="Verification records and documentation"
              label="Methodology on record"
              aspect="aspect-[4/5]"
              priority
            />
          </div>
        </div>
      </section>

      {/* Trust Score */}
      <section id="trust-score" className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <h2 className={H2}>Trust Score: four components, built from real transactions.</h2>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_COMPONENTS.map((c) => (
              <div key={c.index} className="flex flex-col gap-3 bg-surface p-7">
                <span className="font-ibm-mono text-xs text-brand">{c.index}</span>
                <p className="text-sm font-semibold leading-snug text-fg">{c.title}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{c.desc}</p>
                <div className="h-px bg-border" />
                <p className={FIELD}>Changes via</p>
                <p className="text-sm leading-relaxed text-fg-muted">{c.changes}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_TIERS.map((tier) => (
              <div key={tier.name} className="flex flex-col gap-2.5 bg-surface p-7">
                <p className="text-base font-semibold text-fg">{tier.name}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{tier.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded border border-warning/30 bg-warning/10 p-7">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-wide text-warning">
              What the Trust Score cannot do
            </p>
            <p className="leading-relaxed text-fg-muted">
              The Trust Score cannot detect sophisticated document fraud at the verification stage. It
              cannot prevent a bad actor willing to build score through real transactions before
              executing a fraudulent order. It creates accountability over time, not guaranteed
              performance on any single transaction.
            </p>
          </div>
        </div>
      </section>

      {/* Farmer verification */}
      <section id="farmer-verification" className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>What the administrator reviews, and what they do not.</h2>
          <div className="flex w-full flex-col gap-8 md:flex-row">
            <div className="flex flex-1 flex-col gap-5 rounded border border-border bg-surface p-9">
              <p className="text-sm font-semibold text-fg">What the administrator assesses</p>
              {FARMER_ASSESSMENT.map((item) => (
                <div key={item.title} className="flex flex-col gap-1 rounded-sm bg-surface-sunken px-4 py-3.5">
                  <p className="text-sm font-semibold text-fg">{item.title}</p>
                  <p className="text-sm text-fg-muted">{item.desc}</p>
                </div>
              ))}
              <p className={FIELD}>Does not assess</p>
              {FARMER_DOES_NOT_ASSESS.map((item) => (
                <p key={item} className="text-sm text-fg-subtle">/ {item}</p>
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-6 rounded border border-border bg-surface p-9">
              <p className="text-sm font-semibold text-fg">Decision criteria</p>
              <div className="flex flex-col gap-2.5 rounded-sm bg-success/10 p-5">
                <p className="font-ibm-mono text-xs uppercase tracking-wide text-success">Approved</p>
                <p className="text-sm leading-relaxed text-fg-muted">Documents are consistent, plausible, and complete.</p>
                <p className={FIELD}>Does not guarantee</p>
                <p className="text-sm leading-relaxed text-fg-muted">
                  That land is exactly as described, that produce quality will match listings, or that
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

      {/* Education verification */}
      <section id="education-verification" className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>Four rubric dimensions. One cryptographic anchor.</h2>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {EDU_DIMENSIONS.map((d) => (
              <div key={d.code} className="flex flex-col gap-2.5 bg-surface p-7">
                <p className="font-ibm-mono text-xs text-brand">
                  {d.code} <span className="text-fg-subtle">{d.range}</span>
                </p>
                <p className="text-sm font-semibold leading-snug text-fg">{d.title}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{d.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex w-full flex-col gap-6 md:flex-row">
            <div className="flex flex-1 flex-col gap-3 rounded border border-border bg-surface p-7">
              <p className="font-ibm-mono text-xs uppercase tracking-wide text-brand">SHA-256 document hash</p>
              <p className="text-sm leading-relaxed text-fg-muted">
                At submission, the platform creates a SHA-256 hash of the combined document content and
                records it in the audit log with a timestamp and submission ID. Any alteration of the
                documents after this point causes the hash to fail.
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-3 rounded border border-border bg-surface p-7">
              <p className="font-ibm-mono text-xs uppercase tracking-wide text-brand">Peer score locking</p>
              <p className="text-sm leading-relaxed text-fg-muted">
                Peer scores are recorded and locked before the submission enters the lecturer queue.
                Lecturers make their assessment independently before seeing the peer score, which
                prevents the peer score from anchoring their judgment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Appeals */}
      <section id="appeals" className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>Every decision is reviewable. Every outcome is correctable.</h2>
          <div className="flex w-full flex-col gap-6 md:flex-row">
            {APPEAL_COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-1 flex-col gap-4 rounded border border-border bg-surface p-8">
                <p className="text-base font-semibold text-fg">{col.title}</p>
                {col.items.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" />
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
