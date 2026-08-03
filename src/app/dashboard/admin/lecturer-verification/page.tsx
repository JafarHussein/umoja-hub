'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@/types';
import {
  Button,
  Alert,
  EmptyState,
  Page,
  PageHeader,
  VerificationBadge,
} from '@/components/app';

interface ILecturerData {
  isVerified: boolean;
  universityAffiliation?: string;
}

interface ILecturer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  county?: string;
  lecturerData?: ILecturerData;
  createdAt: string;
}

type PageState = 'loading' | 'ready' | 'error';

function PageSkeleton(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-app-page space-y-10">
      <div className="skeleton h-7 w-48 rounded" />
      <div className="skeleton h-64 rounded-app-card" />
    </div>
  );
}

// Count tile in the header.
function StatTile({ label, value, tone }: { label: string; value: number; tone: string }): React.ReactElement {
  return (
    <div className="rounded-app-control border border-app-hairline bg-app-card px-3 py-2">
      <span className="app-label text-app-faint">{label} </span>
      <span className={`app-data-m ${tone}`}>{value}</span>
    </div>
  );
}

export default function LecturerVerificationPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [lecturers, setLecturers] = useState<ILecturer[]>([]);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchLecturers = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/admin/lecturers');
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: ILecturer[] };
      setLecturers(body.data);
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
      void fetchLecturers();
    }
  }, [status, session, router, fetchLecturers]);

  async function handleVerify(lecturerId: string): Promise<void> {
    setVerifying(lecturerId);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/verify-lecturer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecturerId }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setActionError(body.error ?? 'Could not verify the lecturer.');
        setVerifying(null);
        return;
      }

      setLecturers((prev) =>
        prev.map((l) =>
          l._id === lecturerId
            ? { ...l, lecturerData: { ...l.lecturerData, isVerified: true } }
            : l
        )
      );
      setVerifying(null);
    } catch {
      setActionError('Network error. Try again.');
      setVerifying(null);
    }
  }

  if (status === 'loading' || pageState === 'loading') {
    return <PageSkeleton />;
  }

  if (pageState === 'error') {
    return (
      <Page>
        <PageHeader title="Lecturer Accounts" />
        <EmptyState
          title="We could not load lecturer accounts"
          description="No account has been altered — this screen just could not read the list."
          action={{
            label: 'Try again',
            onClick: () => {
              setPageState('loading');
              void fetchLecturers();
            },
          }}
        />
      </Page>
    );
  }

  const unverified = lecturers.filter((l) => !l.lecturerData?.isVerified);
  const verified = lecturers.filter((l) => l.lecturerData?.isVerified);

  return (
    <Page>
      <PageHeader
        title="Lecturer Accounts"
        description="Academics who review and sign off student work. Verifying a lecturer gives them authority over what appears in a student's public portfolio, so confirm the institution before you approve."
        actions={
          <div className="flex items-center gap-3">
            <StatTile label="Pending" value={unverified.length} tone="text-app-warning" />
            <StatTile label="Verified" value={verified.length} tone="text-app-brand" />
          </div>
        }
      />

      {actionError && <Alert tone="danger">{actionError}</Alert>}

      {lecturers.length === 0 ? (
        <EmptyState
          title="No lecturer has registered yet"
          description="Lecturer accounts appear here as soon as someone signs up with an academic role. Until one does, students have nobody to review their work — so this queue filling up is a good sign."
        />
      ) : (
        <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
          {lecturers.map((lecturer) => {
            const isVerified = lecturer.lecturerData?.isVerified ?? false;
            return (
              <div
                key={lecturer._id}
                className="flex items-center justify-between border-b border-app-hairline px-4 py-3 last:border-0"
              >
                <div className="mr-4 min-w-0 space-y-0.5">
                  <p className="app-body-strong text-app-ink">
                    {lecturer.firstName} {lecturer.lastName}
                  </p>
                  <p className="app-meta truncate text-app-muted">
                    {lecturer.email}
                    {lecturer.lecturerData?.universityAffiliation && (
                      <> · {lecturer.lecturerData.universityAffiliation}</>
                    )}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <VerificationBadge state={isVerified ? 'verified' : 'pending'} />
                  {!isVerified && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={verifying === lecturer._id}
                      onClick={() => void handleVerify(lecturer._id)}
                    >
                      Verify
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}
