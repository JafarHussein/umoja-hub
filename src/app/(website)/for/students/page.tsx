import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';
import { ImageSlot } from '@/components/website/ImageSlot';

export const metadata: Metadata = {
  title: 'For Students — Education Hub · UmojaHub',
  description:
    'Build a verifiable CS portfolio. Every project is cryptographically hashed and reviewed by a verified lecturer — employers can check it without an account.',
};

const THREE_DOCS = [
  {
    id: 'DOC 01',
    name: 'Project Brief',
    description:
      'A structured specification submitted before work begins. Defines scope, methodology, and expected outcomes.',
  },
  {
    id: 'DOC 02',
    name: 'Reflection Document',
    description:
      'A post-project analysis covering what was built, what failed, and what was learned. Assessed on four rubric dimensions.',
  },
  {
    id: 'DOC 03',
    name: 'Code Repository',
    description:
      'A SHA-256 hashed snapshot of the working codebase at submission time. Immutable after hashing.',
  },
] as const;

const IS_ITEMS = [
  'A portfolio of real, assessed CS projects — not course certificates',
  'Each entry cryptographically hashed so the content cannot be altered after verification',
  'Reviewed by a named, verified lecturer who signs off with their institutional credentials',
  'Publicly accessible to employers without requiring them to register',
  'A permanent record — verifications do not expire',
];

const IS_NOT_ITEMS = [
  'A transcript or GPA replacement',
  'A job placement service',
  'A platform that accepts self-certified projects',
  'A substitute for a degree or professional certification',
];

const VERIFICATION_STEPS = [
  {
    n: '01',
    label: 'Submit',
    text: 'Upload your three documents and link your code repository.',
  },
  {
    n: '02',
    label: 'Hash',
    text: 'The platform generates a SHA-256 hash of your submission. This becomes the immutable anchor.',
  },
  {
    n: '03',
    label: 'Review',
    text: 'A verified lecturer from your institution reviews against a published four-dimension rubric.',
  },
  {
    n: '04',
    label: 'Verify',
    text: 'On approval, your portfolio entry is marked VERIFIED and becomes publicly accessible.',
  },
] as const;

