'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import IdentityRecords from '@/components/shared/IdentityRecords';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { Role } from '@/types';

// UI-12 — Student profile: read-only immutable identity records (Q14). The
// GitHub username is OAuth-sourced and the institutional fields come from the
// onboarding funnel; neither is editable here.
export default function StudentProfilePage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated' && session.user.role !== Role.STUDENT) {
      router.push('/auth/unauthorized');
    }
  }, [status, session, router]);

  if (status !== 'authenticated' || session.user.role !== Role.STUDENT) {
    return <ListSkeleton rows={4} />;
  }

  return <IdentityRecords role={Role.STUDENT} />;
}
