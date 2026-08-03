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
        description="A project is one piece of real work, reviewed by a lecturer and signed off. Finished projects become your public portfolio — the thing an employer can check rather than take on trust."
      />

      <EmptyState
        title="Your first project starts your verified portfolio"
        description="Pick a brief, build the thing, and submit it for review. A lecturer gives you written feedback and, once it passes, the project is published to your portfolio with their verification attached."
        action={{ label: 'Start a new project', href: '/dashboard/student/projects/new' }}
        hints={[
          {
            label: 'See your portfolio',
            href: '/dashboard/student/portfolio',
            description: 'what employers see when they look you up',
          },
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
