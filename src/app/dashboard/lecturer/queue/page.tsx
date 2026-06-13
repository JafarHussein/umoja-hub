'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, ProjectTrack, StudentTier } from '@/types';
import { Badge } from '@/components/ui/Badge';
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
  studentId: IStudentRef | string;
  createdAt: string;
}

type PageState = 'loading' | 'ready' | 'unverified' | 'error';

function PageSkeleton(): React.ReactElement {
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-surface-secondary rounded-sm animate-pulse" />
          <div className="h-7 w-40 bg-surface-secondary rounded-sm animate-pulse" />
        </div>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-0">
              <div className="space-y-1.5">
                <div className="h-4 w-40 bg-surface-secondary rounded-sm animate-pulse" />
                <div className="h-3 w-24 bg-surface-secondary rounded-sm animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-16 bg-surface-secondary rounded-[2px] animate-pulse" />
                <div className="h-5 w-20 bg-surface-secondary rounded-[2px] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function studentName(studentId: IStudentRef | string): string {
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
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <VerificationLockout
            tone="pending"
            title="Account not yet verified"
            message="An administrator must verify your lecturer account before you can access the review queue."
          />
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-text-secondary">Failed to load review queue.</p>
            <button
              onClick={() => { setPageState('loading'); void fetchQueue(); }}
              className="inline-flex mt-4 text-t5 font-body text-accent-green hover:text-accent-green/80 transition-colors duration-150"
            >
              Retry
            </button>
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
              Lecturer · Review Queue
            </p>
            <h1 className="text-t2 font-heading font-semibold text-text-primary tracking-tight">
              Pending Reviews
            </h1>
          </div>
          <span className="text-t3 font-mono font-semibold text-text-primary tabular-nums">
            {queue.length}
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-text-secondary">No pending reviews</p>
            <p className="text-t5 font-body text-text-disabled mt-1">
              Projects will appear here once students complete peer review.
            </p>
          </div>
        ) : (
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] overflow-hidden">
            {queue.map((item) => (
              <Link
                key={item._id}
                href={`/dashboard/lecturer/reviews/${item._id}`}
                className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-0 hover:bg-surface-secondary transition-colors duration-150"
              >
                <div className="space-y-0.5 min-w-0 mr-4">
                  <p className="text-t5 font-body text-text-primary truncate">
                    {briefTitle(item)}
                  </p>
                  <p className="text-t6 font-body text-text-secondary">
                    {studentName(item.studentId)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="neutral" label={item.tier} />
                  <Badge variant="neutral" label={item.track} />
                  <span className="text-t6 font-mono text-text-disabled tabular-nums ml-2">
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
    </div>
  );
}
