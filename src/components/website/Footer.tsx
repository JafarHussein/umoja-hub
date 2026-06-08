import Link from 'next/link';

const LINKS = {
  Platform: [
    { label: 'Food Security Hub', href: '/for/farmers' },
    { label: 'Education Hub', href: '/education' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Knowledge Hub', href: '/knowledge' },
  ],
  Methodology: [
    { label: 'Trust & Verification', href: '/trust' },
    { label: 'Transparency', href: '/transparency' },
    { label: 'Team', href: '/team' },
  ],
  'For You': [
    { label: 'Farmers', href: '/for/farmers' },
    { label: 'Students', href: '/for/students' },
    { label: 'Buyers', href: '/for/buyers' },
    { label: 'Employers', href: '/for/employers' },
    { label: 'Lecturers', href: '/for/lecturers' },
    { label: 'NGOs & Government', href: '/for/ngos' },
    { label: 'Cooperatives', href: '/for/cooperatives' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'How It Works', href: '/how-it-works' },
  ],
} as const;

export function Footer() {
  return (
    <footer className="bg-ws-text-heading border-t border-[#2A3138]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        {/* Top: wordmark + links grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8 mb-16">
          {/* Wordmark col */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-jakarta font-700 text-[#F2F0EC] text-[1.125rem] tracking-[-0.02em]"
            >
              UmojaHub
            </Link>
            <p className="mt-3 font-jakarta text-[0.875rem] text-[#A9A29A] leading-relaxed max-w-[200px]">
              Verified infrastructure for food security and technical education.
            </p>
          </div>

          {/* Link columns */}
          {(Object.entries(LINKS) as [string, readonly { label: string; href: string }[]][]).map(
            ([group, items]) => (
              <div key={group}>
                <p className="font-jakarta text-[0.75rem] font-600 text-[#A9A29A] uppercase tracking-[0.08em] mb-4">
                  {group}
                </p>
                <ul className="space-y-2.5">
                  {items.map(({ label, href }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="font-jakarta text-[0.875rem] text-[#D6D1CB] hover:text-[#F2F0EC] transition-colors duration-fast ease-standard"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>

        {/* Bottom: contact + copyright */}
        <div className="border-t border-[#2A3138] pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {[
              'partnerships@umojahub.org',
              'press@umojahub.org',
              'hello@umojahub.org',
            ].map((email) => (
              <a
                key={email}
                href={`mailto:${email}`}
                className="font-ibm-mono text-[0.8125rem] text-[#878078] hover:text-[#A9A29A] transition-colors duration-fast ease-standard"
              >
                {email}
              </a>
            ))}
          </div>
          <p className="font-jakarta text-[0.8125rem] text-[#878078]">
            © {new Date().getFullYear()} UmojaHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
