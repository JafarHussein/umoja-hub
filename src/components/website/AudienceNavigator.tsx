import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';

interface Audience {
  label: string;
  href: string;
  description: string;
  hub: 'food' | 'education' | 'both';
}

const audiences: Audience[] = [
  {
    label: 'Farmers',
    href: '/for/farmers',
    description: 'List produce, receive M-Pesa payment directly, and build a trust score across verified orders.',
    hub: 'food',
  },
  {
    label: 'Buyers',
    href: '/for/buyers',
    description: 'Browse listings from verified farmers, pay by M-Pesa, and track orders from payment to delivery.',
    hub: 'food',
  },
  {
    label: 'Suppliers',
    href: '/for/suppliers',
    description: 'Supply agricultural inputs to verified farmer cooperatives with group payment coordination.',
    hub: 'food',
  },
  {
    label: 'Students',
    href: '/for/students',
    description: 'Submit project documentation, pass peer and lecturer review, and earn a shareable verified credential.',
    hub: 'education',
  },
  {
    label: 'Lecturers',
    href: '/for/lecturers',
    description: 'Review student project submissions and issue verified decisions on your registered track.',
    hub: 'education',
  },
  {
    label: 'Employers',
    href: '/for/employers',
    description: 'Browse verified student portfolios with confirmed process documentation and skill evidence.',
    hub: 'education',
  },
  {
    label: 'Cooperatives',
    href: '/for/cooperatives',
    description: 'Organise collective crop sales and coordinate group orders from verified suppliers.',
    hub: 'food',
  },
  {
    label: 'Institutions',
    href: '/for/institutions',
    description: 'Partner to have your verified lecturers issue credentials on the Education Hub.',
    hub: 'education',
  },
  {
    label: 'NGOs',
    href: '/for/ngos',
    description: 'Access verified agricultural and education data for impact reporting and programme design.',
    hub: 'both',
  },
];

const hubLabel: Record<Audience['hub'], string> = {
  food: 'Food Security Hub',
  education: 'Education Hub',
  both: 'Both hubs',
};

export function AudienceNavigator(): React.ReactElement {
  return (
    <section className="bg-surface-elevated w-full py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
            Who UmojaHub is for
          </p>
          <h2 className="font-heading text-[32px] lg:text-display-lg font-semibold text-text-primary tracking-tight">
            Nine roles. Two hubs. One trust architecture.
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800/50">
          {audiences.map((audience) => (
            <Link
              key={audience.href}
              href={audience.href}
              className="group bg-surface-elevated p-6 flex flex-col gap-3 transition-colors duration-150 hover:bg-surface-primary"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading text-display-sm font-medium text-text-primary">
                  {audience.label}
                </h3>
                <ArrowRightIcon className="h-4 w-4 text-text-disabled shrink-0 mt-1 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent-green" />
              </div>
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
                {hubLabel[audience.hub]}
              </p>
              <p className="font-body text-t5 text-text-secondary">
                {audience.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
