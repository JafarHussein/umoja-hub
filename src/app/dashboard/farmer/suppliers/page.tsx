'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SupplierDirectory from '@/components/foodhub/SupplierDirectory';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { Role } from '@/types';

// UI-11 — Verified supplier directory (read-only) in the farmer hub. Farmers
// browse suppliers to coordinate cooperative group input orders off-platform.
export default function FarmerSuppliersPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated' && session.user.role !== Role.FARMER) {
      router.push('/auth/unauthorized');
    }
  }, [status, session, router]);

  if (status !== 'authenticated' || session.user.role !== Role.FARMER) {
    return <ListSkeleton rows={4} />;
  }

  return <SupplierDirectory />;
}
