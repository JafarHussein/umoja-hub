import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';

export const metadata: Metadata = {
  title: 'For Students — Education Hub · UmojaHub',
  description:
    'Build a verifiable CS portfolio. Every project is cryptographically hashed and reviewed by a verified lecturer — employers can check it without an account.',
};

const WHAT_IT_IS = [
  'A permanent record showing a named, credentials-confirmed reviewer assessed your project work against a published rubric.',
  "The reviewer's name, title, and institutional affiliation appear in your portfolio entry.",
  'The documents you submitted are publicly readable by anyone — including employers.',
  'A cryptographic hash confirms the documents were not altered after review.',
] as const;

const WHAT_IT_IS_NOT = [
  'A guarantee of employment',
  'A salary signal',
  'An employment readiness certification',
  'An institutional grade or transcript item',
  'An accredited academic credential',
  'Affiliated with your university — participation is independent of enrollment',
] as const;

const BRIEF_TYPES = [
  {
    tag: 'AI_BRIEF',
    body: 'The platform generates a project brief from a real agricultural industry context.',
    note: 'The brief is fixed — you cannot modify its scope or requirements.',
  },
  {
    tag: 'OPEN_SOURCE',
    body: 'You bring a real open-source project and work from its actual codebase.',
    note: "The brief is derived from the project's real issues and context.",
  },
] as const;

const THREE_DOCS = [
  {
    n: '01',
    title: 'Problem Breakdown',
    sub: 'Your analysis of the problem stated in the brief.',
    body: 'Shows whether you understand the domain and can decompose a complex problem. Reviewers look for depth, clarity, and domain awareness.',
  },
  {
    n: '02',
    title: 'Approach Plan',
    sub: 'How you structured the work before beginning.',
    body: 'Shows planning discipline — the ability to think before executing. Reviewers look for logical sequencing and realistic scoping.',
  },
  {
    n: '03',
    title: 'Final Reflection',
    sub: 'What you built, what failed, what you would do differently, and what you learned.',
    body: 'The most significant document. Reveals professional thinking quality. This is the document an employer reads most carefully.',
  },
] as const;

const PEER_REVIEW_NOTES = [
  'Raises the floor of submissions entering the formal queue.',
  'Peers who review poorly are tracked — their review quality has consequences.',
  'Reviewing others develops your own submission quality.',
] as const;

const OUTCOMES = [
  {
    key: 'VERIFIED',
    tone: 'success',
    body: "The submission meets the standard. Your portfolio updates immediately. The entry is permanent. The lecturer's name, affiliation, and the verification date are recorded.",
  },
  {
    key: 'REVISION_REQUIRED',
    tone: 'warning',
    body: 'The lecturer writes substantive commentary (minimum 50 words) explaining what must be improved. You may revise and resubmit. Both the original and the revision are preserved.',
  },
  {
    key: 'DENIED',
    tone: 'neutral',
    body: 'The submission does not meet the standard and revision cannot remedy it. It does not appear in your portfolio. You may start a new project. The decision and reasoning are recorded.',
  },
] as const;

const OUTCOME_BADGE: Record<(typeof OUTCOMES)[number]['tone'], string> = {
  success: 'border-success/40 text-success',
  warning: 'border-warning/40 text-warning',
  neutral: 'border-border-strong text-fg-muted',
};

const CONFLICT_PROTECTIONS = [
  'A lecturer cannot review submissions from students at their own institution.',
  'A lecturer cannot review submissions from students with whom they have a direct teaching relationship.',
  'Peer review scores are locked before the lecturer sees the submission — the lecturer cannot retroactively influence the peer score.',
] as const;

const TIMELINE_ROWS = [
  { label: 'Document production', value: '1–4 weeks' },
  { label: 'Peer review', value: 'typically within 72 hours' },
  { label: 'Lecturer review', value: '72-hour SLA' },
  { label: 'Total for VERIFIED entry', value: '2–6 weeks' },
] as const;

