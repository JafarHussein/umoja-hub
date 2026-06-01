import React from 'react';
import Link from 'next/link';
import { ProcessFlow } from '@/components/website/ProcessFlow';

const steps = [
  {
    actor: 'Student',
    action: 'Track selected',
    detail:
      'Student registers on the Education Hub and selects a focus track: Agriculture, Health, Finance, or Infrastructure. Alternatively, they bring an existing GitHub repository for open-source contribution review.',
  },
  {
    actor: 'System',
    action: 'Brief generated',
    detail:
      'The AI generates a project brief scoped to a Kenyan industry challenge in the selected track. The brief specifies the problem, constraints, and expected deliverables. The student cannot modify the brief after it is generated.',
  },
  {
    actor: 'Student',
    action: 'Documents submitted',
    detail:
      'Three structured documents: Problem Breakdown (what the problem is and how the student analysed it), Approach Plan (how they structured the work before beginning), Final Reflection (what was built, what failed, and what was learned). A cryptographic hash of the submitted documents is recorded at this point.',
  },
  {
    actor: 'Peer',
    action: 'Peer review scored',
    detail:
      'A registered peer student reviews the submission on four dimensions: clarity, methodology, documentation quality, and reflection depth. The peer score is submitted and locked before the lecturer sees the submission.',
  },
  {
    actor: 'Lecturer',
    action: 'Lecturer decision issued',
    detail:
      'A verified lecturer reviews the peer score and all three documents. Issues one of three decisions: VERIFIED, REVISION REQUIRED, or DENIED. The decision is recorded with a timestamp and the lecturer\'s identity. REVISION REQUIRED returns the submission to the student with specific feedback.',
  },
  {
    actor: 'System',
    action: 'Portfolio updated',
    detail:
      "VERIFIED projects appear on the student's public portfolio page with a shareable link showing the verification status, decision date, brief type, track, and skills demonstrated. The document hash allows independent verification that the submitted documents were not altered after submission.",
  },
];

export function EducationFlowSection(): React.ReactElement {
  return (
    <section className="bg-surface-primary py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
            Education Hub · The problem it addresses
          </p>
          <h2 className="font-heading text-[32px] lg:text-display-lg font-semibold text-text-primary tracking-tight mb-6">
            How the Education Hub works
          </h2>
          <div className="max-w-prose space-y-4">
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              An employer receives a resume with five GitHub repositories listed. They have no way
              to know who wrote the code, whether the student understood it, whether the
              documentation reflects the student&apos;s own thinking, or whether any qualified person
              assessed the quality. The portfolio is self-reported and therefore unverifiable.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              Employers who have been misled before respond by discounting self-reported portfolios
              entirely and relying on institutional reputation — which advantages students from
              well-known universities and disadvantages capable students from smaller institutions
              regardless of their actual ability. The Education Hub was built to make capability
              verifiable, not just self-reported.
            </p>
          </div>
        </div>

        <ProcessFlow steps={steps} />

        <div className="mt-12 border-t border-zinc-800/50 pt-10">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-8">
            Why the pipeline is structured this way
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <h3 className="font-heading text-display-sm font-medium text-text-primary">
                Why three documents rather than just the code
              </h3>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">
                Code demonstrates technical execution. The Breakdown demonstrates analytical
                capability — the ability to decompose a problem and reason about alternatives. The
                Plan demonstrates project management — the ability to structure work before beginning
                it. The Reflection is the most significant indicator of professional maturity: the
                ability to assess your own work honestly, identify what failed and why, and propose
                what you would do differently. An employer reading a student&apos;s Reflection knows
                whether that student thinks like a professional. The three documents make the
                student&apos;s reasoning visible, not just their output.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-heading text-display-sm font-medium text-text-primary">
                Why peer review is mandatory before lecturer review
              </h3>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">
                A lecturer reviewing 30 student submissions without a pre-assessment gate would spend
                significant time on submissions that fail basic criteria of coherence and
                documentation quality. Peer review ensures that every submission reaching the
                lecturer queue has already been assessed by an informed reader against the same
                criteria the lecturer will apply. This protects the lecturer&apos;s time and raises
                the quality floor of what reaches the formal review queue. It also means every
                peer reviewer develops the assessment skills they will later apply to their own
                work.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-heading text-display-sm font-medium text-text-primary">
                Why the document hash matters
              </h3>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">
                When a student submits documents, the platform creates a cryptographic hash of the
                document content and records it in the verification audit log. This means the
                documents cannot be altered after submission — if anyone changed the content after
                the fact, the hash would not match. An employer who cares about authenticity can
                request the hash and verify it against the submitted documents independently. The
                hash is the mechanism that prevents the verified record from being falsified.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/for/students"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
          >
            For students
          </Link>
          <Link
            href="/education"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
          >
            About the Education Hub
          </Link>
        </div>
      </div>
    </section>
  );
}
