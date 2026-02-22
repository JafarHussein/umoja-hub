import React from 'react';
import Link from 'next/link';
import { Role } from '@/types';

export interface ISidebarProps {
  role: Role;
  currentPath: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactElement;
}

function NavIcon({ d }: { d: string }): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const navByRole: Record<Role, NavItem[]> = {
  [Role.FARMER]: [
    { label: 'Listings', href: '/dashboard/farmer/listings', icon: <NavIcon d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3H8L6 7h12l-2-4z" /> },
    { label: 'Orders', href: '/dashboard/farmer/orders', icon: <NavIcon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
    { label: 'Farm Assistant', href: '/dashboard/farmer/assistant', icon: <NavIcon d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /> },
    { label: 'Price Intelligence', href: '/dashboard/farmer/prices', icon: <NavIcon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
    { label: 'Group Tools', href: '/dashboard/farmer/group', icon: <NavIcon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
  ],
  [Role.BUYER]: [
    { label: 'Marketplace', href: '/marketplace', icon: <NavIcon d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /> },
    { label: 'My Orders', href: '/dashboard/buyer/orders', icon: <NavIcon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
    { label: 'Knowledge Hub', href: '/knowledge', icon: <NavIcon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.331.477-4.5 1.253" /> },
  ],
  [Role.STUDENT]: [
    { label: 'My Projects', href: '/dashboard/student/projects/new', icon: <NavIcon d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /> },
    { label: 'Portfolio', href: '/dashboard/student/portfolio', icon: <NavIcon d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
    { label: 'Peer Reviews', href: '/dashboard/student/peer-review', icon: <NavIcon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { label: 'Profile', href: '/dashboard/student/profile', icon: <NavIcon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
  ],
  [Role.LECTURER]: [
    { label: 'Review Queue', href: '/dashboard/lecturer/reviews/pending', icon: <NavIcon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> },
  ],
  [Role.ADMIN]: [
    { label: 'Farmer Verification', href: '/dashboard/admin/verification-queue', icon: <NavIcon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
    { label: 'Supplier Verification', href: '/dashboard/admin/supplier-verification', icon: <NavIcon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> },
    { label: 'Knowledge Hub CMS', href: '/dashboard/admin/knowledge', icon: <NavIcon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
    { label: 'Impact Summary', href: '/dashboard/admin/impact-summary', icon: <NavIcon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
  ],
};

export function Sidebar({ role, currentPath }: ISidebarProps): React.ReactElement {
  const navItems = navByRole[role] ?? [];

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-surface-elevated border-r border-white/5 shrink-0">
      {/* Wordmark */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-white/5 shrink-0">
        <div className="h-5 w-5 rounded-sm bg-accent-green shrink-0" />
        <span className="font-heading text-t4 font-semibold">
          <span className="text-text-primary">Umoja</span>
          <span className="text-accent-green">Hub</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5" aria-label="Dashboard navigation">
        {navItems.map((item) => {
          const isActive =
            currentPath === item.href || currentPath.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-3 min-h-[44px] rounded-sm font-body text-t5',
                'transition-all duration-150',
                isActive
                  ? 'bg-surface-secondary text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary/50',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={isActive ? 'text-accent-green' : 'text-text-disabled'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Role chip at bottom */}
      <div className="px-4 py-3 border-t border-white/5">
        <span className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
          {role}
        </span>
      </div>
    </aside>
  );
}
