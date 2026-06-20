import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import React from 'react';
import { authOptions } from '@/lib/auth/options';
import { LayoutWrapper } from '@/components/shared/LayoutWrapper';
import { FarmerShell } from './farmer/_components/FarmerShell';
import { BuyerShell } from './buyer/_components/BuyerShell';
import { StudentShell } from './student/_components/StudentShell';
import { LecturerShell } from './lecturer/_components/LecturerShell';
import { AdminShell } from './admin/_components/AdminShell';
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

  // Phase 7 rollout complete: every role uses the new app-design-system shell.
  if (session.user.role === Role.FARMER) {
    return <FarmerShell>{children}</FarmerShell>;
  }

  if (session.user.role === Role.BUYER) {
    return <BuyerShell>{children}</BuyerShell>;
  }

  if (session.user.role === Role.STUDENT) {
    return <StudentShell>{children}</StudentShell>;
  }

  if (session.user.role === Role.LECTURER) {
    return <LecturerShell>{children}</LecturerShell>;
  }

  if (session.user.role === Role.ADMIN) {
    return <AdminShell>{children}</AdminShell>;
  }

  return (
    <LayoutWrapper role={session.user.role as unknown as Role} firstName={session.user.firstName}>
      {children}
    </LayoutWrapper>
  );
}
