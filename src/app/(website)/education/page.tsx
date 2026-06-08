import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimateIn } from '@/components/website/AnimateIn';

export const metadata: Metadata = {
  title: 'Education Hub — UmojaHub',
  description:
    'The UmojaHub Education Hub gives CS students a verifiable portfolio and gives employers a way to check it independently.',
};

const AUDIENCE_CARDS = [
  {
    role: 'Students',
    description: 'Build a portfolio of real, assessed CS projects. Each entry is cryptographically hashed and reviewed by a verified lecturer.',
    href: '/for/students',
    accent: 'violet',
    cta: 'For Students →',
  },
  {
    role: 'Lecturers',
    description: 'Review student project submissions and issue verified assessments. Your institutional credentials anchor every decision.',
    href: '/for/lecturers',
    accent: 'violet',
    cta: 'For Lecturers →',
  },
  {
    role: 'Employers',
    description: 'Verify student portfolios built on real evidence — without registering or paying. Independent verification built in.',
    href: '/for/employers',
    accent: 'violet',
    cta: 'For Employers →',
  },
] as const;

export default function EducationHubPage() {
  return (
    <>
      <section className="pt-32 pb-24 px-6 lg:px-8 bg-canvas-base">
        <div className="mx-auto max-w-4xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-violet mb-4">Education Hub</p>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h1 className="text-ws-h1 font-jakarta font-700 text-ws-text-heading leading-[1.15] tracking-[-0.02em]">
              Verified CS portfolios.{' '}
              <span className="text-violet">Independently checkable by employers.</span>
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mt-5 text-ws-body font-jakarta text-ws-text-secondary leading-[1.6] max-w-2xl">
              The Education Hub connects CS students, lecturers, and employers through a
              cryptographically anchored verification system. Students build real portfolios.
              Lecturers review them against a published rubric. Employers verify independently.
            </p>
          </AnimateIn>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-8 bg-ws-surface-primary border-y border-ws-border-soft">
        <div className="mx-auto max-w-7xl">
          <AnimateIn>
            <p className="font-ibm-mono text-ws-meta text-violet mb-3">Who is this for?</p>
            <h2 className="text-ws-h1 font-jakarta font-600 text-ws-text-heading mb-12">
              Three roles in the Education Hub
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AUDIENCE_CARDS.map((card, i) => (
              <AnimateIn key={card.role} delay={i * 0.08}>
                <Link
                  href={card.href}
                  className="group block p-6 bg-canvas-base border border-ws-border-soft rounded-sm hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] transition-all duration-standard ease-standard"
                >
                  <p className="font-ibm-mono text-ws-meta text-violet mb-3">{card.role}</p>
                  <p className="font-jakarta text-ws-body text-ws-text-body leading-[1.6] mb-4">{card.description}</p>
                  <p className="font-jakarta text-ws-meta font-600 text-ws-text-heading group-hover:text-violet transition-colors duration-fast ease-standard">
                    {card.cta}
                  </p>
                </Link>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <AnimateIn>
        <section className="py-24 px-6 lg:px-8 bg-ws-text-heading">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-ws-h1 font-jakarta font-600 text-[#F2F0EC] mb-4">
              Start with your first project
            </h2>
            <p className="text-ws-body font-jakarta text-[#A9A29A] mb-10">
              Register as a student and submit your first project. A verified lecturer will review
              it within 30 days.
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
