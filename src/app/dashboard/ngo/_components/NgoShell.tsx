'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AppShell, Button, type IAppNavSpec } from '@/components/app';

// NGO dashboard chrome — the app-design-system shell wired with the NGO
// navigation. NGOs sponsor farmer cooperatives; this surface lets them see the
// cooperatives and farmers their support reaches.

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

const NGO_NAV: IAppNavSpec[] = [
  {
    label: 'Cooperatives',
    href: '/dashboard/ngo',
    icon: <Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  },
];

export function NgoShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  const active = NGO_NAV.find(
    (n) => pathname === n.href || pathname.startsWith(`${n.href}/`)
  );

  return (
    <AppShell
      nav={NGO_NAV}
      currentPath={pathname}
      title={active?.label ?? 'NGO'}
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
