'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Alert, Card, EmptyState, Page, PageHeader } from '@/components/app';
import { Role } from '@/types';
import { loginUrlWithIntent } from '@/lib/auth/intent';

// ---------------------------------------------------------------------------
// The reports waiting on this lecturer.
//
// Ordered oldest first, because a queue ordered any other way quietly leaves
// somebody at the bottom forever. Each row says which pass it is, so a lecturer
// opening a third submission knows before they start.
// ---------------------------------------------------------------------------

interface IQueueRow {
  _id: string;
  engagementId: string;
  studentName: string;
  projectTitle: string;
  year?: number;
  units: string[];
  versionNumber: number;
  pageCount?: number;
  submittedAt?: string;
}

type PageState = 'loading' | 'ready' | 'unverified' | 'error';

function waitingFor(submittedAt?: string): string {
  if (!submittedAt) return '';
  const days = Math.floor((Date.now() - new Date(submittedAt).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

export default function LecturerReportsPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<IQueueRow[]>([]);
  const [pageState, setPageState] = useState<PageState>('loading');

  const load = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/lecturer/reports');
      if (res.status === 403) {
        setPageState('unverified');
        return;
      }
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: IQueueRow[] };
      setRows(body.data ?? []);
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
      void load();
    }
  }, [status, session, router, load]);

  if (status === 'loading' || pageState === 'loading') {
    return (
      <Page width="focus">
        <div className="skeleton h-8 w-56 rounded" />
        <div className="skeleton h-64 rounded-app-card" />
      </Page>
    );
  }

  if (pageState === 'unverified') {
    return (
      <Page width="focus">
        <PageHeader title="Reports to review" />
        <Alert tone="warning">
          Your lecturer credentials have not been verified yet. Once an administrator confirms
          them, your students&rsquo; reports will appear here.
        </Alert>
      </Page>
    );
  }

  if (pageState === 'error') {
    return (
      <Page width="focus">
        <PageHeader title="Reports to review" />
        <Alert tone="danger">Could not load your queue. Refresh to try again.</Alert>
      </Page>
    );
  }

  return (
    <Page width="focus">
      <PageHeader
        title="Reports to review"
        description="Project reports your students have submitted. Read the report, then either accept it — which opens their demonstration — or send it back saying what needs to change."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing waiting on you"
          description="When a student at your institution submits their project report, it appears here. Nothing is required of you until then."
        />
      ) : (
        <>
          <p className="app-meta text-app-muted">
            {rows.length} report{rows.length === 1 ? '' : 's'} waiting
          </p>
          <div className="space-y-3">
            {rows.map((row) => (
              <Link
                key={row._id}
                href={`/dashboard/lecturer/reports/${row._id}`}
                className="block rounded-app-card border border-app-hairline bg-app-card p-5 transition-colors duration-150 hover:border-app-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="app-body-strong text-app-ink">{row.projectTitle}</p>
                    <p className="app-meta mt-0.5 text-app-muted">
                      {row.studentName}
                      {row.year ? ` · Year ${row.year}` : ''}
                      {row.units.length > 0
                        ? ` · ${row.units.slice(0, 2).join(', ')}${row.units.length > 2 ? ` +${row.units.length - 2}` : ''}`
                        : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    {row.versionNumber > 1 ? (
                      <p className="app-meta text-app-warning">
                        Version {row.versionNumber}
                      </p>
                    ) : (
                      <p className="app-meta text-app-muted">
                        {row.pageCount ? `${row.pageCount} pages` : 'First version'}
                      </p>
                    )}
                    <p className="app-meta text-app-faint">
                      waiting {waitingFor(row.submittedAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <Card>
        <p className="app-body-strong text-app-ink">Why the report comes first</p>
        <p className="app-body mt-1 text-app-muted">
          A demonstration is only booked once you have accepted the report. That way you arrive
          already knowing the project, and the session is spent on the system running and on your
          questions rather than on catching up.
        </p>
      </Card>
    </Page>
  );
}
