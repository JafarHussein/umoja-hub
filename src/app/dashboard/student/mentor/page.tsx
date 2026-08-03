'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, ProjectTrack } from '@/types';
import { EmptyState, Page, PageHeader } from '@/components/app';
import { MentorChat } from '@/components/education/MentorChat';
import { loginUrlWithIntent } from '@/lib/auth/intent';

interface IEngagementRef {
  _id: string;
  track: ProjectTrack;
  brief: Record<string, unknown>;
}

type PageState = 'loading' | 'ready' | 'no_engagement' | 'error';

function PageSkeleton(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-app-focus space-y-10">
      <div className="skeleton h-7 w-36 rounded" />
      <div className="skeleton h-[480px] rounded-app-card" />
    </div>
  );
}

export default function MentorPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [engagement, setEngagement] = useState<IEngagementRef | null>(null);

  const fetchEngagement = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/education/engagements/me');
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: IEngagementRef | null };
      if (!body.data) {
        setPageState('no_engagement');
        return;
      }
      setEngagement(body.data);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, []);

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
    return <PageSkeleton />;
  }

  if (pageState === 'error') {
    return (
      <Page width="focus">
        <PageHeader title="AI Mentor" />
        <EmptyState
          title="We could not load your mentor"
          description="Your conversation history is kept on the server and is unaffected — this screen just could not reach it."
          action={{
            label: 'Try again',
            onClick: () => {
              setPageState('loading');
              void fetchEngagement();
            },
          }}
        />
      </Page>
    );
  }

  if (pageState === 'no_engagement' || !engagement) {
    return (
      <Page width="focus">
        <PageHeader title="AI Mentor" />
        <EmptyState
          title="The mentor opens once you have a project"
          description="It is scoped to whatever you are currently building, so it needs a project to talk about. Start one and the mentor will know your brief, your track and where you have got to."
          action={{ label: 'Start a new project', href: '/dashboard/student/projects/new' }}
          hints={[
            {
              label: 'See your projects',
              href: '/dashboard/student',
              description: 'pick up where you left off',
            },
          ]}
        />
      </Page>
    );
  }

  const briefTitle =
    engagement.track === ProjectTrack.AI_BRIEF
      ? ((engagement.brief as { title?: string }).title ?? 'Your project')
      : ((engagement.brief as { repoName?: string }).repoName ?? 'Your project');

  return (
    <Page width="focus">
      <PageHeader
        title="AI Mentor"
        description="Talk through whatever you are stuck on. The mentor asks questions rather than handing you answers — the work stays yours, which is what makes the lecturer's sign-off mean something."
        meta={
          <span className="inline-flex items-center gap-2 rounded-app-pill border border-app-hairline bg-app-sunken px-3 py-1">
            <span className="app-label text-app-muted">AI</span>
            <span className="app-meta text-app-muted">
              Groq Llama 3 · scoped to {briefTitle}
            </span>
          </span>
        }
      />

      <div className="overflow-hidden rounded-app-card border border-app-hairline">
        <MentorChat engagementId={engagement._id} briefTitle={briefTitle} />
      </div>

      <p className="app-meta max-w-app-prose text-app-faint">
        The AI mentor guides your thinking without solving problems for you. It is scoped to your
        current project and maintains conversation history for 30 days.
      </p>
    </Page>
  );
}
