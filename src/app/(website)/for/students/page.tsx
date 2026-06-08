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
    bg: '#162219',
    badgeBorder: '#56A8A2',
    badgeText: '#56A8A2',
    body: "The submission meets the standard. Your portfolio updates immediately. The entry is permanent. The lecturer's name, affiliation, and the verification date are recorded.",
  },
  {
    key: 'REVISION_REQUIRED',
    bg: '#1E1610',
    badgeBorder: '#D88A5A',
    badgeText: '#D88A5A',
    body: 'The lecturer writes substantive commentary (minimum 50 words) explaining what must be improved. You may revise and resubmit. Both the original and the revision are preserved.',
  },
  {
    key: 'DENIED',
    bg: '#1B1410',
    badgeBorder: '#878078',
    badgeText: '#878078',
    body: 'The submission does not meet the standard and revision cannot remedy it. It does not appear in your portfolio. You may start a new project. The decision and reasoning are recorded.',
  },
] as const;

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

export default function ForStudentsPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-[#131619] px-[120px] py-[96px] flex flex-col gap-5 items-start">
        <AnimateIn>
          <div className="flex items-center gap-2 font-jakarta font-500 text-[0.8125rem]">
            <span className="text-[#636C76]">Education Hub</span>
            <span className="text-[#39414A]">/</span>
            <span className="text-[#2E7D78]">For Students</span>
          </div>
        </AnimateIn>
        <AnimateIn delay={0.06}>
          <p className="font-jakarta font-600 text-[0.6875rem] text-[#2E7D78] tracking-[0.06em] uppercase">
            For Students
          </p>
        </AnimateIn>
        <AnimateIn delay={0.12}>
          <h1 className="font-jakarta font-800 text-[3.75rem] leading-[1.05] tracking-[-0.03em] text-[#F2F0EC] max-w-[900px]">
            Your work, verified.<br />
            By a named reviewer.<br />
            Permanently on record.
          </h1>
        </AnimateIn>
        <AnimateIn delay={0.18}>
          <p className="font-jakarta font-400 text-[1.125rem] text-[#A9A29A] leading-[1.6] max-w-[700px]">
            Portfolio Verified is a permanent record that a credentialed lecturer assessed your
            project documents against a published rubric and made a documented decision. Not a
            self-report. Not a checkbox.
          </p>
        </AnimateIn>
        <AnimateIn delay={0.24}>
          <div className="flex items-center gap-3 bg-[#1B2025] border border-[#2A3138] rounded-[2px] px-4 py-3">
            <span className="font-ibm-mono text-[0.6875rem] text-[#56A8A2] tracking-[0.01em]">SHA-256</span>
            <span className="font-ibm-mono text-[0.6875rem] text-[#636C76]">a3f8c2d1...e9b4071f</span>
            <span className="font-jakarta font-400 text-[0.6875rem] text-[#39414A]">
              Documents hashed at submission. Cannot be altered after review.
            </span>
          </div>
        </AnimateIn>
        <AnimateIn delay={0.30}>
          <Link
            href="/auth/register?role=STUDENT"
            className="inline-flex items-center px-[28px] py-[16px] bg-[#2E7D78] text-[#F5F4F0] font-jakarta font-600 text-[1rem] rounded-[4px] hover:bg-[#265F5B] active:scale-[0.98] transition-all duration-fast ease-standard"
          >
            Register as a Student →
          </Link>
        </AnimateIn>
      </section>

      {/* ── What Portfolio Verified Is ── */}
      <section className="bg-canvas-base px-[120px] py-[96px] flex flex-col gap-[48px]">
        <AnimateIn>
          <p className="font-jakarta font-600 text-[0.6875rem] text-teal uppercase tracking-[0.06em]">
            What Portfolio Verified Is
          </p>
        </AnimateIn>
        <AnimateIn>
          <h2 className="font-jakarta font-600 text-[2.25rem] text-ws-text-heading tracking-[-0.02em] leading-[1.15]">
            Specific. Documented.<br />
            Not another self-reported credential.
          </h2>
        </AnimateIn>

        <div className="flex gap-8">
          {/* What it IS */}
          <AnimateIn className="flex-1">
            <div className="bg-[#E5ECE8] border border-[#7FA9A4] rounded-[2px] p-[40px] h-full flex flex-col gap-5">
              <p className="font-jakarta font-600 text-[0.875rem] text-teal tracking-[0.02em] uppercase">
                What it is
              </p>
              {WHAT_IT_IS.map((item) => (
                <div key={item} className="flex gap-3 items-start">
                  <span className="shrink-0 mt-[0.55rem] w-1.5 h-1.5 rounded-full bg-teal" />
                  <p className="font-jakarta font-400 text-[0.9375rem] text-ws-text-body leading-[1.55]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </AnimateIn>

          {/* What it IS NOT */}
          <AnimateIn delay={0.08} className="flex-1">
            <div className="bg-[#E9E2DF] border border-[#C8A895] rounded-[2px] p-[40px] h-full flex flex-col gap-4">
              <p className="font-jakarta font-600 text-[0.875rem] text-[#7A5342] tracking-[0.02em] uppercase">
                What it is not
              </p>
              {WHAT_IT_IS_NOT.map((item) => (
                <div key={item} className="flex gap-3 items-start">
                  <span className="font-jakarta font-500 text-[0.875rem] text-copper shrink-0">—</span>
                  <p className="font-jakarta font-400 text-[0.875rem] text-[#7A5342] leading-[1.5]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── The Process ── */}
      <section className="bg-canvas-elevated px-[120px] py-[96px] flex flex-col gap-[48px]">
        <AnimateIn>
          <p className="font-jakarta font-600 text-[0.6875rem] text-teal uppercase tracking-[0.06em]">
            The Process
          </p>
        </AnimateIn>
        <AnimateIn>
          <h2 className="font-jakarta font-600 text-[2.25rem] text-ws-text-heading tracking-[-0.02em] leading-[1.15]">
            Three documents.<br />
            One defined brief.<br />
            One human reviewer.
          </h2>
        </AnimateIn>

        {/* Brief type cards */}
        <div className="flex gap-6">
          {BRIEF_TYPES.map((type, i) => (
            <AnimateIn key={type.tag} delay={i * 0.08} className="flex-1">
              <div className="bg-ws-surface-primary border border-ws-border-default rounded-[2px] p-[28px] flex flex-col gap-3 h-full">
                <div className="inline-flex">
                  <span className="font-ibm-mono text-[0.6875rem] text-[#F5F4F0] tracking-[0.01em] bg-teal px-[10px] py-[4px] rounded-full">
                    {type.tag}
                  </span>
                </div>
                <p className="font-jakarta font-400 text-[0.9375rem] text-ws-text-body leading-[1.55]">
                  {type.body}
                </p>
                <p className="font-ibm-mono text-[0.75rem] text-ws-text-meta leading-[1.5]">
                  {type.note}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>

        <AnimateIn>
          <p className="font-jakarta font-600 text-[0.875rem] text-ws-text-secondary tracking-[0.01em] uppercase">
            Three Required Documents
          </p>
        </AnimateIn>

        {/* Document cards */}
        <div className="flex gap-6">
          {THREE_DOCS.map((doc, i) => (
            <AnimateIn key={doc.n} delay={i * 0.08} className="flex-1">
              <div className="bg-ws-surface-primary border border-ws-border-default rounded-[2px] p-[32px] flex flex-col gap-3.5 h-full">
                <p className="font-ibm-mono text-[0.6875rem] text-teal">{doc.n}</p>
                <p className="font-jakarta font-600 text-[1rem] text-ws-text-heading leading-[1.25]">
                  {doc.title}
                </p>
                <p className="font-jakarta font-500 text-[0.875rem] text-ws-text-body leading-[1.5]">
                  {doc.sub}
                </p>
                <p className="font-jakarta font-400 text-[0.8125rem] text-ws-text-secondary leading-[1.55]">
                  {doc.body}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>

        {/* On submission bar */}
        <AnimateIn>
          <div className="bg-[#E3E6E8] rounded-[2px] px-5 py-4 flex gap-3 items-center w-full">
            <span className="font-ibm-mono text-[0.6875rem] text-[#56A8A2] tracking-[0.02em] shrink-0">
              ON SUBMISSION
            </span>
            <p className="font-jakarta font-400 text-[0.875rem] text-ws-text-body leading-[1.5] flex-1">
              The platform creates a SHA-256 cryptographic hash of your documents and records it in
              the audit log with a timestamp. From this point, the documents cannot be altered
              without the hash failing.
            </p>
          </div>
        </AnimateIn>
      </section>

      {/* ── The Review Process ── */}
      <section className="bg-[#131619] px-[120px] py-[96px] flex flex-col gap-[48px]">
        <AnimateIn>
          <p className="font-jakarta font-600 text-[0.6875rem] text-[#56A8A2] uppercase tracking-[0.06em]">
            The Review Process
          </p>
        </AnimateIn>
        <AnimateIn>
          <h2 className="font-jakarta font-600 text-[2.25rem] text-[#F2F0EC] tracking-[-0.02em] leading-[1.15]">
            Two stages.<br />
            One final human decision.
          </h2>
        </AnimateIn>

        {/* Stage 1 */}
        <AnimateIn>
          <div className="bg-[#1B2025] border border-[#2A3138] rounded-[2px] p-[40px] flex flex-col gap-5 w-full">
            <p className="font-ibm-mono text-[0.6875rem] text-[#56A8A2] tracking-[0.02em] uppercase">
              Stage 1 — Peer Review
            </p>
            <p className="font-jakarta font-400 text-[1rem] text-[#D6D1CB] leading-[1.6]">
              Another student on the platform receives your documents and reviews them against the
              four-dimension rubric. They score each dimension (1–5) and write commentary. Their
              score is recorded and locked before your submission enters the lecturer queue.
            </p>
            <div className="flex gap-6">
              {PEER_REVIEW_NOTES.map((note) => (
                <div key={note} className="flex-1 bg-[#21272D] rounded-[2px] p-5">
                  <p className="font-jakarta font-400 text-[0.8125rem] text-[#A9A29A] leading-[1.55]">
                    {note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </AnimateIn>

        {/* Stage 2 outcomes */}
        <div className="flex gap-6">
          {OUTCOMES.map((outcome, i) => (
            <AnimateIn key={outcome.key} delay={i * 0.08} className="flex-1">
              <div
                className="border border-[#2A3138] rounded-[2px] p-[32px] flex flex-col gap-3.5 h-full"
                style={{ backgroundColor: outcome.bg }}
              >
                <p className="font-ibm-mono text-[0.625rem] text-[#49515A] tracking-[0.02em] uppercase">
                  Stage 2 — Lecturer Decision
                </p>
                <div className="inline-flex">
                  <span
                    className="font-ibm-mono text-[0.6875rem] tracking-[0.02em] px-[10px] py-[4px] rounded-full border"
                    style={{ color: outcome.badgeText, borderColor: outcome.badgeBorder }}
                  >
                    {outcome.key}
                  </span>
                </div>
                <p className="font-jakarta font-400 text-[0.875rem] text-[#A9A29A] leading-[1.55]">
                  {outcome.body}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ── What an Employer Sees ── */}
      <section className="bg-canvas-base px-[120px] py-[96px] flex flex-col gap-[40px]">
        <AnimateIn>
          <p className="font-jakarta font-600 text-[0.6875rem] text-teal uppercase tracking-[0.06em]">
            What an Employer Sees
          </p>
        </AnimateIn>
        <AnimateIn>
          <h2 className="font-jakarta font-600 text-[2.25rem] text-ws-text-heading tracking-[-0.02em] leading-[1.15]">
            A portfolio entry anyone<br />
            can read and verify.
          </h2>
        </AnimateIn>

        {/* Portfolio entry mock */}
        <AnimateIn>
          <div className="bg-ws-surface-primary border border-ws-border-soft rounded-[2px] p-[40px] flex flex-col gap-6 w-full">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="font-jakarta font-600 text-[1.125rem] text-ws-text-heading">
                  Crop yield prediction using rainfall data
                </p>
                <p className="font-jakarta font-400 text-[0.8125rem] text-ws-text-secondary">
                  AI_BRIEF · Agriculture track · Submitted 2026-05-14
                </p>
              </div>
              <div className="bg-[#E5ECE8] border border-[#7FA9A4] rounded-full px-3 py-1.5">
                <span className="font-ibm-mono text-[0.6875rem] text-teal tracking-[0.02em]">● VERIFIED</span>
              </div>
            </div>

            {/* Data row */}
            <div className="flex">
              {[
                { label: 'REVIEWER', value: 'Dr. A. Kamau, Lecturer\nUniversity of Nairobi — Computer Science', mono: false },
                { label: 'PEER SCORE', value: '3.8 / 5.0 (aggregated)', mono: false },
                { label: 'VERIFICATION DATE', value: '2026-05-21', mono: false },
                { label: 'DOCUMENT HASH', value: 'a3f8c2d1...e9b4071f', mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex-1 bg-[#E5E1DA] border border-ws-border-soft px-5 py-4 flex flex-col gap-1">
                  <p className="font-jakarta font-600 text-[0.6875rem] text-ws-text-meta tracking-[0.02em] uppercase">
                    {label}
                  </p>
                  {mono ? (
                    <p className="font-ibm-mono text-[0.75rem] text-ws-text-body leading-[1.45]">{value}</p>
                  ) : (
                    <p className="font-jakarta font-400 text-[0.875rem] text-ws-text-body leading-[1.45] whitespace-pre-line">{value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </AnimateIn>

        <AnimateIn>
          <p className="font-jakarta font-400 text-[0.875rem] text-ws-text-secondary leading-[1.55]">
            An employer reading your Final Reflection document gets a direct window into how you
            approach problems, how you assess failure, and whether your professional thinking is
            disciplined. All three documents are publicly readable — no registration required.
          </p>
        </AnimateIn>
      </section>

      {/* ── Protections & Timeline ── */}
      <section className="bg-canvas-elevated px-[120px] py-[80px] flex gap-8">
        {/* Conflict of Interest */}
        <AnimateIn className="flex-1">
          <div className="bg-ws-surface-primary border border-ws-border-soft rounded-[2px] p-[40px] flex flex-col gap-5 h-full">
            <p className="font-jakarta font-600 text-[0.6875rem] text-ws-text-secondary uppercase tracking-[0.04em]">
              Conflict of Interest Protections
            </p>
            {CONFLICT_PROTECTIONS.map((item) => (
              <div key={item} className="flex gap-3 items-start">
                <span className="font-jakarta font-600 text-[0.875rem] text-teal shrink-0">✓</span>
                <p className="font-jakarta font-400 text-[0.875rem] text-ws-text-body leading-[1.55]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </AnimateIn>

        {/* Realistic Timeline */}
        <AnimateIn delay={0.08} className="flex-1">
          <div className="bg-ws-surface-primary border border-ws-border-soft rounded-[2px] p-[40px] flex flex-col gap-5 h-full">
            <p className="font-jakarta font-600 text-[0.6875rem] text-ws-text-secondary uppercase tracking-[0.04em]">
              Realistic Timeline
            </p>
            {TIMELINE_ROWS.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <p className="font-jakarta font-400 text-[0.875rem] text-ws-text-body">{label}</p>
                <p className="font-ibm-mono text-[0.8125rem] text-teal">{value}</p>
              </div>
            ))}
          </div>
        </AnimateIn>
      </section>

      {/* ── Honest Limits ── */}
      <section className="bg-[#E3E6E8] px-[120px] py-[64px] flex flex-col gap-6">
        <AnimateIn>
          <p className="font-jakarta font-600 text-[0.6875rem] text-ws-text-secondary uppercase tracking-[0.04em]">
            What Portfolio Verified Does Not Cover
          </p>
        </AnimateIn>
        {HONEST_LIMITS.map((item) => (
          <AnimateIn key={item}>
            <div className="flex gap-3 items-start">
              <span className="font-jakarta font-500 text-[0.875rem] text-ws-text-meta shrink-0">—</span>
              <p className="font-jakarta font-400 text-[0.875rem] text-ws-text-secondary leading-[1.55]">
                {item}
              </p>
            </div>
          </AnimateIn>
        ))}
      </section>

      {/* ── CTA ── */}
      <section className="bg-teal px-[120px] py-[80px] flex flex-col gap-6 items-center">
        <AnimateIn>
          <h2 className="font-jakarta font-600 text-[2.25rem] text-[#F5F4F0] text-center tracking-[-0.02em] leading-[1.15]">
            Ready to build your verified portfolio?
          </h2>
        </AnimateIn>
        <AnimateIn delay={0.08}>
          <p className="font-jakarta font-400 text-[1rem] text-[#E5ECE8] text-center leading-[1.55] max-w-[560px]">
            Registration is free. Participation is independent of your university enrollment. Your
            first submission can begin immediately.
          </p>
        </AnimateIn>
        <AnimateIn delay={0.16}>
          <Link
            href="/auth/register?role=STUDENT"
            className="inline-flex items-center px-[28px] py-[16px] bg-ws-text-heading text-[#F5F4F0] font-jakarta font-600 text-[1rem] rounded-[4px] hover:opacity-90 active:scale-[0.98] transition-all duration-fast ease-standard"
          >
            Register as a Student →
          </Link>
        </AnimateIn>
      </section>
    </>
  );
}
