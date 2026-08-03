'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Button,
  EmptyState,
  Modal,
  Page,
  PageHeader,
  Textarea,
  StatusPill,
  type StatusState,
} from '@/components/app';
import { cn } from '@/lib/cn';
import { Role, WithdrawalRequestStatus } from '@/types';

// ---------------------------------------------------------------------------
// UI-13 — Admin payout-request queue (BE-03).
//
// Reads GET /api/admin/payout-requests (filterable by status) and drives the
// PATCH decision route: REQUESTED → APPROVED | REJECTED, APPROVED → PAID. A
// rejection requires a reason note; a PAID transition optionally records the
// manual M-Pesa reference. Every decision is audit-logged + SMS'd server-side.
// ---------------------------------------------------------------------------

interface IFarmerIdentity {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  county?: string;
}

interface IPayoutRequest {
  _id: string;
  amountKES: number;
  status: WithdrawalRequestStatus;
  note?: string;
  resolvedAt?: string | null;
  createdAt: string;
  farmer: IFarmerIdentity | null;
}

interface IQueueResponse {
  data: IPayoutRequest[];
  nextCursor: string | null;
  meta: { queueSize: number };
}

type PageState = 'loading' | 'ready' | 'error';
type Decision = 'APPROVED' | 'REJECTED' | 'PAID';

interface IPendingDecision {
  request: IPayoutRequest;
  decision: Decision;
}

const STATUS_PILL: Record<WithdrawalRequestStatus, { state: StatusState; label: string }> = {
  [WithdrawalRequestStatus.REQUESTED]: { state: 'pending', label: 'Requested' },
  [WithdrawalRequestStatus.APPROVED]: { state: 'verified', label: 'Approved' },
  [WithdrawalRequestStatus.PAID]: { state: 'completed', label: 'Paid' },
  [WithdrawalRequestStatus.REJECTED]: { state: 'denied', label: 'Rejected' },
};

const STATUS_TABS: WithdrawalRequestStatus[] = [
  WithdrawalRequestStatus.REQUESTED,
  WithdrawalRequestStatus.APPROVED,
  WithdrawalRequestStatus.PAID,
  WithdrawalRequestStatus.REJECTED,
];

