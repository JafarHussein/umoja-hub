import React from 'react';
import Link from 'next/link';

const columns = [
  {
    heading: 'Platform',
    links: [
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Knowledge Hub', href: '/knowledge' },
      { label: 'Education Hub', href: '/education' },
      { label: 'How It Works', href: '/how-it-works' },
    ],
  },
  {
    heading: 'For You',
    links: [
      { label: 'Farmers', href: '/for/farmers' },
      { label: 'Buyers', href: '/for/buyers' },
      { label: 'Suppliers', href: '/for/suppliers' },
      { label: 'Students', href: '/for/students' },
      { label: 'Lecturers', href: '/for/lecturers' },
      { label: 'Employers', href: '/for/employers' },
      { label: 'Institutions', href: '/for/institutions' },
      { label: 'NGOs', href: '/for/ngos' },
      { label: 'Cooperatives', href: '/for/cooperatives' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Transparency', href: '/transparency' },
      { label: 'Trust & Verification', href: '/trust' },
      { label: 'Security', href: '/security' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Terms of Service', href: '/legal/terms' },
      { label: 'Privacy Policy', href: '/legal/privacy' },
    ],
  },
] as const;

export function WebsiteFooter(): React.ReactElement {
  return (
    <footer className="border-t border-zinc-800/50 bg-surface-primary">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        {/* Link grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body text-t5 text-text-secondary hover:text-text-primary transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-zinc-800/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-sm bg-accent-green shrink-0" />
            <span className="font-heading text-t6 font-semibold text-text-secondary">
              UmojaHub
            </span>
          </div>
          <p className="font-mono text-t6 text-text-disabled">
            &copy; {new Date().getFullYear()} UmojaHub. Built for East Africa.
          </p>
        </div>
      </div>
    </footer>
  );
}
