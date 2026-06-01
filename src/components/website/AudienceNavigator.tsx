import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';

interface AudienceEntry {
  problem: string;
  label: string;
  href: string;
}

const foodHub: AudienceEntry[] = [
  {
    problem:
      'You grow produce but cannot reach buyers who can verify your reliability before the first order.',
    label: 'For Farmers',
    href: '/for/farmers',
  },
  {
    problem:
      'You buy produce and need a source you can verify — not just a price — before committing to a purchase.',
    label: 'For Buyers',
    href: '/for/buyers',
  },
  {
    problem:
      'You supply agricultural inputs and need a verified channel to farmer cooperative groups.',
    label: 'For Suppliers',
    href: '/for/suppliers',
  },
  {
    problem:
      'Your farming group wants to purchase inputs collectively and reduce per-unit costs through coordinated orders.',
    label: 'For Cooperatives',
    href: '/for/cooperatives',
  },
];

const educationHub: AudienceEntry[] = [
  {
    problem:
      'You built real projects but cannot prove to an employer who actually did the work and understood it.',
    label: 'For Students',
    href: '/for/students',
  },
  {
    problem:
      "You have academic expertise and can assess whether a student's process documentation meets a professional standard.",
    label: 'For Lecturers',
    href: '/for/lecturers',
  },
  {
    problem:
      'You hire developers and need verifiable evidence beyond a GitHub link that no qualified person has reviewed.',
    label: 'For Employers',
    href: '/for/employers',
  },
  {
    problem:
      'Your institution has CS faculty whose assessments should carry publicly verifiable weight.',
    label: 'For Institutions',
    href: '/for/institutions',
  },
];

function AudienceCard({ entry }: { entry: AudienceEntry }): React.ReactElement {
  return (
    <Link
      href={entry.href}
      className="group bg-surface-elevated p-5 flex flex-col gap-4 transition-colors duration-150 hover:bg-surface-primary"
    >
      <p className="font-body text-t5 text-text-secondary leading-relaxed flex-1">
        {entry.problem}
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-t6 text-accent-green uppercase tracking-widest">
          {entry.label}
        </span>
        <ArrowRightIcon className="h-3.5 w-3.5 text-text-disabled shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent-green" />
      </div>
    </Link>
  );
}

interface HubSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  entries: AudienceEntry[];
}

function HubSection({ eyebrow, title, description, entries }: HubSectionProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
          {eyebrow}
        </p>
        <h3 className="font-heading text-display-sm font-semibold text-text-primary mb-2">
          {title}
        </h3>
        <p className="font-body text-t5 text-text-secondary max-w-sm">{description}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-zinc-800/50">
        {entries.map((entry) => (
          <AudienceCard key={entry.href} entry={entry} />
        ))}
      </div>
    </div>
  );
}

export function AudienceNavigator(): React.ReactElement {
  return (
    <section className="bg-surface-elevated w-full py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
            Find your entry point
          </p>
          <h2 className="font-heading text-[32px] lg:text-display-lg font-semibold text-text-primary tracking-tight">
            Which problem describes yours?
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <HubSection
            eyebrow="Food Security Hub"
            title="Verified agricultural commerce"
            description="A marketplace where every farmer is identity-verified and every transaction is M-Pesa confirmed."
            entries={foodHub}
          />
          <HubSection
            eyebrow="Education Hub"
            title="Verified CS capability"
            description="A project pipeline where every credential is backed by structured documentation and verified lecturer review."
            entries={educationHub}
          />
        </div>

        <div className="mt-8 border-t border-zinc-800/50 pt-8">
          <Link
            href="/for/ngos"
            className="group inline-flex items-center gap-4 p-5 border border-zinc-800/50 w-full transition-colors duration-150 hover:border-white/20"
          >
            <div className="flex-1">
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
                NGOs &amp; Government
              </p>
              <p className="font-body text-t5 text-text-secondary">
                Your organisation works with farmers or students and needs verified impact data for
                reporting or programme design.
              </p>
            </div>
            <ArrowRightIcon className="h-4 w-4 text-text-disabled shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent-green" />
          </Link>
        </div>
      </div>
    </section>
  );
}
