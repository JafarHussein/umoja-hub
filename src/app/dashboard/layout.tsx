import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import React from 'react';
import { authOptions } from '@/lib/auth/options';
import { LayoutWrapper } from '@/components/shared/LayoutWrapper';
import type { Role } from '@/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <LayoutWrapper role={session.user.role as Role} firstName={session.user.firstName}>
      {children}
    </LayoutWrapper>
  );
}