export default function ForStudentsPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="pt-32 pb-0 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <AnimateIn>
                <p className="font-ibm-mono text-ws-meta text-violet mb-4">Education Hub</p>
              </AnimateIn>
              <AnimateIn delay={0.08}>
                <h1 className="text-ws-h1 font-jakarta font-700 text-ws-text-heading leading-[1.15] tracking-[-0.02em]">
                  A portfolio employers can{' '}
                  <span className="text-violet">verify without asking you</span>
                </h1>
              </AnimateIn>
              <AnimateIn delay={0.16}>
                <p className="mt-5 text-ws-body font-jakarta text-ws-text-secondary leading-[1.6] max-w-lg">
                  Every project entry in your UmojaHub portfolio is reviewed by a named lecturer and
                  cryptographically locked. Employers verify independently — no references needed,
                  no account required.
                </p>
              </AnimateIn>
              <AnimateIn delay={0.24}>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/auth/register?role=STUDENT"
                    className="inline-flex items-center px-6 py-3 bg-violet text-white font-jakarta font-600 text-[1rem] rounded-sm hover:bg-[#5A4A88] active:scale-[0.98] transition-all duration-fast ease-standard"
                  >
                    Register as a Student →
                  </Link>
                  <Link
                    href="/trust"
                    className="inline-flex items-center px-6 py-3 border border-ws-border-default text-ws-text-heading font-jakarta font-500 text-[1rem] rounded-sm hover:bg-ws-surface-primary transition-all duration-standard ease-standard"
                  >
                    Read the methodology
                  </Link>
                </div>
              </AnimateIn>
            </div>

            {/* Image slot — drop /public/images/students-hero.jpg here */}
            <AnimateIn delay={0.12} className="lg:self-end">
              <ImageSlot
                src="/images/students-hero.jpg"
                alt="A CS student working on a verified project in Kenya"
                aspectRatio="4/3"
                priority
                className="rounded-sm"
              />
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── SHA-256 specimen ── */}
      <AnimateIn>
        <section className="py-16 px-6 lg:px-8 bg-ws-surface-technical border-y border-ws-border-soft">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-jakarta text-ws-meta text-ws-text-secondary mb-3">
              Each submission is cryptographically locked at the moment of review
            </p>
            <code className="block font-ibm-mono text-[0.8125rem] text-teal bg-ws-surface-primary border border-ws-border-soft px-6 py-4 rounded-sm break-all">
              sha256:8f3a9d2c1b4e7f6a0d5c8b3e9f2a7d1c4b6e0f8a3d5c2b9e7f4a1d6c0b8e3f2
            </code>
            <p className="mt-3 font-jakarta text-ws-meta text-ws-text-meta">
              Illustrative hash — your actual hash is generated from your submission content
            </p>
          </div>
        </section>
      </AnimateIn>

      {/* ── IS / IS NOT ── */}
      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <AnimateIn>
              <p className="font-ibm-mono text-ws-meta text-violet mb-5">What it is</p>
              <ul className="space-y-3">
                {IS_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-violet" />
                    <span className="font-jakarta text-ws-body text-ws-text-body">{item}</span>
                  </li>
                ))}
              </ul>
            </AnimateIn>
            <AnimateIn delay={0.08}>
              <p className="font-ibm-mono text-ws-meta text-ws-text-meta mb-5">What it is not</p>
              <ul className="space-y-3">
                {IS_NOT_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-ws-border-default" />
                    <span className="font-jakarta text-ws-body text-ws-text-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── Three Documents ── */}
      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-violet mb-3">What you submit</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              Three documents, one portfolio entry
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {THREE_DOCS.map((doc, i) => (
              <AnimateIn key={doc.id} delay={i * 0.08}>
                <div className="p-6 bg-canvas-base border border-ws-border-soft rounded-sm">
                  <p className="font-ibm-mono text-ws-meta text-violet mb-2">{doc.id}</p>
                  <h3 className="font-jakarta text-ws-h2 font-600 text-ws-text-heading mb-3">
                    {doc.name}
                  </h3>
                  <p className="font-jakarta text-ws-body text-ws-text-secondary leading-[1.6]">
                    {doc.description}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Verification steps ── */}
      <section className="py-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-violet mb-3">The process</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              From submission to verified
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VERIFICATION_STEPS.map((step, i) => (
              <AnimateIn key={step.n} delay={i * 0.08}>
                <div className="p-6 bg-ws-surface-primary border border-ws-border-soft rounded-sm">
                  <p className="font-ibm-mono text-ws-meta text-ws-text-meta mb-1">{step.n}</p>
                  <p className="font-jakarta font-600 text-ws-text-heading mb-3">{step.label}</p>
                  <p className="font-jakarta text-ws-body text-ws-text-secondary leading-[1.6]">
                    {step.text}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <AnimateIn>
        <section className="py-24 px-6 lg:px-8 bg-ws-text-heading">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-ws-h1 font-jakarta font-600 text-[#F2F0EC] mb-4">
              Start your verified portfolio
            </h2>
            <p className="text-ws-body font-jakarta text-[#A9A29A] mb-10">
              Submit your first project. A verified lecturer from your institution will review it
              within 30 days.
            </p>
            <Link
              href="/auth/register?role=STUDENT"
              className="inline-flex items-center px-8 py-4 bg-violet text-white font-jakarta font-600 text-[1.0625rem] rounded-sm hover:bg-[#5A4A88] active:scale-[0.98] transition-all duration-fast ease-standard"
            >
              Register as a Student →
            </Link>
          </div>
        </section>
      </AnimateIn>
    </>
  );
}
