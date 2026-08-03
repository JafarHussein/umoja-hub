'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@/types';
import { loginUrlWithIntent } from '@/lib/auth/intent';
import {
  Card,
  DataItem,
  DataList,
  EmptyState,
  Page,
  PageHeader,
  buttonVariants,
} from '@/components/app';

interface IAssignedReview {
  _id: string;
  engagementId: string;
  status: string;
  createdAt: string;
}

type PageState = 'loading' | 'ready' | 'error';

function PageSkeleton(): React.ReactElement {
  return (
    <Page width="focus">
      <div className="skeleton h-8 w-52 rounded" />
      <div className="skeleton h-48 rounded-app-card" />
    </Page>
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
      router.push(loginUrlWithIntent());
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
      <Page width="focus">
        <PageHeader title="My Review Assignment" />
        <EmptyState
          title="We could not load your peer review"
          description="Any review you have already written is saved — this screen just could not reach your assignment."
          action={{
            label: 'Try again',
            onClick: () => {
              setPageState('loading');
              void fetchAssignment();
            },
          }}
        />
      </Page>
    );
  }

  return (
    <Page width="focus">
      <PageHeader
        title="My Review Assignment"
        description="Every submitted project is read by another student before a lecturer sees it. Reviewing someone else's work is part of the course, not a favour — and it is the fastest way to spot the same mistakes in your own."
      />

      {review === null ? (
        <EmptyState
          title="You have nothing to review right now"
          description="A project is assigned to you once another student submits theirs. Nothing is required of you until then — we will let you know when one arrives."
          hints={[
            {
              label: 'Work on your own project',
              href: '/dashboard/student',
              description: 'submitting yours puts you in the queue',
            },
          ]}
        />
      ) : (
        <Card pad="generous" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <p className="app-label text-app-muted">Assignment</p>
            <span className="app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2.5 py-1 capitalize text-app-muted">
              {review.status.replace(/_/g, ' ').toLowerCase()}
            </span>
          </div>

          <DataList>
            <DataItem label="Review ID" numeric>
              {review._id}
            </DataItem>
            <DataItem label="Assigned" numeric>
              {new Date(review.createdAt).toLocaleDateString('en-KE', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </DataItem>
          </DataList>

          <Link
            href={`/dashboard/student/peer-review/${review._id}`}
            className={buttonVariants({ variant: 'primary' })}
          >
            Open review
          </Link>
        </Card>
      )}
    </Page>
  );
}