const HONEST_LIMITS = [
  'The platform verifies your process — not that you wrote every line of code yourself. Employers who want code attribution should examine your commit history independently.',
  'The platform does not track what happens after verification — employment, salary, or career trajectory.',
  'VERIFIED status does not expire, but it reflects your work at the time of submission. It does not update to reflect skills gained after submission.',
] as const;

const PORTFOLIO_FIELDS = [
  { label: 'REVIEWER', value: 'Dr. A. Kamau, Lecturer\nUniversity of Nairobi — Computer Science', mono: false },
  { label: 'PEER SCORE', value: '3.8 / 5.0 (aggregated)', mono: false },
  { label: 'VERIFICATION DATE', value: '2026-05-21', mono: false },
  { label: 'DOCUMENT HASH', value: 'a3f8c2d1...e9b4071f', mono: true },
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const EYEBROW = 'font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand';

export default function ForStudentsPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col items-start gap-5 py-24`}>
          <AnimateIn>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-fg-subtle">Education Hub</span>
              <span className="text-fg-subtle">/</span>
              <span className="text-brand-text">For Students</span>
            </div>
          </AnimateIn>
          <AnimateIn delay={0.06}>
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand-text">
              For Students
            </p>
          </AnimateIn>
          <AnimateIn delay={0.12}>
            <h1 className="max-w-4xl text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
              Your work, verified.<br />
              By a named reviewer.<br />
              Permanently on record.
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.18}>
            <p className="max-w-2xl text-lg leading-relaxed text-fg-muted">
              Portfolio Verified is a permanent record that a credentialed lecturer assessed your
              project documents against a published rubric and made a documented decision. Not a
              self-report. Not a checkbox.
            </p>
          </AnimateIn>
          <AnimateIn delay={0.24}>
            <div className="flex flex-wrap items-center gap-3 rounded-sm border border-border bg-surface px-4 py-3">
              <span className="font-ibm-mono text-xs text-brand-text">SHA-256</span>
              <span className="font-ibm-mono text-xs text-fg-muted">a3f8c2d1...e9b4071f</span>
              <span className="text-xs text-fg-subtle">
                Documents hashed at submission. Cannot be altered after review.
              </span>
            </div>
          </AnimateIn>
          <AnimateIn delay={0.3}>
            <Link
              href="/auth/register?role=STUDENT"
              className="inline-flex items-center rounded-sm bg-brand px-7 py-4 font-semibold text-brand-fg transition-all duration-fast ease-standard hover:bg-brand-hover active:scale-95"
            >
              Register as a Student →
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* ── What Portfolio Verified Is ── */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <AnimateIn>
            <p className={EYEBROW}>What Portfolio Verified Is</p>
          </AnimateIn>
          <AnimateIn>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
              Specific. Documented.<br />
              Not another self-reported credential.
            </h2>
          </AnimateIn>

          <div className="flex flex-col gap-8 md:flex-row">
            {/* What it IS */}
            <AnimateIn className="flex-1">
              <div className="flex h-full flex-col gap-5 rounded-sm border border-border bg-surface p-10">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand">What it is</p>
                {WHAT_IT_IS.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <p className="text-sm leading-relaxed text-fg-muted">{item}</p>
                  </div>
                ))}
              </div>
            </AnimateIn>

            {/* What it IS NOT */}
            <AnimateIn delay={0.08} className="flex-1">
              <div className="flex h-full flex-col gap-4 rounded-sm border border-border bg-surface p-10">
                <p className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
                  What it is not
                </p>
                {WHAT_IT_IS_NOT.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="shrink-0 text-sm font-medium text-fg-subtle">—</span>
                    <p className="text-sm leading-relaxed text-fg-muted">{item}</p>
                  </div>
                ))}
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── The Process ── */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <AnimateIn>
            <p className={EYEBROW}>The Process</p>
          </AnimateIn>
          <AnimateIn>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
              Three documents.<br />
              One defined brief.<br />
              One human reviewer.
            </h2>
          </AnimateIn>

          {/* Brief type cards */}
          <div className="flex flex-col gap-6 md:flex-row">
            {BRIEF_TYPES.map((type, i) => (
              <AnimateIn key={type.tag} delay={i * 0.08} className="flex-1">
                <div className="flex h-full flex-col gap-3 rounded-sm border border-border bg-surface p-7">
                  <div className="inline-flex self-start">
                    <span className="rounded-full bg-brand px-2.5 py-1 font-ibm-mono text-xs text-brand-fg">
                      {type.tag}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-fg-muted">{type.body}</p>
                  <p className="font-ibm-mono text-xs leading-relaxed text-fg-subtle">{type.note}</p>
                </div>
              </AnimateIn>
            ))}
          </div>

          <AnimateIn>
            <p className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
              Three Required Documents
            </p>
          </AnimateIn>

          {/* Document cards */}
          <div className="flex flex-col gap-6 md:flex-row">
            {THREE_DOCS.map((doc, i) => (
              <AnimateIn key={doc.n} delay={i * 0.08} className="flex-1">
                <div className="flex h-full flex-col gap-3.5 rounded-sm border border-border bg-surface p-8">
                  <p className="font-ibm-mono text-xs text-brand">{doc.n}</p>
                  <p className="font-semibold leading-snug text-fg">{doc.title}</p>
                  <p className="text-sm font-medium leading-snug text-fg">{doc.sub}</p>
                  <p className="text-sm leading-relaxed text-fg-muted">{doc.body}</p>
                </div>
              </AnimateIn>
            ))}
          </div>

          {/* On submission bar */}
          <AnimateIn>
            <div className="flex w-full items-center gap-3 rounded-sm bg-surface-sunken px-5 py-4">
              <span className="shrink-0 font-ibm-mono text-xs uppercase tracking-wide text-brand">
                ON SUBMISSION
              </span>
              <p className="flex-1 text-sm leading-relaxed text-fg-muted">
                The platform creates a SHA-256 cryptographic hash of your documents and records it in
                the audit log with a timestamp. From this point, the documents cannot be altered
                without the hash failing.
              </p>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── The Review Process ── */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <AnimateIn>
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand-text">
              The Review Process
            </p>
          </AnimateIn>
          <AnimateIn>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
              Two stages.<br />
              One final human decision.
            </h2>
          </AnimateIn>

          {/* Stage 1 */}
          <AnimateIn>
            <div className="flex w-full flex-col gap-5 rounded-sm border border-border bg-surface p-10">
              <p className="font-ibm-mono text-xs uppercase tracking-wide text-brand-text">
                Stage 1 — Peer Review
              </p>
              <p className="leading-relaxed text-fg-muted">
                Another student on the platform receives your documents and reviews them against the
                four-dimension rubric. They score each dimension (1–5) and write commentary. Their
                score is recorded and locked before your submission enters the lecturer queue.
              </p>
              <div className="flex flex-col gap-6 md:flex-row">
                {PEER_REVIEW_NOTES.map((note) => (
                  <div key={note} className="flex-1 rounded-sm bg-surface-raised p-5">
                    <p className="text-sm leading-relaxed text-fg-muted">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>

          {/* Stage 2 outcomes */}
          <div className="flex flex-col gap-6 md:flex-row">
            {OUTCOMES.map((outcome, i) => (
              <AnimateIn key={outcome.key} delay={i * 0.08} className="flex-1">
                <div className="flex h-full flex-col gap-3.5 rounded-sm border border-border bg-surface p-8">
                  <p className="font-ibm-mono text-xs uppercase tracking-wide text-fg-subtle">
                    Stage 2 — Lecturer Decision
                  </p>
                  <div className="inline-flex self-start">
                    <span
                      className={`rounded-full border px-2.5 py-1 font-ibm-mono text-xs tracking-wide ${OUTCOME_BADGE[outcome.tone]}`}
                    >
                      {outcome.key}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-fg-muted">{outcome.body}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── What an Employer Sees ── */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <AnimateIn>
            <p className={EYEBROW}>What an Employer Sees</p>
          </AnimateIn>
          <AnimateIn>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
              A portfolio entry anyone<br />
              can read and verify.
            </h2>
          </AnimateIn>

          {/* Portfolio entry mock */}
          <AnimateIn>
            <div className="flex w-full flex-col gap-6 rounded-sm border border-border bg-surface p-10">
              {/* Header row */}
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-semibold text-fg">
                    Crop yield prediction using rainfall data
                  </p>
                  <p className="text-sm text-fg-muted">
                    AI_BRIEF · Agriculture track · Submitted 2026-05-14
                  </p>
                </div>
                <div className="rounded-full border border-success/40 bg-success/10 px-3 py-1.5">
                  <span className="font-ibm-mono text-xs tracking-wide text-success">● VERIFIED</span>
                </div>
              </div>

              {/* Data row */}
              <div className="flex flex-col sm:flex-row">
                {PORTFOLIO_FIELDS.map(({ label, value, mono }) => (
                  <div
                    key={label}
                    className="flex flex-1 flex-col gap-1 border border-border bg-surface-sunken px-5 py-4"
                  >
                    <p className="font-ibm-mono text-xs uppercase tracking-wide text-fg-subtle">
                      {label}
                    </p>
                    {mono ? (
                      <p className="font-ibm-mono text-xs leading-snug text-fg-muted">{value}</p>
                    ) : (
                      <p className="whitespace-pre-line text-sm leading-snug text-fg">{value}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>

          <AnimateIn>
            <p className="text-sm leading-relaxed text-fg-muted">
              An employer reading your Final Reflection document gets a direct window into how you
              approach problems, how you assess failure, and whether your professional thinking is
              disciplined. All three documents are publicly readable — no registration required.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ── Protections & Timeline ── */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-8 py-20 md:flex-row`}>
          {/* Conflict of Interest */}
          <AnimateIn className="flex-1">
            <div className="flex h-full flex-col gap-5 rounded-sm border border-border bg-surface p-10">
              <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle">
                Conflict of Interest Protections
              </p>
              {CONFLICT_PROTECTIONS.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="shrink-0 font-semibold text-brand">✓</span>
                  <p className="text-sm leading-relaxed text-fg-muted">{item}</p>
                </div>
              ))}
            </div>
          </AnimateIn>

          {/* Realistic Timeline */}
          <AnimateIn delay={0.08} className="flex-1">
            <div className="flex h-full flex-col gap-5 rounded-sm border border-border bg-surface p-10">
              <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle">
                Realistic Timeline
              </p>
              {TIMELINE_ROWS.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <p className="text-sm text-fg">{label}</p>
                  <p className="font-ibm-mono text-sm text-brand">{value}</p>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── Honest Limits ── */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-6 py-16`}>
          <AnimateIn>
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle">
              What Portfolio Verified Does Not Cover
            </p>
          </AnimateIn>
          {HONEST_LIMITS.map((item) => (
            <AnimateIn key={item}>
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-sm font-medium text-fg-subtle">—</span>
                <p className="text-sm leading-relaxed text-fg-muted">{item}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-brand">
        <div className={`${CONTAINER} flex flex-col items-center gap-6 py-20`}>
          <AnimateIn>
            <h2 className="text-center text-3xl font-semibold leading-tight tracking-tight text-brand-fg md:text-4xl">
              Ready to build your verified portfolio?
            </h2>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <p className="max-w-xl text-center leading-relaxed text-brand-fg/85">
              Registration is free. Participation is independent of your university enrollment. Your
              first submission can begin immediately.
            </p>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <Link
              href="/auth/register?role=STUDENT"
              className="inline-flex items-center rounded-sm bg-brand-fg px-7 py-4 font-semibold text-brand transition-all duration-fast ease-standard hover:opacity-90 active:scale-95"
            >
              Register as a Student →
            </Link>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
