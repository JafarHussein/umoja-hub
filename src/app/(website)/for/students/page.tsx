import type { Metadata } from 'next';
import Link from 'next/link';
import { MediaFrame } from '@/components/website/MediaFrame';

export const metadata: Metadata = {
  title: 'For Students: Education Hub · UmojaHub',
  description:
    'Build a verifiable CS portfolio. Every project is cryptographically hashed and reviewed by a verified lecturer. Employers can check it without an account.',
};

const WHAT_IT_IS = [
  'A permanent record showing a named, credentials-confirmed reviewer assessed your project work against a published rubric.',
  "The reviewer's name, title, and institutional affiliation appear in your portfolio entry.",
  'The documents you submitted are publicly readable by anyone, including employers.',
  'A cryptographic hash confirms the documents were not altered after review.',
] as const;

const WHAT_IT_IS_NOT = [
  'A guarantee of employment',
  'A salary signal',
  'An employment readiness certification',
  'An institutional grade or transcript item',
  'An accredited academic credential',
  'Affiliated with your university. Participation is independent of enrollment.',
] as const;

const BRIEF_TYPES = [
  {
    tag: 'AI brief',
    body: 'The platform generates a project brief from a real agricultural industry context.',
    note: 'The brief is fixed. You cannot modify its scope or requirements.',
  },
  {
    tag: 'Open source',
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
    body: 'Shows planning discipline, the ability to think before executing. Reviewers look for logical sequencing and realistic scoping.',
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
  'Peers who review poorly are tracked. Their review quality has consequences.',
  'Reviewing others develops your own submission quality.',
] as const;

const OUTCOMES = [
  {
    key: 'Verified',
    tone: 'success',
    body: "The submission meets the standard. Your portfolio updates immediately. The entry is permanent. The lecturer's name, affiliation, and the verification date are recorded.",
  },
  {
    key: 'Revision required',
    tone: 'warning',
    body: 'The lecturer writes substantive commentary (minimum 50 words) explaining what must be improved. You may revise and resubmit. Both the original and the revision are preserved.',
  },
  {
    key: 'Denied',
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
  'Peer review scores are locked before the lecturer sees the submission. The lecturer cannot retroactively influence the peer score.',
] as const;

const TIMELINE_ROWS = [
  { label: 'Document production', value: '1 to 4 weeks' },
  { label: 'Peer review', value: 'typically within 72 hours' },
  { label: 'Lecturer review', value: '72-hour SLA' },
  { label: 'Total for verified entry', value: '2 to 6 weeks' },
] as const;

const HONEST_LIMITS = [
  'The platform verifies your process, not that you wrote every line of code yourself. Employers who want code attribution should examine your commit history independently.',
  'The platform does not track what happens after verification: employment, salary, or career trajectory.',
  'Verified status does not expire, but it reflects your work at the time of submission. It does not update to reflect skills gained later.',
] as const;

const PORTFOLIO_FIELDS = [
  { label: 'REVIEWER', value: 'Dr. A. Kamau, Lecturer\nUniversity of Nairobi, Computer Science', mono: false },
  { label: 'PEER SCORE', value: '3.8 / 5.0 (aggregated)', mono: false },
  { label: 'VERIFICATION DATE', value: '2026-05-21', mono: false },
  { label: 'DOCUMENT HASH', value: 'a3f8c2d1...e9b4071f', mono: true },
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const H2 = 'text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl';

export default function ForStudentsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid items-center gap-12 pt-24 pb-20 md:pb-28 lg:grid-cols-12`}>
          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              For students
            </p>
            <h1 className="text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
              Your work, verified.
              <br />
              Permanently on record.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
              A permanent record that a credentialed lecturer assessed your project documents against
              a published rubric and made a documented decision. Not a self-report. Not a checkbox.
            </p>
            <div className="flex flex-wrap items-center gap-3 self-start rounded-sm border border-border bg-surface-sunken px-4 py-3">
              <span className="font-ibm-mono text-xs text-brand">SHA-256</span>
              <span className="font-ibm-mono text-xs text-fg-muted">a3f8c2d1...e9b4071f</span>
              <span className="text-xs text-fg-subtle">Hashed at submission. Cannot be altered after review.</span>
            </div>
            <Link
              href="/auth/register?role=STUDENT"
              className="inline-flex items-center justify-center self-start rounded-sm bg-brand px-7 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover active:scale-95"
            >
              Register as a Student
            </Link>
          </div>
          <div className="lg:col-span-5">
            <MediaFrame
              alt="A computer science student working on a project"
              label="Student at work"
              aspect="aspect-[4/5]"
              priority
            />
          </div>
        </div>
      </section>

      {/* What it is */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <h2 className={H2}>Specific and documented, not another self-reported credential.</h2>
          <div className="flex flex-col gap-8 md:flex-row">
            <div className="flex flex-1 flex-col gap-5 rounded border border-border bg-surface p-10">
              <p className="text-sm font-semibold text-brand">What it is</p>
              {WHAT_IT_IS.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <p className="text-sm leading-relaxed text-fg-muted">{item}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-4 rounded border border-border bg-surface p-10">
              <p className="text-sm font-semibold text-fg-subtle">What it is not</p>
              {WHAT_IT_IS_NOT.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="shrink-0 text-sm font-medium text-fg-subtle">/</span>
                  <p className="text-sm leading-relaxed text-fg-muted">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The process */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <h2 className={H2}>Three documents. One defined brief. One human reviewer.</h2>

          <div className="flex flex-col gap-6 md:flex-row">
            {BRIEF_TYPES.map((type) => (
              <div key={type.tag} className="flex flex-1 flex-col gap-3 rounded border border-border bg-surface p-7">
                <p className="text-sm font-semibold text-brand">{type.tag}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{type.body}</p>
                <p className="font-ibm-mono text-xs leading-relaxed text-fg-subtle">{type.note}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border md:grid-cols-3">
            {THREE_DOCS.map((doc) => (
              <div key={doc.n} className="flex flex-col gap-3.5 bg-surface p-8">
                <p className="font-ibm-mono text-xs text-brand">{doc.n}</p>
                <p className="font-semibold leading-snug text-fg">{doc.title}</p>
                <p className="text-sm font-medium leading-snug text-fg">{doc.sub}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{doc.body}</p>
              </div>
            ))}
          </div>

          <div className="flex w-full items-center gap-3 rounded-sm border border-border bg-surface-sunken px-5 py-4">
            <span className="shrink-0 font-ibm-mono text-xs uppercase tracking-wide text-brand">On submission</span>
            <p className="flex-1 text-sm leading-relaxed text-fg-muted">
              The platform creates a SHA-256 hash of your documents and records it in the audit log
              with a timestamp. From this point, the documents cannot be altered without the hash
              failing.
            </p>
          </div>
        </div>
      </section>

      {/* The review process */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <h2 className={H2}>Two stages. One final human decision.</h2>

          <div className="flex w-full flex-col gap-5 rounded border border-border bg-surface p-10">
            <p className="text-sm font-semibold text-brand">Stage one: peer review</p>
            <p className="leading-relaxed text-fg-muted">
              Another student on the platform receives your documents and reviews them against the
              four-dimension rubric. They score each dimension (1 to 5) and write commentary. Their
              score is recorded and locked before your submission enters the lecturer queue.
            </p>
            <div className="flex flex-col gap-4 md:flex-row">
              {PEER_REVIEW_NOTES.map((note) => (
                <div key={note} className="flex-1 rounded-sm bg-surface-sunken p-5">
                  <p className="text-sm leading-relaxed text-fg-muted">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border md:grid-cols-3">
            {OUTCOMES.map((outcome) => (
              <div key={outcome.key} className="flex flex-col gap-3.5 bg-surface p-8">
                <p className="text-sm font-semibold text-fg">Stage two: lecturer decision</p>
                <div className="inline-flex self-start">
                  <span className={`rounded-full border px-2.5 py-1 font-ibm-mono text-xs tracking-wide ${OUTCOME_BADGE[outcome.tone]}`}>
                    {outcome.key}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-fg-muted">{outcome.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What an employer sees */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>A portfolio entry anyone can read and verify.</h2>

          <div className="flex w-full flex-col gap-6 rounded border border-border bg-surface p-10">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold text-fg">Crop yield prediction using rainfall data</p>
                <p className="text-sm text-fg-muted">AI brief · Agriculture track · Submitted 2026-05-14</p>
              </div>
              <div className="rounded-full border border-success/40 bg-success/10 px-3 py-1.5">
                <span className="font-ibm-mono text-xs tracking-wide text-success">Verified</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {PORTFOLIO_FIELDS.map(({ label, value, mono }) => (
                <div key={label} className="flex flex-col gap-1 bg-surface-sunken px-5 py-4">
                  <p className="font-ibm-mono text-xs uppercase tracking-wide text-fg-subtle">{label}</p>
                  {mono ? (
                    <p className="font-ibm-mono text-xs leading-snug text-fg-muted">{value}</p>
                  ) : (
                    <p className="whitespace-pre-line text-sm leading-snug text-fg">{value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="max-w-3xl text-sm leading-relaxed text-fg-muted">
            An employer reading your Final Reflection document gets a direct window into how you
            approach problems, how you assess failure, and whether your professional thinking is
            disciplined. All three documents are publicly readable, no registration required.
          </p>
        </div>
      </section>

      {/* Protections and timeline */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-8 py-24 md:flex-row`}>
          <div className="flex flex-1 flex-col gap-5 rounded border border-border bg-surface p-10">
            <p className="text-sm font-semibold text-fg">Conflict of interest protections</p>
            {CONFLICT_PROTECTIONS.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="shrink-0 font-semibold text-brand">+</span>
                <p className="text-sm leading-relaxed text-fg-muted">{item}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-5 rounded border border-border bg-surface p-10">
            <p className="text-sm font-semibold text-fg">Realistic timeline</p>
            {TIMELINE_ROWS.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                <p className="text-sm text-fg">{label}</p>
                <p className="font-ibm-mono text-sm text-brand">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Honest limits */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-6 py-20`}>
          <h2 className={H2}>What verification does not cover.</h2>
          {HONEST_LIMITS.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="shrink-0 text-sm font-medium text-fg-subtle">/</span>
              <p className="max-w-3xl text-sm leading-relaxed text-fg-muted">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col items-center gap-6 py-24 text-center`}>
          <h2 className={H2}>Ready to build your verified portfolio?</h2>
          <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
            Registration is free. Participation is independent of your university enrollment. Your
            first submission can begin immediately.
          </p>
          <Link
            href="/auth/register?role=STUDENT"
            className="inline-flex items-center justify-center rounded-sm bg-brand px-7 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover active:scale-95"
          >
            Register as a Student
          </Link>
        </div>
      </section>
    </>
  );
}
