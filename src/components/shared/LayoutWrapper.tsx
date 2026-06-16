'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import type { Role } from '@/types';

export interface ILayoutWrapperProps {
  role: Role;
  firstName: string;
  children: React.ReactNode;
}

export function LayoutWrapper({
  role,
  firstName,
  children,
}: ILayoutWrapperProps): React.ReactElement {
  const currentPath = usePathname();

  async function handleSignOut(): Promise<void> {
    await signOut({ callbackUrl: '/auth/login' });
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar — hidden on mobile, visible md+ */}
      <Sidebar role={role} currentPath={currentPath} />

      {/* Main column: mobile nav + header + scrollable content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile-only top bar (visible below md where sidebar is hidden) */}
        <div className="flex md:hidden items-center justify-between h-12 px-4 border-b border-zinc-800/50 bg-surface shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-sm bg-brand shrink-0" />
            <span className="font-heading text-t5 font-semibold">
              <span className="text-fg">Umoja</span>
              <span className="text-brand">Hub</span>
            </span>
          </div>
          <span className="font-mono text-t6 text-fg-disabled uppercase tracking-widest">
            {role}
          </span>
        </div>
        <Header role={role} firstName={firstName} onSignOut={handleSignOut} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
