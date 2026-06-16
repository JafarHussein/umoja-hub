'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-surface-raised rounded-sm animate-pulse" />
          <div className="h-7 w-48 bg-surface-raised rounded-sm animate-pulse" />
        </div>
        <div className="bg-surface border border-zinc-800/50 rounded-[4px] overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-0">
              <div className="space-y-1.5">
                <div className="h-4 w-36 bg-surface-raised rounded-sm animate-pulse" />
                <div className="h-3 w-48 bg-surface-raised rounded-sm animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-20 bg-surface-raised rounded-[2px] animate-pulse" />
                <div className="h-9 w-16 bg-surface-raised rounded-sm animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
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
        setActionError(body.error ?? 'Failed to verify lecturer.');
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
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-fg-muted">Failed to load lecturers.</p>
            <button
              onClick={() => { setPageState('loading'); void fetchLecturers(); }}
              className="inline-flex mt-4 text-t5 font-body text-brand hover:text-brand/80 transition-colors duration-150"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const unverified = lecturers.filter((l) => !l.lecturerData?.isVerified);
  const verified = lecturers.filter((l) => l.lecturerData?.isVerified);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest mb-1">
              Admin · Lecturer Verification
            </p>
            <h1 className="text-t2 font-heading font-semibold text-fg tracking-tight">
              Lecturer Accounts
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-surface border border-zinc-800/50 rounded-[4px] px-3 py-2">
              <span className="text-t6 font-mono text-fg-disabled">PENDING </span>
              <span className="text-t5 font-mono font-semibold text-amber-400 tabular-nums">
                {unverified.length}
              </span>
            </div>
            <div className="bg-surface border border-zinc-800/50 rounded-[4px] px-3 py-2">
              <span className="text-t6 font-mono text-fg-disabled">VERIFIED </span>
              <span className="text-t5 font-mono font-semibold text-brand tabular-nums">
                {verified.length}
              </span>
            </div>
          </div>
        </div>

        {actionError && (
          <div className="px-4 py-3 bg-red-950/20 border border-red-900/30 rounded-[4px]">
            <p className="text-t5 font-body text-red-400">{actionError}</p>
          </div>
        )}

        {lecturers.length === 0 ? (
          <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-fg-muted">No lecturer accounts registered yet.</p>
          </div>
        ) : (
          <div className="bg-surface border border-zinc-800/50 rounded-[4px] overflow-hidden">
            {lecturers.map((lecturer) => {
              const isVerified = lecturer.lecturerData?.isVerified ?? false;
              return (
                <div
                  key={lecturer._id}
                  className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-0"
                >
                  <div className="space-y-0.5 min-w-0 mr-4">
                    <p className="text-t5 font-body text-fg">
                      {lecturer.firstName} {lecturer.lastName}
                    </p>
                    <p className="text-t6 font-body text-fg-muted truncate">
                      {lecturer.email}
                      {lecturer.lecturerData?.universityAffiliation && (
                        <> · {lecturer.lecturerData.universityAffiliation}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge
                      label={isVerified ? 'Verified' : 'Pending'}
                      variant={isVerified ? 'success' : 'warning'}
                    />
                    {!isVerified && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={verifying === lecturer._id}
                        onClick={() => void handleVerify(lecturer._id)}
                      >
                        {verifying === lecturer._id ? 'Verifying...' : 'Verify'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
