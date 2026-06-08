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
    <footer className="bg-ws-text-heading">
      <div className="mx-auto max-w-7xl px-[120px] pt-[64px] pb-[48px] flex flex-col gap-[48px]">
        {/* Columns row */}
        <div className="flex items-start gap-8">
          {/* Brand col */}
          <div className="flex-1 flex flex-col gap-3">
            <Link
              href="/"
              className="font-jakarta font-600 text-[#F2F0EC] text-[1rem] tracking-[-0.01em] hover:opacity-80 transition-opacity duration-fast ease-standard"
            >
              UmojaHub
            </Link>
            <p className="font-jakarta text-[0.8125rem] text-[#636C76] leading-[1.55] w-[240px]">
              East Africa&apos;s verification infrastructure for farmers and graduates.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map(({ heading, links }) => (
            <div key={heading} className="flex-1 flex flex-col gap-3">
              <p className="font-jakarta text-[0.75rem] font-600 text-[#878078] tracking-[0.24px]">
                {heading.toUpperCase()}
              </p>
              <ul className="flex flex-col gap-3">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="font-jakarta text-[0.875rem] font-400 text-[#636C76] hover:text-[#D6D1CB] transition-colors duration-fast ease-standard"
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
        <div className="h-px bg-[#2A3138]" />

        {/* Bottom */}
        <div className="flex items-center justify-between">
          <p className="font-jakarta text-[0.75rem] font-400 text-[#636C76]">
            © {new Date().getFullYear()} UmojaHub. Verification methodology published at{' '}
            <Link href="/trust" className="hover:text-[#A9A29A] transition-colors">
              /trust
            </Link>
            .
          </p>
          <a
            href="mailto:hello@umojahub.org"
            className="font-ibm-mono text-[0.75rem] text-[#636C76] hover:text-[#A9A29A] transition-colors duration-fast ease-standard"
          >
            hello@umojahub.org
          </a>
        </div>
      </div>
    </footer>
  );
}
