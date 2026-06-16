'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface IAssignedReview {
  _id: string;
  engagementId: string;
  status: string;
  createdAt: string;
}

type PageState = 'loading' | 'ready' | 'error';

function PageSkeleton(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-surface-raised rounded-sm animate-pulse" />
          <div className="h-7 w-40 bg-surface-raised rounded-sm animate-pulse" />
        </div>
        <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-6 space-y-3">
          <div className="h-4 w-32 bg-surface-raised rounded-sm animate-pulse" />
          <div className="h-4 w-56 bg-surface-raised rounded-sm animate-pulse" />
          <div className="h-9 w-28 bg-surface-raised rounded-sm animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function PeerReviewAssignmentPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [review, setReview] = useState<IAssignedReview | null>(null);

  const fetchAssignment = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/peer-reviews/assigned');
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: IAssignedReview | null };
      setReview(body.data);
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
      void fetchAssignment();
    }
  }, [status, session, router, fetchAssignment]);

  if (status === 'loading' || pageState === 'loading') {
    return <PageSkeleton />;
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-fg-muted">Failed to load peer review assignment.</p>
            <button
              onClick={() => { setPageState('loading'); void fetchAssignment(); }}
              className="inline-flex mt-4 text-t5 font-body text-brand hover:text-brand/80 transition-colors duration-150"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest mb-1">
            Student · Peer Review
          </p>
          <h1 className="text-t2 font-heading font-semibold text-fg tracking-tight">
            My Review Assignment
          </h1>
        </div>

        {review === null ? (
          <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-fg-muted">No review assignment</p>
            <p className="text-t5 font-body text-fg-disabled mt-1">
              You will be assigned a project to review after another student submits theirs.
            </p>
          </div>
        ) : (
          <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest">
                Assignment
              </p>
              <Badge label={review.status} />
            </div>

            <div className="space-y-0">
              <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
                <span className="text-t5 font-body text-fg-muted">Review ID</span>
                <span className="text-t6 font-mono text-fg-disabled">{review._id}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-t5 font-body text-fg-muted">Assigned</span>
                <span className="text-t5 font-mono text-fg-muted tabular-nums">
                  {new Date(review.createdAt).toLocaleDateString('en-KE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <Link
              href={`/dashboard/student/peer-review/${review._id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-fg rounded-sm font-body text-t5 hover:opacity-90 transition-all duration-150 min-h-[44px]"
            >
              Open review →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
