import type { Metadata } from 'next';
import Link from 'next/link';
import { MediaFrame } from '@/components/website/MediaFrame';

export const metadata: Metadata = {
  title: 'For Lecturers: Education Hub · UmojaHub',
  description:
    'Review CS student project submissions and issue verified assessments. Your institutional credentials anchor the verification chain.',
};

const CONSTRAINTS = [
  'You cannot review submissions from students at your own institution, or from students with whom you have a verifiable direct teaching relationship.',
  'Your decisions carry your name and credentials. They are public in every portfolio entry you contribute to.',
  'Your effectiveness metrics are tracked: score consistency with peer reviewers, decision patterns over time.',
  'A one-word decision with no commentary does not meet the standard. It will be returned for resubmission.',
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
    body: 'A platform administrator confirms your institutional affiliation and academic standing. This is a human review, not an automated check.',
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
      'One review requires reading three documents (Problem Breakdown, Approach Plan, Final Reflection), reviewing the peer score and commentary, and completing a four-dimension rubric assessment with substantive written commentary, a minimum of 50 words of specific assessment, not summary.',
      'Expect 45 to 90 minutes per review.',
    ],
  },
  {
    label: 'What you decide',
    paras: [
      'Verified, revision required, or denied.',
      'Each decision requires written commentary explaining the specific reasons. A one-word decision with no commentary does not meet the standard. It will be returned for resubmission.',
    ],
  },
  {
    label: 'What you can review',
    paras: [
      'Only submissions on tracks where you are verified. You cannot review submissions from students at your own institution or from students with whom you have a verifiable direct teaching relationship. Conflict of interest prevention is structural, not optional.',
    ],
  },
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const H2 = 'text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl';

export default function ForLecturersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid items-center gap-12 pt-24 pb-20 md:pb-28 lg:grid-cols-12`}>
          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              For lecturers
            </p>
            <h1 className="text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
              Review.
              <br />
              Your name on every decision.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
              Verified lecturers are the trust mechanism for the Education Hub. A verified decision
              from a named, credentials-confirmed reviewer carries weight with employers.
            </p>
            <Link
              href="/auth/register?role=lecturer"
              className="inline-flex items-center justify-center self-start rounded-sm bg-brand px-7 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover active:scale-95"
            >
              Register as a Lecturer
            </Link>
          </div>
          <div className="lg:col-span-5">
            <MediaFrame
              alt="A lecturer reviewing a student project submission"
              label="Lecturer reviewing"
              aspect="aspect-[4/5]"
              priority
            />
          </div>
        </div>
      </section>

      {/* What participation involves */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>What participation involves</h2>
          {INVOLVEMENT_ROWS.map((row) => (
            <div
              key={row.label}
              className="flex w-full flex-col gap-6 border-b border-border py-8 first:border-t md:flex-row md:gap-10"
            >
              <p className="w-full shrink-0 text-xl font-semibold leading-snug text-fg md:w-80">{row.label}</p>
              <div className="flex flex-1 flex-col gap-4">
                {row.paras.map((para) => (
                  <p key={para} className="text-base leading-relaxed text-fg-muted">{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How verification works */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>How lecturer verification works</h2>
          <div className="grid grid-cols-1 divide-y divide-border border-y border-border">
            {STEPS.map((step) => (
              <div key={step.n} className="flex items-start gap-6 py-7">
                <div className="flex shrink-0 items-center rounded-sm bg-surface-sunken px-3.5 py-2">
                  <span className="font-semibold text-brand">{step.n}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-lg font-semibold leading-snug text-fg">{step.title}</p>
                  <p className="leading-relaxed text-fg-muted">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Constraints */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-8 py-24`}>
          <h2 className={H2}>What constraints apply</h2>
          {CONSTRAINTS.map((text) => (
            <div key={text} className="w-full rounded border-l-2 border-brand bg-surface px-7 py-6">
              <p className="text-base leading-relaxed text-fg-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why it matters + CTA */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-8 py-24`}>
          <h2 className={H2}>Why participation matters</h2>
          <div className="flex max-w-3xl flex-col gap-4">
            <p className="text-lg leading-relaxed text-fg-muted">
              The Education Hub&apos;s credibility depends on reviewer quality. A verified decision
              from a credentialed reviewer at a recognized institution carries weight with employers.
              A verified decision from an anonymous reviewer carries none.
            </p>
            <p className="text-lg leading-relaxed text-fg-muted">
              Your participation is the trust mechanism. Without named, credentials-confirmed
              reviewers, the verification chain breaks. The platform&apos;s value rests on your name
              being attached to your decisions.
            </p>
          </div>
          <Link
            href="/auth/register?role=lecturer"
            className="inline-flex items-center justify-center self-start rounded-sm bg-brand px-7 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover active:scale-95"
          >
            Register as a Lecturer
          </Link>
        </div>
      </section>
    </>
  );
}
