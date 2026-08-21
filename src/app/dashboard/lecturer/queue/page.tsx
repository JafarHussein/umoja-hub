'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, ProjectTrack } from '@/types';
import { EmptyState, Page, PageHeader } from '@/components/app';
import { VerificationLockout } from '@/components/shared/VerificationLockout';
import { loginUrlWithIntent } from '@/lib/auth/intent';

interface IStudentRef {
  firstName?: string;
  lastName?: string;
}

interface IQueueItem {
  _id: string;
  track: ProjectTrack;
  brief: Record<string, unknown>;
  studentId: IStudentRef | string | null;
  createdAt: string;
}

type PageState = 'loading' | 'ready' | 'unverified' | 'error';

function PageSkeleton(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-app-page space-y-10">
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

// What the project was set against. A lecturer scanning the queue needs to see
// the coursework, not a difficulty the student chose for themselves — that pill
// told them nothing about whether the work belongs to what they teach.
function courseworkLine(item: IQueueItem): string | null {
  const anchor = (item.brief as { academicAnchor?: { units?: string[]; year?: number } })
    ?.academicAnchor;
  if (!anchor?.units?.length) return null;
  return `Year ${anchor.year ?? 1} · ${anchor.units.slice(0, 2).join(', ')}${anchor.units.length > 2 ? ` +${anchor.units.length - 2}` : ''}`;
}

function briefTitle(item: IQueueItem): string {
  if (item.track === ProjectTrack.AI_BRIEF) {
    return (item.brief as { title?: string }).title ?? 'AI Brief';
  }
  return (item.brief as { repoName?: string }).repoName ?? 'Open Source';
}

// Track labels with correct acronym casing (CSS capitalize would render
// "AI_BRIEF" as "Ai Brief").
const TRACK_LABEL: Record<ProjectTrack, string> = {
  [ProjectTrack.AI_BRIEF]: 'AI Brief',
  [ProjectTrack.LECTURER_ASSIGNED]: 'Set by a lecturer',
  [ProjectTrack.OPEN_SOURCE]: 'Open Source',
};

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
      router.push(loginUrlWithIntent());
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
      <Page>
        <PageHeader title="Pending Reviews" />
        {/* The lockout had no way forward: a lecturer who had not yet sent a
            credential letter was told to wait for a review of something that
            did not exist. Verification now has one address for every role. */}
        <VerificationLockout
          tone="pending"
          title="Your account is not verified yet"
          message="An administrator verifies your faculty role before you can review student work. If you have not sent your credential letter, you can do that now."
          cta={{ label: 'Go to verification', href: '/dashboard/verify' }}
        />
      </Page>
    );
  }

  if (pageState === 'error') {
    return (
      <Page>
        <PageHeader title="Pending Reviews" />
        <EmptyState
          title="We could not load the review queue"
          description="No student's submission has been lost — this screen just could not reach the queue."
          action={{
            label: 'Try again',
            onClick: () => {
              setPageState('loading');
              void fetchQueue();
            },
          }}
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Pending Reviews"
        description="Projects that have cleared peer review and are waiting on your reading. This is where a student finds out whether the engineering holds up — and what to do about it where it does not."
        meta={
          queue.length > 0 ? (
            <span>
              {queue.length} project{queue.length !== 1 ? 's' : ''} waiting
            </span>
          ) : undefined
        }
      />

      {queue.length === 0 ? (
        // No shortcuts here on purpose: a lecturer with an empty queue genuinely
        // has nothing outstanding, and a link back to this same page would be
        // worse than the honest answer.
        <EmptyState
          title="Your queue is clear"
          description="Projects arrive here after a student submits and a peer has reviewed it. There is nothing waiting on you — we will put the next one in front of you when it is ready."
        />
      ) : (
        <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
          {queue.map((item) => (
            <Link
              key={item._id}
              href={`/dashboard/lecturer/reviews/${item._id}`}
              className="flex items-center justify-between gap-6 border-b border-app-hairline px-6 py-5 transition-colors duration-150 last:border-0 hover:bg-app-sunken"
            >
              <div className="min-w-0 space-y-1">
                <p className="app-body-strong truncate text-app-ink">{briefTitle(item)}</p>
                <p className="app-meta text-app-muted">
                  {studentName(item.studentId)}
                  {courseworkLine(item) && <> · {courseworkLine(item)}</>}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <span className="app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2.5 py-1 text-app-muted">
                  {TRACK_LABEL[item.track]}
                </span>
                <span className="app-meta w-16 text-right font-app-mono text-app-faint">
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
    </Page>
  );
}
