import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import React from 'react';
import { authOptions } from '@/lib/auth/options';
import { LayoutWrapper } from '@/components/shared/LayoutWrapper';
import { FarmerShell } from './farmer/_components/FarmerShell';
import { Role } from '@/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  // Incremental Phase 7 rollout: the FARMER role uses the new app-design-system
  // shell; the other roles keep the legacy shell until they are migrated.
  if (session.user.role === Role.FARMER) {
    return <FarmerShell>{children}</FarmerShell>;
  }

  return (
    <LayoutWrapper role={session.user.role as Role} firstName={session.user.firstName}>
      {children}
    </LayoutWrapper>
  );
}
