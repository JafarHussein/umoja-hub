'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, EmptyState, Page, PageHeader } from '@/components/app';
import { Role, SupplierVerificationStatus } from '@/types';
import { loginUrlWithIntent } from '@/lib/auth/intent';

interface IRegistrations {
  kebsNumber?: string;
  pcpbNumber?: string;
  kephisNumber?: string;
}

interface ISupplier {
  _id: string;
  businessName: string;
  contactPhone: string;
  contactEmail?: string;
  county: string;
  physicalAddress?: string;
  inputCategories: string[];
  registrations?: IRegistrations;
  verificationStatus: SupplierVerificationStatus;
  createdAt: string;
}

interface IQueueResponse {
  data: ISupplier[];
  meta: { queueSize: number };
}

type PageState = 'loading' | 'ready' | 'error';
type Decision = 'VERIFIED' | 'SUSPENDED';

interface IPendingAction {
  supplierId: string;
  decision: Decision;
}

// Key/value row inside the expanded supplier detail.
function DetailRow({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}): React.ReactElement {
  return (
    <div className="flex gap-4 border-b border-app-hairline py-2 last:border-0">
      <span className="app-label w-32 shrink-0 text-app-muted">{label}</span>
      <span className={mono ? 'app-data-m text-app-ink' : 'app-body text-app-ink'}>{children}</span>
    </div>
  );
}

export default function AdminSupplierVerificationPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [queueSize, setQueueSize] = useState(0);
  const [pendingAction, setPendingAction] = useState<IPendingAction | null>(null);
  const [isActioning, setIsActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchQueue = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/admin/supplier-verification');
      if (!res.ok) throw new Error('Request failed');
      const data = (await res.json()) as IQueueResponse;
      setSuppliers(data.data ?? []);
      setQueueSize(data.meta?.queueSize ?? 0);
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
      if (session.user.role !== Role.ADMIN) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchQueue();
    }
  }, [status, session, router, fetchQueue]);

  async function handleConfirmAction(): Promise<void> {
    if (!pendingAction) return;
    setIsActioning(true);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/verify-supplier', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: pendingAction.supplierId,
          decision: pendingAction.decision,
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? 'Action failed. Try again.');
      }
      setSuppliers((prev) => prev.filter((s) => s._id !== pendingAction.supplierId));
      setQueueSize((n) => Math.max(0, n - 1));
      setPendingAction(null);
      setExpandedId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsActioning(false);
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="skeleton h-7 w-52 rounded" />
        <div className="skeleton h-40 rounded-app-card" />
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <Page>
        <PageHeader title="Supplier Verification" />
        <EmptyState
          title="We could not load the supplier queue"
          description="No supplier application has been affected — this screen just could not reach the queue."
          action={{ label: 'Try again', onClick: () => void fetchQueue() }}
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Supplier Verification"
        description="Input suppliers waiting on a credential check. Farmers can only see suppliers you approve, so their KEBS, PCPB and KEPHIS numbers are what stands between a farm and a bad input."
        meta={
          queueSize > 0 ? (
            <span>
              {queueSize} pending verification{queueSize !== 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      {suppliers.length === 0 ? (
        <EmptyState
          title="The queue is clear"
          description="No supplier is waiting on a credential check. New applications appear here for review before any farmer can see them in the directory."
          hints={[
            {
              label: 'Review farmers',
              href: '/dashboard/admin/verification-queue',
              description: 'farmer identity documents awaiting a decision',
            },
          ]}
        />
      ) : (
        <div className="space-y-3">
          {suppliers.map((supplier) => {
            const isExpanded = expandedId === supplier._id;
            const isPending = pendingAction?.supplierId === supplier._id;
            const registrations = supplier.registrations ?? {};
            const registrationLine = [
              registrations.kebsNumber && `KEBS: ${registrations.kebsNumber}`,
              registrations.pcpbNumber && `PCPB: ${registrations.pcpbNumber}`,
              registrations.kephisNumber && `KEPHIS: ${registrations.kephisNumber}`,
            ]
              .filter(Boolean)
              .join(' · ');

            return (
              <div
                key={supplier._id}
                className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card"
              >
                {/* Summary row */}
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="app-body-strong truncate text-app-ink">{supplier.businessName}</p>
                    <p className="app-meta text-app-muted">
                      {supplier.county} · {supplier.inputCategories.join(', ')} · Applied{' '}
                      {formatDate(supplier.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(isExpanded ? null : supplier._id)}
                  >
                    {isExpanded ? 'Collapse' : 'Review'}
                  </Button>
                </div>

                {/* Detail view */}
                {isExpanded && (
                  <div className="border-t border-app-hairline px-4 py-3">
                    <DetailRow label="Phone" mono>
                      {supplier.contactPhone}
                    </DetailRow>
                    {supplier.contactEmail && (
                      <DetailRow label="Email">{supplier.contactEmail}</DetailRow>
                    )}
                    {supplier.physicalAddress && (
                      <DetailRow label="Address">{supplier.physicalAddress}</DetailRow>
                    )}
                    {registrationLine && (
                      <DetailRow label="Registrations" mono>
                        {registrationLine}
                      </DetailRow>
                    )}
                  </div>
                )}

                {/* Action bar */}
                <div className="flex flex-wrap items-center gap-3 border-t border-app-hairline bg-app-sunken/50 px-4 py-3">
                  {!isPending ? (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setPendingAction({ supplierId: supplier._id, decision: 'VERIFIED' });
                          setActionError(null);
                        }}
                      >
                        Verify
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setPendingAction({ supplierId: supplier._id, decision: 'SUSPENDED' });
                          setActionError(null);
                        }}
                      >
                        Suspend
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="app-body text-app-ink">
                        Confirm{' '}
                        <strong className="app-body-strong">
                          {pendingAction.decision === 'VERIFIED' ? 'verify' : 'suspend'}
                        </strong>{' '}
                        {supplier.businessName}?
                      </span>
                      <Button
                        variant={pendingAction.decision === 'VERIFIED' ? 'primary' : 'danger'}
                        size="sm"
                        isLoading={isActioning}
                        onClick={() => void handleConfirmAction()}
                      >
                        Yes, confirm
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isActioning}
                        onClick={() => setPendingAction(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {isPending && actionError !== null && (
                    <p role="alert" className="app-meta text-app-danger">
                      {actionError}
                    </p>
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
