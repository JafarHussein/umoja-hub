'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, ProjectTrack } from '@/types';
import { MentorChat } from '@/components/education/MentorChat';

interface IEngagementRef {
  _id: string;
  track: ProjectTrack;
  brief: Record<string, unknown>;
}

type PageState = 'loading' | 'ready' | 'no_engagement' | 'error';

function PageSkeleton(): React.ReactElement {
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-1.5">
          <div className="h-3 w-20 bg-surface-secondary rounded-sm animate-pulse" />
          <div className="h-7 w-36 bg-surface-secondary rounded-sm animate-pulse" />
        </div>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800/50 space-y-2">
            <div className="h-5 w-24 bg-surface-secondary rounded-sm animate-pulse" />
            <div className="h-3 w-48 bg-surface-secondary rounded-sm animate-pulse" />
          </div>
          <div className="p-6 space-y-4 min-h-[400px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="h-12 rounded-sm bg-surface-secondary animate-pulse"
                  style={{ width: `${40 + i * 15}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
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
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-text-secondary">Failed to load mentor.</p>
            <button
              onClick={() => { setPageState('loading'); void fetchEngagement(); }}
              className="inline-flex mt-4 text-t5 font-body text-accent-green hover:text-accent-green/80 transition-colors duration-150"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'no_engagement' || !engagement) {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div>
            <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
              Student · AI Mentor
            </p>
            <h1 className="text-t2 font-heading font-semibold text-text-primary tracking-tight">
              AI Mentor
            </h1>
          </div>
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-text-secondary">No active project</p>
            <p className="text-t5 font-body text-text-disabled mt-1">
              Start a project to unlock the AI mentor.
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

  const briefTitle =
    engagement.track === ProjectTrack.AI_BRIEF
      ? ((engagement.brief as { title?: string }).title ?? 'Your project')
      : ((engagement.brief as { repoName?: string }).repoName ?? 'Your project');

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
            Student · AI Mentor
          </p>
          <h1 className="text-t2 font-heading font-semibold text-text-primary tracking-tight">
            AI Mentor
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-secondary border border-zinc-800/50 rounded-sm">
          <span className="font-mono text-t6 text-text-disabled">AI</span>
          <span className="font-body text-t6 text-text-disabled">
            Groq Llama 3 · Socratic guidance · Engagement-scoped
          </span>
        </div>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] overflow-hidden">
          <MentorChat engagementId={engagement._id} briefTitle={briefTitle} />
        </div>

        <p className="font-body text-t6 text-text-disabled">
          The AI mentor guides your thinking without solving problems for you. It is scoped to your current project and maintains conversation history for 30 days.
        </p>
      </div>
    </div>
  );
}
