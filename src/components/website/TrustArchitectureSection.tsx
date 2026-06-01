import React from 'react';
import Link from 'next/link';

interface TrustColumn {
  title: string;
  hub: string;
  checks: string[];
  confirms: string;
  doesNotClaim: string;
}

const columns: TrustColumn[] = [
  {
    title: 'Farmer Verification',
    hub: 'Food Security Hub',
    checks: [
      'National ID or passport',
      'Land tenure document or signed lease agreement',
      'Photograph of produce or farm',
    ],
    confirms:
      'This person submitted these documents. A UmojaHub administrator reviewed them against the submission.',
    doesNotClaim:
      'That the farmer will fulfil every order, or that produce meets any quality standard.',
  },
  {
    title: 'Supplier Verification',
    hub: 'Food Security Hub',
    checks: [
      'Business registration certificate',
      'KRA PIN certificate',
      'Photograph of physical business premises',
    ],
    confirms:
      'This business entity exists at a verifiable location and holds current registration at the time of review.',
    doesNotClaim:
      "That the supplier's inputs meet any quality or safety standard beyond their registration status.",
  },
  {
    title: 'Education Verification',
    hub: 'Education Hub',
    checks: [
      'Three process documents: Breakdown, Plan, Reflection',
      'Peer review score on four dimensions',
      'Verified lecturer decision with timestamp',
    ],
    confirms:
      'A registered lecturer who was verified by UmojaHub reviewed this submission and determined it met the documented standard.',
    doesNotClaim:
      'That the student can be hired for any specific role, or that the project code is production-ready.',
  },
];

export function TrustArchitectureSection(): React.ReactElement {
  return (
    <section className="bg-surface-elevated w-full py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
            Trust & Verification
          </p>
          <h2 className="font-heading text-[32px] lg:text-display-lg font-semibold text-text-primary tracking-tight mb-4">
            What verification means — and what it does not
          </h2>
          <p className="font-body text-t4 text-text-secondary max-w-prose">
            UmojaHub verifies identity and credentials. Verification confirms that documents were
            submitted and reviewed. It does not guarantee performance, quality, or outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-zinc-800/50">
          {columns.map((col) => (
            <div key={col.title} className="bg-surface-elevated p-6 flex flex-col gap-5">
              <div>
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
                  {col.hub}
                </p>
                <h3 className="font-heading text-display-sm font-medium text-text-primary">
                  {col.title}
                </h3>
              </div>

              <div>
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
                  What it checks
                </p>
                <ul className="flex flex-col gap-2">
                  {col.checks.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-accent-green shrink-0" />
                      <span className="font-body text-t5 text-text-secondary">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
                  What it confirms
                </p>
                <p className="font-body text-t5 text-text-secondary">{col.confirms}</p>
              </div>

              <div>
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
                  What it does not claim
                </p>
                <p className="font-body text-t5 text-text-secondary italic">{col.doesNotClaim}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/trust"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
          >
            Full verification methodology
          </Link>
        </div>
      </div>
    </section>
  );
}
