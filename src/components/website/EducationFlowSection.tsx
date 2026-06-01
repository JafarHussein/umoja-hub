import React from 'react';
import Link from 'next/link';
import { ProcessFlow } from '@/components/website/ProcessFlow';

const steps = [
  {
    actor: 'Student',
    action: 'Track selected',
    detail:
      'Student registers on the Education Hub and selects a focus track: Agriculture, Health, Finance, or Infrastructure. Or brings an existing GitHub repository.',
  },
  {
    actor: 'System',
    action: 'Brief generated',
    detail:
      'AI generates a project brief scoped to a Kenyan industry challenge in the selected track. The brief specifies the problem, constraints, and expected deliverables.',
  },
  {
    actor: 'Student',
    action: 'Documents submitted',
    detail:
      'Three structured documents: Problem Breakdown (what the problem is), Approach Plan (how the student will solve it), Final Reflection (what was built and what was learned).',
  },
  {
    actor: 'Peer',
    action: 'Peer review scored',
    detail:
      'A registered peer student reviews the submission on four dimensions: clarity, methodology, documentation, and reflection. Score submitted before the lecturer sees it.',
  },
  {
    actor: 'Lecturer',
    action: 'Lecturer decision issued',
    detail:
      'A verified lecturer reviews the peer score and all three documents. Issues one of: VERIFIED, REVISION REQUIRED, or DENIED. The decision is recorded with a timestamp.',
  },
  {
    actor: 'System',
    action: 'Portfolio updated',
    detail:
      'VERIFIED projects appear on the student\'s public portfolio page with a shareable link showing verification status, date, brief type, and skills demonstrated.',
  },
];

export function EducationFlowSection(): React.ReactElement {
  return (
    <section className="bg-surface-primary py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
            Education Hub · How it works
          </p>
          <h2 className="font-heading text-[32px] lg:text-display-lg font-semibold text-text-primary tracking-tight mb-4">
            How the Education Hub works
          </h2>
          <p className="font-body text-t4 text-text-secondary max-w-prose">
            Six steps from project selection to verified credential. Every decision in the pipeline
            is made by a verified human — peer student or registered lecturer.
          </p>
        </div>

        <ProcessFlow steps={steps} />

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
