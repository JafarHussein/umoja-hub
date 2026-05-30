'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/',              label: 'Home' },
  { href: '/verification',  label: 'Verification Model' },
  { href: '/ai-safety',     label: 'AI Safety' },
  { href: '/partnerships',  label: 'Partnerships' },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-rule">
      <div className="canvas-inner flex items-center justify-between h-16">
        <Link
          href="/"
          className="font-mono text-m3 text-text-secondary tracking-label uppercase hover:text-text-primary transition-colors duration-150"
        >
          umojahub.co.ke
        </Link>

        <nav aria-label="Site navigation">
          <ul className="flex items-center gap-10 list-none m-0 p-0">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      'font-institutional text-i3 transition-colors duration-150',
                      active
                        ? 'text-text-primary font-medium'
                        : 'text-text-secondary hover:text-text-primary',
                    ].join(' ')}
                    aria-current={active ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
