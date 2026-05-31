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
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="space-y-1.5">
            <div className="h-3 w-20 bg-surface-secondary rounded-sm animate-pulse" />
            <div className="h-7 w-36 bg-surface-secondary rounded-sm animate-pulse" />
          </div>
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-10 space-y-3 flex flex-col items-center">
            <div className="h-4 w-40 bg-surface-secondary rounded-sm animate-pulse" />
            <div className="h-4 w-64 bg-surface-secondary rounded-sm animate-pulse" />
            <div className="h-9 w-32 bg-surface-secondary rounded-sm animate-pulse mt-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
              Student · Dashboard
            </p>
            <h1 className="text-t2 font-heading font-semibold text-text-primary tracking-tight">
              My Projects
            </h1>
          </div>
        </div>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-10 text-center">
          <p className="text-t4 font-body text-text-secondary">No active project</p>
          <p className="text-t5 font-body text-text-disabled mt-1">
            Create a project to begin your verified portfolio.
          </p>
          <Link
            href="/dashboard/student/projects/new"
            className="inline-flex mt-4 text-t5 font-body text-accent-green hover:text-accent-green/80 transition-colors duration-150"
          >
            Start new project →
          </Link>
        </div>
      </div>
    </div>
  );
}
