'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, ProjectTrack } from '@/types';
import { Button } from '@/components/app';
import { MentorChat } from '@/components/education/MentorChat';

interface IEngagementRef {
  _id: string;
  track: ProjectTrack;
  brief: Record<string, unknown>;
}

type PageState = 'loading' | 'ready' | 'no_engagement' | 'error';

function PageSkeleton(): React.ReactElement {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
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
    return <PageSkeleton />;
  }

  if (pageState === 'error') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Could not load your mentor</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button
          variant="secondary"
          onClick={() => {
            setPageState('loading');
            void fetchEngagement();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (pageState === 'no_engagement' || !engagement) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="app-h1 text-app-ink">AI Mentor</h1>
        <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
          <p className="app-body text-app-muted">No active project</p>
          <p className="app-meta mt-1 text-app-faint">Start a project to unlock the AI mentor.</p>
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

  const briefTitle =
    engagement.track === ProjectTrack.AI_BRIEF
      ? ((engagement.brief as { title?: string }).title ?? 'Your project')
      : ((engagement.brief as { repoName?: string }).repoName ?? 'Your project');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="app-h1 text-app-ink">AI Mentor</h1>

      <div className="inline-flex items-center gap-2 rounded-app-pill border border-app-hairline bg-app-sunken px-3 py-1">
        <span className="app-label text-app-muted">AI</span>
        <span className="app-meta text-app-muted">
          Groq Llama 3 · Socratic guidance · Engagement-scoped
        </span>
      </div>

      <div className="overflow-hidden rounded-app-card border border-app-hairline">
        <MentorChat engagementId={engagement._id} briefTitle={briefTitle} />
      </div>

      <p className="app-meta text-app-faint">
        The AI mentor guides your thinking without solving problems for you. It is scoped to your
        current project and maintains conversation history for 30 days.
      </p>
    </div>
  );
}
