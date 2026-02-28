'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { Role, ProjectTrack, StudentTier } from '@/types';

interface IStudentInfo {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  university: string | null;
}

interface IPendingEngagement {
  engagementId: string;
  student: IStudentInfo | null;
  track: ProjectTrack;
  tier: StudentTier;
  status: string;
  briefTitle: string | null;
  githubRepoUrl: string | null;
  submittedAt: string | null;
}

interface IQueueResponse {
  data: IPendingEngagement[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

type PageState = 'loading' | 'ready' | 'error';

const TRACK_LABELS: Record<ProjectTrack, string> = {
  [ProjectTrack.OPEN_SOURCE]: 'Open Source',
  [ProjectTrack.AI_BRIEF]: 'AI Brief',
};

const TIER_COLORS: Record<StudentTier, string> = {
  [StudentTier.BEGINNER]: 'text-text-secondary',
  [StudentTier.INTERMEDIATE]: 'text-accent-green',
  [StudentTier.ADVANCED]: 'text-text-primary',
};

export default function AdminEducationQueuePage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [engagements, setEngagements] = useState<IPendingEngagement[]>([]);
  const [total, setTotal] = useState(0);
  const [pageState, setPageState] = useState<PageState>('loading');

  const fetchQueue = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/admin/education-queue');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = (await res.json()) as IQueueResponse;
      setEngagements(json.data ?? []);
      setTotal(json.total ?? 0);
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
      if (session.user.role !== Role.ADMIN) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchQueue();
    }
  }, [status, session, router, fetchQueue]);

  function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-56 rounded" />
        <ListSkeleton rows={5} />
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-t4 font-body font-medium text-text-primary mb-2">
          Could not load education queue
        </p>
        <p className="text-t5 font-body text-text-secondary mb-4">
          Check your connection and try again.
        </p>
        <Button variant="secondary" onClick={() => void fetchQueue()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-t2 font-heading font-semibold text-text-primary">
          Education review queue
        </h1>
        <p className="text-t5 font-body text-text-secondary mt-0.5">
          {total} project{total !== 1 ? 's' : ''} pending lecturer review
        </p>
      </div>

      {/* Empty state */}
      {engagements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 rounded bg-surface-elevated">
          <div className="w-12 h-12 rounded bg-surface-secondary border border-white/5 flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 8L7 12L17 4"
                stroke="#007F4E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-t4 font-body font-medium text-text-primary mb-1">
            No projects pending review
          </p>
          <p className="text-t5 font-body text-text-secondary">
            Projects move here after passing peer review.
          </p>
        </div>
      ) : (
        <div className="bg-surface-elevated border border-white/5 rounded overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-white/5">
            {['Student', 'Track', 'Tier', 'Brief title', 'Submitted', 'GitHub'].map((h) => (
              <span
                key={h}
                className="text-t6 font-mono text-text-disabled uppercase tracking-widest"
              >
                {h}
              </span>
            ))}
          </div>

          {engagements.map((eng) => (
            <div
              key={eng.engagementId}
              className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-4 border-b border-white/5 last:border-0 items-center"
            >
              {/* Student */}
              <div className="min-w-0">
                <p className="text-t5 font-body font-medium text-text-primary">
                  {eng.student
                    ? `${eng.student.firstName} ${eng.student.lastName}`
                    : 'Unknown student'}
                </p>
                {eng.student?.university && (
                  <p className="text-t6 font-body text-text-disabled truncate">
                    {eng.student.university}
                  </p>
                )}
              </div>

              {/* Track */}
              <span className="text-t6 font-mono text-text-secondary">
                {TRACK_LABELS[eng.track]}
              </span>

              {/* Tier */}
              <span className={`text-t6 font-mono font-medium ${TIER_COLORS[eng.tier]}`}>
                {eng.tier}
              </span>

              {/* Brief title */}
              <span className="text-t5 font-body text-text-secondary max-w-[180px] truncate">
                {eng.briefTitle ?? '—'}
              </span>

              {/* Submitted */}
              <span className="text-t6 font-body text-text-disabled">
                {formatDate(eng.submittedAt)}
              </span>

              {/* GitHub */}
              {eng.githubRepoUrl ? (
                <a
                  href={eng.githubRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-t6 font-body text-accent-green hover:underline underline-offset-2"
                >
                  View repo
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path
                      d="M1.5 8.5L8.5 1.5M8.5 1.5H5M8.5 1.5V5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              ) : (
                <span className="text-t6 font-body text-text-disabled">—</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Context note */}
      <div className="bg-surface-elevated border border-white/5 rounded p-4">
        <p className="text-t6 font-body text-text-disabled">
          Projects in this queue have completed peer review and are awaiting assessment by a
          registered lecturer. Lecturers access their review queue at{' '}
          <span className="font-mono text-text-secondary">/dashboard/lecturer/reviews/pending</span>.
        </p>
      </div>
    </div>
  );
}
