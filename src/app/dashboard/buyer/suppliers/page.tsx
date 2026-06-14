'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SupplierDirectory from '@/components/foodhub/SupplierDirectory';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { Role } from '@/types';

// UI-11 — Verified supplier directory (read-only) in the buyer hub. Buyers see
// which input suppliers the platform has credential-verified.
export default function BuyerSuppliersPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated' && session.user.role !== Role.BUYER) {
      router.push('/auth/unauthorized');
    }
  }, [status, session, router]);

  if (status !== 'authenticated' || session.user.role !== Role.BUYER) {
    return <ListSkeleton rows={4} />;
  }

  return <SupplierDirectory />;
}
