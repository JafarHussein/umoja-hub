import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import React from 'react';
import { authOptions } from '@/lib/auth/options';
import { LayoutWrapper } from '@/components/shared/LayoutWrapper';
import { FarmerShell } from './farmer/_components/FarmerShell';
import { BuyerShell } from './buyer/_components/BuyerShell';
import { StudentShell } from './student/_components/StudentShell';
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

  // Incremental Phase 7 rollout: the FARMER, BUYER, and STUDENT roles use the
  // new app-design-system shell; the other roles keep the legacy shell until
  // they are migrated.
  if (session.user.role === Role.FARMER) {
    return <FarmerShell>{children}</FarmerShell>;
  }

  if (session.user.role === Role.BUYER) {
    return <BuyerShell>{children}</BuyerShell>;
  }

  if (session.user.role === Role.STUDENT) {
    return <StudentShell>{children}</StudentShell>;
  }

  return (
    <LayoutWrapper role={session.user.role as Role} firstName={session.user.firstName}>
      {children}
    </LayoutWrapper>
  );
}
