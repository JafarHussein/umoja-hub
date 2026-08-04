'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppShell, SessionMenu, type IAppNavSpec } from '@/components/app';

// Employer dashboard chrome — the app-design-system shell wired with the
// employer navigation. Employers discover verified student portfolios.

function Icon({ d }: { d: string }): React.ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const EMPLOYER_NAV: IAppNavSpec[] = [
  {
    label: 'Overview',
    href: '/dashboard/employer',
    icon: <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  },
  {
    label: 'Talent',
    href: '/dashboard/employer/talent',
    icon: <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  },
];

export function EmployerShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  const active = EMPLOYER_NAV.find(
    (n) => pathname === n.href || pathname.startsWith(`${n.href}/`)
  );

  return (
    <AppShell
      nav={EMPLOYER_NAV}
      currentPath={pathname}
      title={active?.label ?? 'Employer'}
      topbarRight={<SessionMenu />}
    >
      {children}
    </AppShell>
  );
}
