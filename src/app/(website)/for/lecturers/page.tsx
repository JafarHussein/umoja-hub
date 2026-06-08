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

export default function ForLecturersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#131619] px-[160px] py-[120px] flex flex-col gap-7">
        <p className="font-jakarta font-500 text-[0.875rem] tracking-[0.02em] text-[#9581cc]">
          For Lecturers
        </p>
        <h1 className="font-jakarta font-800 text-[4.5rem] leading-[1.05] tracking-[-0.03em] text-[#F2F0EC] w-[900px]">
          Review.
          <br />
          Your name on every decision.
        </h1>
        <p className="font-jakarta font-400 text-[1.25rem] leading-[1.6] text-[#A9A29A] w-[800px]">
          Verified lecturers are the trust mechanism for the Education Hub. A VERIFIED decision from
          a named, credentials-confirmed reviewer carries weight with employers. Without you, the
          verification chain breaks.
        </p>
      </section>

      {/* S1 — What participation involves */}
      <section className="bg-[#F5F4F0] px-[160px] py-[96px] flex flex-col gap-10">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#8A919A] uppercase">
          Section 01
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15] w-[900px]">
          What participation involves
        </p>

        {/* Row: Time commitment */}
        <div className="bg-white border-b border-[#D8D3CC] py-8 flex gap-10 w-full">
          <p className="font-jakarta font-600 text-[1.25rem] leading-[1.3] text-[#1D232A] w-[320px] shrink-0">
            Time commitment per review
          </p>
          <div className="flex-1 flex flex-col gap-0">
            <p className="font-jakarta font-400 text-[1.0625rem] leading-[1.65] text-[#636C76]">
              One review requires: reading three documents (Problem Breakdown, Approach Plan, Final
              Reflection), reviewing the peer score and commentary, completing a four-dimension rubric
              assessment with substantive written commentary — minimum 50 words of specific
              assessment, not summary.
            </p>
            <p className="font-jakarta font-400 text-[1.0625rem] leading-[1.65] text-[#636C76] mt-4">
              Expect 45–90 minutes per review.
            </p>
          </div>
        </div>

        {/* Row: What you decide */}
        <div className="bg-white border-b border-[#D8D3CC] py-8 flex gap-10 w-full">
          <p className="font-jakarta font-600 text-[1.25rem] leading-[1.3] text-[#1D232A] w-[320px] shrink-0">
            What you decide
          </p>
          <div className="flex-1 flex flex-col gap-0">
            <p className="font-jakarta font-400 text-[1.0625rem] leading-[1.65] text-[#636C76]">
              VERIFIED, REVISION_REQUIRED, or DENIED.
            </p>
            <p className="font-jakarta font-400 text-[1.0625rem] leading-[1.65] text-[#636C76] mt-4">
              Each decision requires written commentary explaining the specific reasons. A one-word
              decision with no commentary does not meet the standard — it will be returned for
              resubmission.
            </p>
          </div>
        </div>

        {/* Row: What you can review */}
        <div className="bg-white border-b border-[#D8D3CC] py-8 flex gap-10 w-full">
          <p className="font-jakarta font-600 text-[1.25rem] leading-[1.3] text-[#1D232A] w-[320px] shrink-0">
            What you can review
          </p>
          <p className="flex-1 font-jakarta font-400 text-[1.0625rem] leading-[1.65] text-[#636C76]">
            Only submissions on tracks where you are verified. You cannot review submissions from
            students at your own institution or from students with whom you have a verifiable direct
            teaching relationship. Conflict of interest prevention is structural — not optional.
          </p>
        </div>
      </section>

      {/* S2 — How lecturer verification works */}
      <section className="bg-[#1B2025] px-[160px] py-[96px] flex flex-col gap-10">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#878078] uppercase">
          Section 02
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#F2F0EC] leading-[1.15] w-[900px]">
          How lecturer verification works
        </p>

        {STEPS.map((step) => (
          <div
            key={step.n}
            className="border-b border-[#2A3138] py-7 flex gap-8 items-start w-full"
          >
            <div className="bg-[#2A3138] px-[14px] py-[8px] shrink-0 flex items-center">
              <span className="font-jakarta font-600 text-[1rem] text-[#9581cc]">{step.n}</span>
            </div>
            <div className="flex flex-col gap-[10px]">
              <p className="font-jakarta font-600 text-[1.125rem] leading-[1.3] text-[#F2F0EC]">
                {step.title}
              </p>
              <p className="font-jakarta font-400 text-[1rem] leading-[1.6] text-[#A9A29A]">
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* S3 — What constraints apply */}
      <section className="bg-[#ECE8E1] px-[160px] py-[96px] flex flex-col gap-8">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#8A919A] uppercase">
          Section 03
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15] w-[800px]">
          What constraints apply
        </p>

        {CONSTRAINTS.map((text) => (
          <div
            key={text}
            className="bg-[#F5F4F0] border-l-[3px] border-[#6B5A9A] px-7 py-6 w-full"
          >
            <p className="font-jakarta font-400 text-[1.0625rem] leading-[1.6] text-[#353C45]">
              {text}
            </p>
          </div>
        ))}
      </section>

      {/* S4 — Why + CTA */}
      <section className="bg-[#131619] px-[160px] py-[96px] flex flex-col gap-10">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#878078] uppercase">
          Section 04
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#F2F0EC] leading-[1.15] w-[800px]">
          Why participation matters
        </p>
        <div className="flex flex-col gap-4 w-[900px]">
          <p className="font-jakarta font-400 text-[1.125rem] leading-[1.65] text-[#A9A29A]">
            The Education Hub&#39;s credibility depends on reviewer quality. A VERIFIED decision from a
            credentialed reviewer at a recognized institution carries weight with employers. A
            VERIFIED decision from an anonymous reviewer carries none.
          </p>
          <p className="font-jakarta font-400 text-[1.125rem] leading-[1.65] text-[#A9A29A]">
            Your participation is the trust mechanism. Without named, credentials-confirmed
            reviewers, the verification chain breaks. The platform&#39;s value proposition rests on your
            name being attached to your decisions.
          </p>
        </div>
        <Link
          href="/auth/register?role=lecturer"
          className="inline-flex items-center self-start bg-[#B86A3D] px-[40px] py-[18px] font-jakarta font-600 text-[1rem] text-[#F2F0EC] hover:opacity-90 transition-opacity"
        >
          Register as a Lecturer
        </Link>
        <p className="font-ibm-mono not-italic text-[0.8125rem] text-[#49515A]">
          /auth/register?role=lecturer
        </p>
      </section>
    </>
  );
}
