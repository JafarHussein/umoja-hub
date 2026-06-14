import Link from 'next/link';

const COLUMNS = [
  {
    heading: 'Platform',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Team', href: '/team' },
      { label: 'Transparency', href: '/transparency' },
      { label: 'Trust & Verification', href: '/trust' },
      { label: 'How It Works', href: '/how-it-works' },
    ],
  },
  {
    heading: 'Hubs',
    links: [
      { label: 'Food Security Hub', href: '/for/farmers' },
      { label: 'Education Hub', href: '/education' },
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Knowledge Hub', href: '/knowledge' },
    ],
  },
  {
    heading: 'Participants',
    links: [
      { label: 'Farmers', href: '/for/farmers' },
      { label: 'Students', href: '/for/students' },
      { label: 'Buyers', href: '/for/buyers' },
      { label: 'Lecturers', href: '/for/lecturers' },
      { label: 'Employers', href: '/for/employers' },
    ],
  },
  {
    heading: 'Governance',
    links: [
      { label: 'Appeals & Disputes', href: '/transparency#appeals' },
      { label: 'Platform Status', href: '/transparency#status' },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="theme-product bg-background">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20 pt-16 pb-12 flex flex-col gap-12">
        {/* Columns row */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          {/* Brand col */}
          <div className="flex-1 flex flex-col gap-3">
            <Link
              href="/"
              className="font-semibold text-fg text-base tracking-tight hover:opacity-80 transition-opacity duration-fast ease-standard"
            >
              UmojaHub
            </Link>
            <p className="text-xs text-fg-subtle leading-relaxed max-w-xs">
              East Africa&apos;s verification infrastructure for farmers and graduates.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map(({ heading, links }) => (
            <div key={heading} className="flex-1 flex flex-col gap-3">
              <p className="text-xs font-semibold text-fg-subtle tracking-wider">
                {heading.toUpperCase()}
              </p>
              <ul className="flex flex-col gap-3">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-fg-muted hover:text-fg transition-colors duration-fast ease-standard"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Bottom */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-fg-subtle">
            © {new Date().getFullYear()} UmojaHub. Verification methodology published at{' '}
            <Link href="/trust" className="hover:text-fg-muted transition-colors">
              /trust
            </Link>
            .
          </p>
          <a
            href="mailto:hello@umojahub.org"
            className="font-ibm-mono text-xs text-fg-subtle hover:text-fg-muted transition-colors duration-fast ease-standard"
          >
            hello@umojahub.org
          </a>
        </div>
      </div>
    </footer>
  );
}
