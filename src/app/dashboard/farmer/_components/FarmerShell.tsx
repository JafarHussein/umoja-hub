'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AppShell, Button, type IAppNavSpec } from '@/components/app';

// Farmer dashboard chrome — the app-design-system shell (AppShell) wired with
// the farmer navigation. Replaces the legacy LayoutWrapper/Sidebar for the
// FARMER role only (incremental Phase 7 rollout). Mirrors Figma F-01 (213:2).

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

const FARMER_NAV: IAppNavSpec[] = [
  {
    label: 'Listings',
    href: '/dashboard/farmer/listings',
    icon: <Icon d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8L6 7h12l-2-4z" />,
  },
  {
    label: 'Orders',
    href: '/dashboard/farmer/orders',
    icon: <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  },
  {
    label: 'Settlement',
    href: '/dashboard/farmer/ledger',
    icon: <Icon d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  },
  {
    label: 'Farm Assistant',
    href: '/dashboard/farmer/assistant',
    icon: <Icon d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
  },
  {
    label: 'Price Intelligence',
    href: '/dashboard/farmer/prices',
    icon: <Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  },
  {
    label: 'Group Tools',
    href: '/dashboard/farmer/group',
    icon: <Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  },
  {
    label: 'Suppliers',
    href: '/dashboard/farmer/suppliers',
    icon: <Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  },
  {
    label: 'Profile',
    href: '/dashboard/farmer/profile',
    icon: <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  },
];

export function FarmerShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  const active = FARMER_NAV.find(
    (n) => pathname === n.href || pathname.startsWith(`${n.href}/`)
  );

  return (
    <AppShell
      nav={FARMER_NAV}
      currentPath={pathname}
      title={active?.label ?? 'Farmer'}
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
