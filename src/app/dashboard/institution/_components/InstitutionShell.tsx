'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AppShell, Button, type IAppNavSpec } from '@/components/app';

// Institution dashboard chrome — the app-design-system shell wired with the
// institution navigation. Institutions host students and lecturers.

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

const INSTITUTION_NAV: IAppNavSpec[] = [
  {
    label: 'Members',
    href: '/dashboard/institution',
    icon: <Icon d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />,
  },
];

export function InstitutionShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  const active = INSTITUTION_NAV.find(
    (n) => pathname === n.href || pathname.startsWith(`${n.href}/`)
  );

  return (
    <AppShell
      nav={INSTITUTION_NAV}
      currentPath={pathname}
      title={active?.label ?? 'Institution'}
      topbarRight={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void signOut({ callbackUrl: '/auth/login' })}
        >
          Sign out
        </Button>
      }
    >
      {children}
    </AppShell>
  );
}
