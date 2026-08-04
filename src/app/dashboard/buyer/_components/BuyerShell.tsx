'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppShell, SessionMenu, type IAppNavSpec } from '@/components/app';

// Buyer dashboard chrome — the app-design-system shell (AppShell) wired with the
// buyer navigation. Replaces the legacy LayoutWrapper/Sidebar for the BUYER role
// (incremental Phase 7 rollout). Mirrors Figma B-01 (47:2). Marketplace and
// Knowledge Hub link out to their own top-level layouts.

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

const BUYER_NAV: IAppNavSpec[] = [
  {
    label: 'Marketplace',
    href: '/marketplace',
    icon: <Icon d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
  },
  {
    label: 'My Orders',
    href: '/dashboard/buyer/orders',
    icon: <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  },
  {
    label: 'Suppliers',
    href: '/dashboard/buyer/suppliers',
    icon: <Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  },
  {
    label: 'Knowledge Hub',
    href: '/knowledge',
    icon: <Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.331.477-4.5 1.253" />,
  },
];

export function BuyerShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  const active = BUYER_NAV.find(
    (n) => pathname === n.href || pathname.startsWith(`${n.href}/`)
  );

  return (
    <AppShell
      nav={BUYER_NAV}
      currentPath={pathname}
      title={active?.label ?? 'Buyer'}
      topbarRight={<SessionMenu />}
    >
      {children}
    </AppShell>
  );
}
