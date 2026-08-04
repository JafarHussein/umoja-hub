'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { EmptyState, Page, PageHeader } from '@/components/app';
import { Role } from '@/types';
import { loginUrlWithIntent } from '@/lib/auth/intent';

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
      router.push(loginUrlWithIntent());
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
      <Page width="focus">
        <div className="skeleton h-8 w-44 rounded" />
        <div className="skeleton h-56 rounded-app-card" />
      </Page>
    );
  }

  return (
    <Page width="focus">
      <PageHeader
        title="My Projects"
        description="A project is one piece of real software, built against the theory you are being taught and reviewed by a lecturer as an engineer would review it."
      />

      <EmptyState
        title="Turn what you are studying into something that runs"
        description="Start a project, build the thing, and submit it for review. A lecturer reads your work and gives you written engineering feedback — on the architecture and the code, not just the report."
        action={{ label: 'Start a new project', href: '/dashboard/student/projects/new' }}
        hints={[
          {
            label: 'Find a mentor',
            href: '/dashboard/student/mentor',
            description: 'ask a lecturer before you are stuck',
          },
          {
            label: 'Review a peer',
            href: '/dashboard/student/peer-review',
            description: 'reading other people’s work sharpens your own',
          },
        ]}
      />
    </Page>
  );
}
