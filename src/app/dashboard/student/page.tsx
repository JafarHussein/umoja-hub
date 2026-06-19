'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@/types';

type PageState = 'loading' | 'ready';

interface IEngagementRef {
  _id: string;
}

export default function StudentDashboardPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');

  const fetchEngagement = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/education/engagements/me');
      if (!res.ok) {
        setPageState('ready');
        return;
      }
      const body = (await res.json()) as { data: IEngagementRef | null };
      if (body.data !== null) {
        router.push(`/dashboard/student/projects/${body.data._id}`);
        return;
      }
      setPageState('ready');
    } catch {
      setPageState('ready');
    }
  }, [router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      if (session.user.role !== Role.STUDENT) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchEngagement();
    }
  }, [status, session, router, fetchEngagement]);

  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="space-y-1.5">
          <div className="skeleton h-7 w-36 rounded" />
        </div>
        <div className="skeleton h-44 rounded-app-card" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="app-h1 text-app-ink">My Projects</h1>

      <div className="rounded-app-card border border-app-hairline bg-app-card p-10 text-center">
        <p className="app-body text-app-muted">No active project</p>
        <p className="app-meta mt-1 text-app-faint">
          Create a project to begin your verified portfolio.
        </p>
        <Link
          href="/dashboard/student/projects/new"
          className="app-body mt-4 inline-flex text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
        >
          Start new project →
        </Link>
      </div>
    </div>
  );
}
