'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import IdentityRecords from '@/components/shared/IdentityRecords';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { Role } from '@/types';

// UI-12 — Lecturer profile: read-only immutable identity records (Q14). The
// department and academic staff ID are captured at onboarding and are
// administrator-correctable only.
export default function LecturerProfilePage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated' && session.user.role !== Role.LECTURER) {
      router.push('/auth/unauthorized');
    }
  }, [status, session, router]);

  if (status !== 'authenticated' || session.user.role !== Role.LECTURER) {
    return <ListSkeleton rows={4} />;
  }

  return <IdentityRecords role={Role.LECTURER} />;
}
