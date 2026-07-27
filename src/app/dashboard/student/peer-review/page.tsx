'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@/types';
import { Button, buttonVariants } from '@/components/app';

interface IAssignedReview {
  _id: string;
  engagementId: string;
  status: string;
  createdAt: string;
}

type PageState = 'loading' | 'ready' | 'error';

function PageSkeleton(): React.ReactElement {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="skeleton h-7 w-40 rounded" />
      <div className="skeleton h-40 rounded-app-card" />
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Could not load your peer review</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button
          variant="secondary"
          onClick={() => {
            setPageState('loading');
            void fetchAssignment();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="app-h1 text-app-ink">My Review Assignment</h1>

      {review === null ? (
        <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
          <p className="app-body text-app-muted">No review assignment</p>
          <p className="app-meta mt-1 text-app-faint">
            You will be assigned a project to review after another student submits theirs.
          </p>
        </div>
      ) : (
        <div className="space-y-4 rounded-app-card border border-app-hairline bg-app-card p-4">
          <div className="flex items-center justify-between">
            <p className="app-label text-app-muted">Assignment</p>
            <span className="app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2 py-0.5 capitalize text-app-muted">
              {review.status.replace(/_/g, ' ').toLowerCase()}
            </span>
          </div>

          <div className="space-y-0">
            <div className="flex items-center justify-between border-b border-app-hairline py-2.5">
              <span className="app-body text-app-muted">Review ID</span>
              <span className="app-data-m text-app-faint">{review._id}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="app-body text-app-muted">Assigned</span>
              <span className="app-data-m text-app-muted">
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
            className={buttonVariants({ variant: 'primary' })}
          >
            Open review →
          </Link>
        </div>
      )}
    </div>
  );
}
