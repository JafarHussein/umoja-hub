'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppShell, SessionMenu, type IAppNavSpec } from '@/components/app';

// Student dashboard chrome — the app-design-system shell (AppShell) wired with
// the student navigation. Replaces the legacy LayoutWrapper/Sidebar for the
// STUDENT role (incremental Phase 7 rollout). Mirrors Figma S-01 (65:2).

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

const STUDENT_NAV: IAppNavSpec[] = [
  {
    label: 'My Project',
    href: '/dashboard/student',
    exact: true,
    icon: <Icon d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />,
  },
  {
    label: 'Peer Review',
    href: '/dashboard/student/peer-review',
    icon: <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  {
    label: 'AI Mentor',
    href: '/dashboard/student/mentor',
    icon: <Icon d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
  },
  {
    label: 'Portfolio',
    href: '/dashboard/student/portfolio',
    icon: <Icon d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
  },
  {
    label: 'Profile',
    href: '/dashboard/student/profile',
    icon: <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  },
];

export function StudentShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  // "My Project" (exact-matched root) also owns the deeper project routes, so
  // normalise /projects/* back to the root for active-state + title.
  const currentPath = pathname.startsWith('/dashboard/student/projects')
    ? '/dashboard/student'
    : pathname;
  const active = STUDENT_NAV.find((n) =>
    n.exact ? currentPath === n.href : currentPath === n.href || currentPath.startsWith(`${n.href}/`)
  );

  return (
    <AppShell
      nav={STUDENT_NAV}
      currentPath={currentPath}
      title={active?.label ?? 'Student'}
      topbarRight={<SessionMenu />}
    >
      {children}
    </AppShell>
  );
}
