import React from 'react';
import Link from 'next/link';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

const COLUMNS: FooterColumn[] = [
  {
    heading: 'Platform',
    links: [
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Knowledge Hub', href: '/knowledge' },
    ],
  },
  {
    heading: 'Food Security Hub',
    links: [
      { label: 'For Farmers', href: '/for/farmers' },
      { label: 'For Buyers', href: '/for/buyers' },
      { label: 'For Suppliers', href: '/for/suppliers' },
      { label: 'For Cooperatives', href: '/for/cooperatives' },
    ],
  },
  {
    heading: 'Education Hub',
    links: [
      { label: 'For Students', href: '/for/students' },
      { label: 'For Lecturers', href: '/for/lecturers' },
      { label: 'For Employers', href: '/for/employers' },
      { label: 'For Institutions', href: '/for/institutions' },
    ],
  },
  {
    heading: 'Governance',
    links: [
      { label: 'Trust & Verification', href: '/trust' },
      { label: 'Transparency', href: '/transparency' },
      { label: 'For NGOs & Government', href: '/for/ngos' },
      { label: 'About UmojaHub', href: '/about' },
    ],
  },
];

export function WebsiteFooter(): React.ReactElement {
  return (
    <footer role="contentinfo" className="bg-ws-surface-dark border-t border-ws-border-dark">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="font-geist-mono text-ws-caption text-ws-text-faint uppercase mb-4">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-geist text-ws-body-sm text-ws-text-dim hover:text-ws-text-bright transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-ws-border-dark pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-sm bg-ws-hub-green shrink-0" aria-hidden />
            <span className="font-display text-ws-label font-semibold">
              <span className="text-ws-text-bright">Umoja</span>
              <span className="text-ws-hub-green">Hub</span>
            </span>
          </div>
          <p className="font-geist-mono text-ws-caption text-ws-text-faint">
            &copy; {new Date().getFullYear()} UmojaHub. Built for East Africa.
          </p>
        </div>
      </div>
    </footer>
  );
}
