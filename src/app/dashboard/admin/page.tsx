'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// The admin dashboard has no distinct landing surface; the verification queue is
// the default workspace. Redirect the role root there.
export default function AdminDashboardPage(): null {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/admin/verification-queue');
  }, [router]);
  return null;
}
