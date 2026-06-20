'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AppShell, Button, type IAppNavSpec } from '@/components/app';

// Lecturer dashboard chrome — the app-design-system shell (AppShell) wired with
// the lecturer navigation. Replaces the legacy LayoutWrapper/Sidebar for the
// LECTURER role (incremental Phase 7 rollout). Mirrors Figma L-01 (86:2).

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

const LECTURER_NAV: IAppNavSpec[] = [
  {
    label: 'Review Queue',
    href: '/dashboard/lecturer/queue',
    icon: <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  },
  {
    label: 'Profile',
    href: '/dashboard/lecturer/profile',
    icon: <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  },
];

export function LecturerShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  // A review workspace (/reviews/*) belongs to the Review Queue for active-state.
  const currentPath = pathname.startsWith('/dashboard/lecturer/reviews')
    ? '/dashboard/lecturer/queue'
    : pathname;
  const active = LECTURER_NAV.find(
    (n) => currentPath === n.href || currentPath.startsWith(`${n.href}/`)
  );

  return (
    <AppShell
      nav={LECTURER_NAV}
      currentPath={currentPath}
      title={active?.label ?? 'Lecturer'}
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