function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString()}`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function farmerName(farmer: IFarmerIdentity | null): string {
  if (!farmer) return 'Unknown farmer';
  const name = `${farmer.firstName ?? ''} ${farmer.lastName ?? ''}`.trim();
  return name.length > 0 ? name : 'Unnamed farmer';
}

export default function AdminPayoutsPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [requests, setRequests] = useState<IPayoutRequest[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [queueSize, setQueueSize] = useState(0);
  const [statusFilter, setStatusFilter] = useState<WithdrawalRequestStatus>(
    WithdrawalRequestStatus.REQUESTED
  );
  const [pageState, setPageState] = useState<PageState>('loading');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [pending, setPending] = useState<IPendingDecision | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchQueue = useCallback(
    async (filter: WithdrawalRequestStatus): Promise<void> => {
      setPageState('loading');
      try {
        const res = await fetch(`/api/admin/payout-requests?status=${filter}`);
        if (!res.ok) throw new Error('Request failed');
        const json = (await res.json()) as IQueueResponse;
        setRequests(json.data);
        setNextCursor(json.nextCursor);
        setQueueSize(json.meta.queueSize);
        setPageState('ready');
      } catch {
        setPageState('error');
      }
    },
    []
  );

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
      void fetchQueue(statusFilter);
    }
  }, [status, session, router, fetchQueue, statusFilter]);

  async function loadMore(): Promise<void> {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/admin/payout-requests?status=${statusFilter}&cursor=${nextCursor}`
      );
      if (!res.ok) throw new Error('Request failed');
      const json = (await res.json()) as IQueueResponse;
      setRequests((prev) => [...prev, ...json.data]);
      setNextCursor(json.nextCursor);
    } catch {
      // Keep the loaded page; the same button retries.
    } finally {
      setIsLoadingMore(false);
    }
  }

  function openDecision(request: IPayoutRequest, decision: Decision): void {
    setPending({ request, decision });
    setNoteInput('');
    setActionError(null);
  }

  async function submitDecision(): Promise<void> {
    if (!pending) return;
    const { request, decision } = pending;
    const note = noteInput.trim();

    if (decision === 'REJECTED' && note.length === 0) {
      setActionError('A reason is required to reject a payout request.');
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/payout-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request._id,
          decision,
          ...(note.length > 0 ? { note } : {}),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? 'The decision could not be recorded. Try again.');
      }
      // The request leaves the current filter view (its status changed).
      setRequests((prev) => prev.filter((r) => r._id !== request._id));
      if (statusFilter === WithdrawalRequestStatus.REQUESTED) {
        setQueueSize((n) => Math.max(0, n - 1));
      }
      setPending(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading' || (pageState === 'loading' && requests.length === 0)) {
    return (
      <Page>
        <div className="skeleton h-8 w-52 rounded" />
        <div className="skeleton h-10 w-80 rounded-app-control" />
        <div className="skeleton h-64 rounded-app-card" />
      </Page>
    );
  }

  const modalTitle =
    pending?.decision === 'APPROVED'
      ? 'Approve payout request'
      : pending?.decision === 'REJECTED'
        ? 'Reject payout request'
        : 'Mark payout as paid';

  return (
    <Page>
      {/* Header */}
      <PageHeader
        title="Payout Requests"
        description="Farmers asking for cleared money to be sent to them. Payouts are released by hand — nothing leaves the platform without an administrator deciding it should."
        meta={
          queueSize > 0 ? (
            <span>
              {queueSize} request{queueSize !== 1 ? 's' : ''} awaiting review
            </span>
          ) : undefined
        }
      />

      {/* Status filter */}
      <div
        className="inline-flex flex-wrap gap-1 rounded-app-control border border-app-hairline bg-app-card p-1"
        role="tablist"
        aria-label="Filter by status"
      >
        {STATUS_TABS.map((tab) => {
          const isActive = tab === statusFilter;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setStatusFilter(tab)}
              className={cn(
                'app-label min-h-[32px] rounded-app-control px-3 capitalize transition-colors duration-150',
                isActive
                  ? 'bg-app-brand-surface text-app-brand'
                  : 'text-app-muted hover:bg-app-sunken hover:text-app-ink'
              )}
            >
              {tab.toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Body */}
      {pageState === 'error' ? (
        <EmptyState
          title="We could not load the payout queue"
          description="No request has been lost or actioned. This screen simply could not read the queue."
          action={{ label: 'Try again', onClick: () => void fetchQueue(statusFilter) }}
        />
      ) : requests.length === 0 ? (
        <EmptyState
          title={`No ${statusFilter.toLowerCase()} payout requests`}
          description="Nothing sits in this state right now. Farmers can only request a payout against a cleared balance, so this queue stays short by design — switch the filter above to see requests you have already decided."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
            {requests.map((req) => (
              <div
                key={req._id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-app-hairline px-4 py-4 last:border-0"
              >
                <div className="min-w-0 flex-1 basis-[14rem]">
                  <p className="app-body-strong truncate text-app-ink">{farmerName(req.farmer)}</p>
                  <p className="app-meta truncate text-app-faint">
                    {req.farmer?.county ?? '—'}
                    {req.farmer?.phoneNumber ? ` · ${req.farmer.phoneNumber}` : ''} · requested{' '}
                    {formatDate(req.createdAt)}
                  </p>
                  {req.note && (
                    <p className="app-meta mt-1 truncate text-app-muted">Note: {req.note}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="app-data-l whitespace-nowrap text-app-ink">
                    {formatKES(req.amountKES)}
                  </span>
                  {req.status === WithdrawalRequestStatus.REQUESTED ? (
                    <div className="flex items-center gap-2">
                      <Button variant="primary" size="sm" onClick={() => openDecision(req, 'APPROVED')}>
                        Approve
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDecision(req, 'REJECTED')}>
                        Reject
                      </Button>
                    </div>
                  ) : req.status === WithdrawalRequestStatus.APPROVED ? (
                    <Button variant="primary" size="sm" onClick={() => openDecision(req, 'PAID')}>
                      Mark paid
                    </Button>
                  ) : (
                    <StatusPill
                      state={STATUS_PILL[req.status].state}
                      label={STATUS_PILL[req.status].label}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {nextCursor && (
            <div className="flex justify-center">
              <Button variant="secondary" isLoading={isLoadingMore} onClick={() => void loadMore()}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}

      {/* Decision modal */}
      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title={modalTitle}
        className="max-w-sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={submitting} onClick={() => void submitDecision()}>
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {pending && (
            <p className="app-meta text-app-muted">
              {farmerName(pending.request.farmer)} ·{' '}
              <span className="font-app-mono">{formatKES(pending.request.amountKES)}</span>
            </p>
          )}
          {pending?.decision === 'REJECTED' && (
            <Textarea
              label="Reason for rejection"
              hint="Required. The farmer is notified by SMS."
              rows={3}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              maxLength={500}
              placeholder="Explain why this request is being rejected."
            />
          )}
          {pending?.decision === 'PAID' && (
            <Textarea
              label="M-Pesa reference"
              hint="Optional. e.g. the manual B2C transaction code."
              rows={2}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              maxLength={500}
              placeholder="e.g. the manual B2C transaction code"
            />
          )}
          {pending?.decision === 'APPROVED' && (
            <p className="app-body text-app-muted">
              This commits the platform to paying the farmer. You will mark it paid once the manual
              M-Pesa transfer is done.
            </p>
          )}

          {actionError !== null && (
            <p role="alert" className="app-meta text-app-danger">
              {actionError}
            </p>
          )}
        </div>
      </Modal>
    </Page>
  );
}
