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
    <div className="flex h-screen bg-surface-primary overflow-hidden">
      {/* Fixed sidebar */}
      <Sidebar role={role} currentPath={currentPath} />

      {/* Main column: header + scrollable content */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header role={role} firstName={firstName} onSignOut={handleSignOut} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
