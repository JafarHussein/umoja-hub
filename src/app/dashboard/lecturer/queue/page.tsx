'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, ProjectTrack, StudentTier } from '@/types';
import { Button } from '@/components/app';
import { VerificationLockout } from '@/components/shared/VerificationLockout';

interface IStudentRef {
  firstName?: string;
  lastName?: string;
}

interface IQueueItem {
  _id: string;
  track: ProjectTrack;
  tier: StudentTier;
  brief: Record<string, unknown>;
  studentId: IStudentRef | string | null;
  createdAt: string;
}

type PageState = 'loading' | 'ready' | 'unverified' | 'error';

function PageSkeleton(): React.ReactElement {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="skeleton h-7 w-40 rounded" />
      <div className="skeleton h-64 rounded-app-card" />
    </div>
  );
}

function studentName(studentId: IStudentRef | string | null | undefined): string {
  if (!studentId) return 'Unknown student';
  if (typeof studentId === 'string') return studentId.slice(-6);
  const { firstName = '', lastName = '' } = studentId;
  const full = `${firstName} ${lastName}`.trim();
  return full || 'Unknown student';
}

function briefTitle(item: IQueueItem): string {
  if (item.track === ProjectTrack.AI_BRIEF) {
    return (item.brief as { title?: string }).title ?? 'AI Brief';
  }
  return (item.brief as { repoName?: string }).repoName ?? 'Open Source';
}

export default function LecturerQueuePage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [queue, setQueue] = useState<IQueueItem[]>([]);

  const fetchQueue = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/lecturer/queue');
      if (res.status === 403) {
        setPageState('unverified');
        return;
      }
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: IQueueItem[] };
      setQueue(body.data);
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
      if (session.user.role !== Role.LECTURER) {
        router.push('/auth/unauthorized');
        return;
      }
      // The isVerified JWT claim is authoritative: an unverified lecturer is
      // locked out without an API round-trip (the queue API also 403s as a
      // defensive fallback, handled in fetchQueue).
      if (!session.user.isVerified) {
        setPageState('unverified');
        return;
      }
      void fetchQueue();
    }
  }, [status, session, router, fetchQueue]);

  if (status === 'loading' || pageState === 'loading') {
    return <PageSkeleton />;
  }

  if (pageState === 'unverified') {
    return (
      <div className="max-w-4xl">
        <VerificationLockout
          tone="pending"
          title="Account not yet verified"
          message="An administrator must verify your lecturer account before you can access the review queue."
        />
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Failed to load review queue</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button
          variant="secondary"
          onClick={() => {
            setPageState('loading');
            void fetchQueue();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="app-h1 text-app-ink">Pending Reviews</h1>
        <span className="app-data-l text-app-ink">{queue.length}</span>
      </div>

      {queue.length === 0 ? (
        <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
          <p className="app-body text-app-muted">No pending reviews</p>
          <p className="app-meta mt-1 text-app-faint">
            Projects will appear here once students complete peer review.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
          {queue.map((item) => (
            <Link
              key={item._id}
              href={`/dashboard/lecturer/reviews/${item._id}`}
              className="flex items-center justify-between border-b border-app-hairline px-4 py-3 transition-colors duration-150 last:border-0 hover:bg-app-sunken"
            >
              <div className="mr-4 min-w-0 space-y-0.5">
                <p className="app-body-strong truncate text-app-ink">{briefTitle(item)}</p>
                <p className="app-meta text-app-muted">{studentName(item.studentId)}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <span className="app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2 py-0.5 capitalize text-app-muted">
                  {item.tier.replace(/_/g, ' ').toLowerCase()}
                </span>
                <span className="app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2 py-0.5 capitalize text-app-muted">
                  {item.track.replace(/_/g, ' ').toLowerCase()}
                </span>
                <span className="app-meta ml-2 font-app-mono text-app-faint">
                  {new Date(item.createdAt).toLocaleDateString('en-KE', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
