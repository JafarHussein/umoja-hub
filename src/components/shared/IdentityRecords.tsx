'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, VerificationBadge } from '@/components/app';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// UI-12 — Profile dashboard immutable identity records (Q14).
//
// Read-only view of the records the platform treats as identity anchors: the
// OAuth-sourced email + provider (+ GitHub username for students), and the
// institutional fields captured at onboarding. None of these are editable here
// — they are set by the sign-in provider or the onboarding funnel, and only an
// administrator can correct them. This component renders fields only; it carries
// no edit/save affordance by design.
// ---------------------------------------------------------------------------

interface IIdentityRecords {
  email: string;
  oauthProvider: string | null;
  githubUsername: string | null;
  institutionalEmail: string | null;
  institutionalEmailVerified: boolean;
  academicRegistrationNumber: string | null;
  departmentAssignment: string | null;
  academicStaffId: string | null;
}

type PageState = 'loading' | 'ready' | 'error';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
};

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="grid grid-cols-[10rem_1fr] items-center gap-4 px-4 py-3">
      <span className="app-label text-app-muted">{label}</span>
      <span className="app-body min-w-0 break-words text-app-ink">{children}</span>
    </div>
  );
}

function Value({ value }: { value: string | null }): React.ReactElement {
  if (!value) return <span className="text-app-faint">Not provided</span>;
  return <>{value}</>;
}

export default function IdentityRecords({ role }: { role: Role }): React.ReactElement {
  const [identity, setIdentity] = useState<IIdentityRecords | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');

  const fetchIdentity = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/users/me');
      if (!res.ok) throw new Error('Request failed');
      const json = (await res.json()) as { data: IIdentityRecords };
      setIdentity(json.data);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, []);

  useEffect(() => {
    void fetchIdentity();
  }, [fetchIdentity]);

  if (pageState === 'loading') {
    return <ListSkeleton rows={4} />;
  }

  if (pageState === 'error' || !identity) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Could not load your identity records</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => void fetchIdentity()}>
          Retry
        </Button>
      </div>
    );
  }

  const providerLabel = identity.oauthProvider
    ? (PROVIDER_LABELS[identity.oauthProvider] ?? identity.oauthProvider)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-h1 text-app-ink">Profile</h1>
        <p className="app-body mt-1 max-w-2xl text-app-muted">
          Your identity records. These are set when you sign in or during onboarding and cannot be
          edited here, contact an administrator if any of them need to be corrected.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="app-h2 text-app-ink">Identity records</h2>
          <span className="app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2 py-0.5 text-app-muted">
            Read-only
          </span>
        </div>

        <div className="divide-y divide-app-hairline overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
          {/* Shared OAuth-sourced anchors */}
          <Row label="Email">
            <Value value={identity.email} />
          </Row>
          <Row label="Sign-in provider">
            <Value value={providerLabel} />
          </Row>

          {/* Student — GitHub username (OAuth-sourced) + institutional fields */}
          {role === Role.STUDENT && (
            <>
              <Row label="GitHub username">
                <Value value={identity.githubUsername} />
              </Row>
              <Row label="Institutional email">
                {identity.institutionalEmail ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {identity.institutionalEmail}
                    <VerificationBadge
                      state={identity.institutionalEmailVerified ? 'verified' : 'pending'}
                      label={identity.institutionalEmailVerified ? 'Verified' : 'Unverified'}
                    />
                  </span>
                ) : (
                  <Value value={null} />
                )}
              </Row>
              <Row label="Reg. number">
                <Value value={identity.academicRegistrationNumber} />
              </Row>
            </>
          )}

          {/* Lecturer — institutional fields */}
          {role === Role.LECTURER && (
            <>
              <Row label="Department">
                <Value value={identity.departmentAssignment} />
              </Row>
              <Row label="Staff ID">
                <Value value={identity.academicStaffId} />
              </Row>
            </>
          )}
        </div>

        <p className="app-meta text-app-muted">
          Identity records are administrator-correctable only. They anchor your account and the
          trust the platform places in it, so they are deliberately not self-editable.
        </p>
      </section>
    </div>
  );
}
