import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'For Lecturers — Education Hub · UmojaHub',
  description:
    'Review CS student project submissions and issue verified assessments. Your institutional credentials anchor the verification chain.',
};

const CONSTRAINTS = [
  'You cannot review submissions from students at your own institution, or from students with whom you have a verifiable direct teaching relationship.',
  'Your decisions carry your name and credentials — they are public in every portfolio entry you contribute to.',
  'Your effectiveness metrics are tracked: score consistency with peer reviewers, decision patterns over time.',
  'A one-word decision with no commentary does not meet the standard — it will be returned for resubmission.',
] as const;

const STEPS = [
  {
    n: '1',
    title: 'Submit your credentials',
    body: 'Provide your academic credentials and institutional affiliation to a platform administrator. This is a one-time submission.',
  },
  {
    n: '2',
    title: 'Administrator review',
    body: 'A platform administrator confirms your institutional affiliation and academic standing. This is a human review — not an automated check.',
  },
  {
    n: '3',
    title: 'Begin reviewing on your verified tracks',
    body: 'Once approved, you can review submissions on the project tracks you are verified for. Your name and credentials appear on every portfolio entry you contribute to.',
  },
] as const;

const INVOLVEMENT_ROWS = [
  {
    label: 'Time commitment per review',
    paras: [
      'One review requires: reading three documents (Problem Breakdown, Approach Plan, Final Reflection), reviewing the peer score and commentary, completing a four-dimension rubric assessment with substantive written commentary — minimum 50 words of specific assessment, not summary.',
      'Expect 45–90 minutes per review.',
    ],
  },
  {
    label: 'What you decide',
    paras: [
      'VERIFIED, REVISION_REQUIRED, or DENIED.',
      'Each decision requires written commentary explaining the specific reasons. A one-word decision with no commentary does not meet the standard — it will be returned for resubmission.',
    ],
  },
  {
    label: 'What you can review',
    paras: [
      'Only submissions on tracks where you are verified. You cannot review submissions from students at your own institution or from students with whom you have a verifiable direct teaching relationship. Conflict of interest prevention is structural — not optional.',
    ],
  },
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const SECTION_LABEL = 'font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle';

export default function ForLecturersPage() {
  return (
    <>
      {/* Hero */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-7 py-24`}>
          <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand-text">
            For Lecturers
          </p>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
            Review.
            <br />
            Your name on every decision.
          </h1>
          <p className="max-w-3xl text-xl leading-relaxed text-fg-muted">
            Verified lecturers are the trust mechanism for the Education Hub. A VERIFIED decision from
            a named, credentials-confirmed reviewer carries weight with employers. Without you, the
            verification chain breaks.
          </p>
        </div>
      </section>

      {/* S1 — What participation involves */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <p className={SECTION_LABEL}>Section 01</p>
          <p className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            What participation involves
          </p>

          {INVOLVEMENT_ROWS.map((row) => (
            <div
              key={row.label}
              className="flex w-full flex-col gap-6 border-b border-border py-8 md:flex-row md:gap-10"
            >
              <p className="w-full shrink-0 text-xl font-semibold leading-snug text-fg md:w-80">
                {row.label}
              </p>
              <div className="flex flex-1 flex-col gap-4">
                {row.paras.map((para) => (
                  <p key={para} className="text-base leading-relaxed text-fg-muted">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* S2 — How lecturer verification works */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <p className={SECTION_LABEL}>Section 02</p>
          <p className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            How lecturer verification works
          </p>

          {STEPS.map((step) => (
            <div key={step.n} className="flex w-full items-start gap-8 border-b border-border py-7">
              <div className="flex shrink-0 items-center rounded-sm bg-surface-raised px-3.5 py-2">
                <span className="font-semibold text-brand-text">{step.n}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                <p className="text-lg font-semibold leading-snug text-fg">{step.title}</p>
                <p className="leading-relaxed text-fg-muted">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* S3 — What constraints apply */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-8 py-24`}>
          <p className={SECTION_LABEL}>Section 03</p>
          <p className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            What constraints apply
          </p>

          {CONSTRAINTS.map((text) => (
            <div key={text} className="w-full border-l-2 border-brand bg-surface px-7 py-6">
              <p className="text-base leading-relaxed text-fg-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* S4 — Why + CTA */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <p className={SECTION_LABEL}>Section 04</p>
          <p className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            Why participation matters
          </p>
          <div className="flex max-w-4xl flex-col gap-4">
            <p className="text-lg leading-relaxed text-fg-muted">
              The Education Hub&#39;s credibility depends on reviewer quality. A VERIFIED decision from a
              credentialed reviewer at a recognized institution carries weight with employers. A
              VERIFIED decision from an anonymous reviewer carries none.
            </p>
            <p className="text-lg leading-relaxed text-fg-muted">
              Your participation is the trust mechanism. Without named, credentials-confirmed
              reviewers, the verification chain breaks. The platform&#39;s value proposition rests on your
              name being attached to your decisions.
            </p>
          </div>
          <Link
            href="/auth/register?role=lecturer"
            className="inline-flex items-center self-start rounded-sm bg-brand px-10 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
          >
            Register as a Lecturer
          </Link>
          <p className="font-ibm-mono text-sm text-fg-subtle">/auth/register?role=lecturer</p>
        </div>
      </section>
    </>
  );
}
