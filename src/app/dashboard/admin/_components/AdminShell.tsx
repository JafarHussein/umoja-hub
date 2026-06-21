'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AppShell, Button, type IAppNavSpec } from '@/components/app';

// Admin dashboard chrome — the app-design-system shell (AppShell) wired with the
// admin navigation. Replaces the legacy LayoutWrapper/Sidebar for the ADMIN role
// (incremental Phase 7 rollout). Mirrors Figma A-01 (93:2).

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

const ADMIN_NAV: IAppNavSpec[] = [
  {
    label: 'Farmer Verification',
    href: '/dashboard/admin/verification-queue',
    icon: (
      <Icon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    ),
  },
  {
    label: 'Supplier Verification',
    href: '/dashboard/admin/supplier-verification',
    icon: (
      <Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
  },
  {
    label: 'Lecturer Verify',
    href: '/dashboard/admin/lecturer-verification',
    icon: (
      <Icon d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    ),
  },
  {
    label: 'Payouts',
    href: '/dashboard/admin/payouts',
    icon: (
      <Icon d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    ),
  },
  {
    label: 'Escrow',
    href: '/dashboard/admin/escrow',
    icon: (
      <Icon d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    ),
  },
  {
    label: 'Mediation',
    href: '/dashboard/admin/mediation',
    icon: (
      <Icon d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    ),
  },
  {
    label: 'Group Tokens',
    href: '/dashboard/admin/group-tokens',
    icon: (
      <Icon d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    ),
  },
  {
    label: 'Payment Lab',
    href: '/dashboard/admin/payment-lab',
    icon: (
      <Icon d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 7h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" />
    ),
  },
  {
    label: 'Brief Contexts',
    href: '/dashboard/admin/brief-contexts',
    icon: (
      <Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.331.477-4.5 1.253" />
    ),
  },
  {
    label: 'Knowledge Hub CMS',
    href: '/dashboard/admin/knowledge',
    icon: (
      <Icon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    ),
  },
  {
    label: 'Impact Summary',
    href: '/dashboard/admin/impact-summary',
    icon: (
      <Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
  },
];

export function AdminShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  // Detail routes belong to their parent queue for active-state + title: a
  // farmer detail highlights Farmer Verification, a supplier detail highlights
  // Supplier Verification.
  let currentPath = pathname;
  if (pathname.startsWith('/dashboard/admin/farmer/')) {
    currentPath = '/dashboard/admin/verification-queue';
  } else if (pathname.startsWith('/dashboard/admin/supplier/')) {
    currentPath = '/dashboard/admin/supplier-verification';
  }
  const active = ADMIN_NAV.find(
    (n) => currentPath === n.href || currentPath.startsWith(`${n.href}/`)
  );

  return (
    <AppShell
      nav={ADMIN_NAV}
      currentPath={currentPath}
      title={active?.label ?? 'Admin'}
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
