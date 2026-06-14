'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
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
    <div className="grid grid-cols-[10rem_1fr] gap-4 px-4 py-3 border-b border-white/5 last:border-0 items-center">
      <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">{label}</span>
      <span className="text-t5 font-body text-text-primary min-w-0 break-words">{children}</span>
    </div>
  );
}

function Value({ value }: { value: string | null }): React.ReactElement {
  if (!value) return <span className="text-text-disabled">Not provided</span>;
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
        <p className="text-t4 font-body font-medium text-text-primary mb-2">
          Could not load your identity records
        </p>
        <p className="text-t5 font-body text-text-secondary mb-4">
          Check your connection and try again.
        </p>
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
        <h1 className="text-t2 font-heading font-semibold text-text-primary">Profile</h1>
        <p className="text-t5 font-body text-text-secondary mt-0.5 max-w-2xl">
          Your identity records. These are set when you sign in or during onboarding and cannot be
          edited here — contact an administrator if any of them need to be corrected.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-t3 font-heading font-medium text-text-primary">Identity records</h2>
          <Badge variant="neutral" label="Read-only" />
        </div>

        <div className="bg-surface-elevated border border-white/5 rounded overflow-hidden">
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
                  <span className="inline-flex items-center gap-2 flex-wrap">
                    {identity.institutionalEmail}
                    <Badge
                      variant={identity.institutionalEmailVerified ? 'success' : 'warning'}
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

        <p className="text-t6 font-body text-text-secondary">
          Identity records are administrator-correctable only. They anchor your account and the
          trust the platform places in it, so they are deliberately not self-editable.
        </p>
      </section>
    </div>
  );
}
