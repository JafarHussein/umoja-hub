'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppShell, SessionMenu, type IAppNavSpec } from '@/components/app';

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
    label: 'Reports to Review',
    href: '/dashboard/lecturer/reports',
    icon: <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  },
  {
    label: 'Projects You Set',
    href: '/dashboard/lecturer/projects',
    icon: <Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  },
  {
    label: 'Demonstrations',
    href: '/dashboard/lecturer/demonstrations',
    icon: <Icon d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />,
  },
  {
    label: 'Availability',
    href: '/dashboard/lecturer/availability',
    icon: <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    label: 'Profile',
    href: '/dashboard/lecturer/profile',
    icon: <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  },
];

export function LecturerShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  // A report workspace (/reports/*) belongs to Reports to Review for active-state.
  const currentPath = pathname.startsWith('/dashboard/lecturer/reports')
    ? '/dashboard/lecturer/reports'
    : pathname;
  const active = LECTURER_NAV.find(
    (n) => currentPath === n.href || currentPath.startsWith(`${n.href}/`)
  );

  return (
    <AppShell
      nav={LECTURER_NAV}
      currentPath={currentPath}
      title={active?.label ?? 'Lecturer'}
      topbarRight={<SessionMenu />}
    >
      {children}
    </AppShell>
  );
}
