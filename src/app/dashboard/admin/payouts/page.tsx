'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
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

const STATUS_VARIANT: Record<WithdrawalRequestStatus, BadgeVariant> = {
  [WithdrawalRequestStatus.REQUESTED]: 'warning',
  [WithdrawalRequestStatus.APPROVED]: 'success',
  [WithdrawalRequestStatus.PAID]: 'success',
  [WithdrawalRequestStatus.REJECTED]: 'error',
};

const STATUS_TABS: WithdrawalRequestStatus[] = [
  WithdrawalRequestStatus.REQUESTED,
  WithdrawalRequestStatus.APPROVED,
  WithdrawalRequestStatus.PAID,
  WithdrawalRequestStatus.REJECTED,
];

function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString()}`;
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
      <div className="space-y-6">
        <div className="skeleton h-6 w-40 rounded" />
        <ListSkeleton rows={5} />
      </div>
    );
  }

  const modalTitle =
    pending?.decision === 'APPROVED'
      ? 'Approve payout request'
      : pending?.decision === 'REJECTED'
        ? 'Reject payout request'
        : 'Mark payout as paid';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-t2 font-heading font-semibold text-fg">Payout Requests</h1>
        <p className="text-t5 font-body text-fg-muted mt-0.5">
          {queueSize} request{queueSize !== 1 ? 's' : ''} awaiting review. Payouts are released
          manually — there is no automated disbursement.
        </p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by status">
        {STATUS_TABS.map((tab) => {
          const isActive = tab === statusFilter;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setStatusFilter(tab)}
              className={[
                'min-h-[36px] px-3 rounded-sm font-mono text-t6 uppercase tracking-widest transition-all duration-150',
                isActive
                  ? 'bg-surface-raised text-fg'
                  : 'text-fg-disabled hover:text-fg-muted hover:bg-surface-raised/50',
              ].join(' ')}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Body */}
      {pageState === 'error' ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-t4 font-body font-medium text-fg mb-2">
            Could not load the payout queue
          </p>
          <Button variant="secondary" onClick={() => void fetchQueue(statusFilter)}>
            Retry
          </Button>
        </div>
      ) : requests.length === 0 ? (
        <div className="border border-white/5 rounded bg-surface px-4 py-12 text-center">
          <p className="text-t5 font-body text-fg-muted">
            No {statusFilter.toLowerCase()} payout requests.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-surface border border-white/5 rounded overflow-hidden">
            {requests.map((req) => (
              <div
                key={req._id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 border-b border-white/5 last:border-0"
              >
                <div className="min-w-0 flex-1 basis-[14rem]">
                  <p className="text-t5 font-body text-fg truncate">
                    {farmerName(req.farmer)}
                  </p>
                  <p className="text-t6 font-body text-fg-disabled truncate">
                    {req.farmer?.county ?? '—'}
                    {req.farmer?.phoneNumber ? ` · ${req.farmer.phoneNumber}` : ''} · requested{' '}
                    {formatDate(req.createdAt)}
                  </p>
                  {req.note && (
                    <p className="text-t6 font-body text-fg-muted mt-1 truncate">
                      Note: {req.note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-t5 font-mono text-fg whitespace-nowrap">
                    {formatKES(req.amountKES)}
                  </span>
                  {req.status === WithdrawalRequestStatus.REQUESTED ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openDecision(req, 'APPROVED')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDecision(req, 'REJECTED')}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : req.status === WithdrawalRequestStatus.APPROVED ? (
                    <Button variant="primary" size="sm" onClick={() => openDecision(req, 'PAID')}>
                      Mark paid
                    </Button>
                  ) : (
                    <Badge variant={STATUS_VARIANT[req.status]} label={req.status} />
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
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        title={modalTitle}
        description={
          pending
            ? `${farmerName(pending.request.farmer)} · ${formatKES(pending.request.amountKES)}`
            : ''
        }
        size="sm"
      >
        <div className="space-y-4">
          {pending?.decision === 'REJECTED' && (
            <div className="space-y-1.5">
              <label
                htmlFor="payout-note"
                className="text-t5 font-body text-fg-muted block"
              >
                Reason for rejection <span className="text-fg-disabled">(required)</span>
              </label>
              <textarea
                id="payout-note"
                rows={3}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                maxLength={500}
                className="w-full bg-surface-raised border border-white/10 rounded-sm text-t5 font-body text-fg px-3 py-2 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all duration-150"
                placeholder="Explain why this request is being rejected. The farmer is notified by SMS."
              />
            </div>
          )}
          {pending?.decision === 'PAID' && (
            <div className="space-y-1.5">
              <label
                htmlFor="payout-note"
                className="text-t5 font-body text-fg-muted block"
              >
                M-Pesa reference <span className="text-fg-disabled">(optional)</span>
              </label>
              <textarea
                id="payout-note"
                rows={2}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                maxLength={500}
                className="w-full bg-surface-raised border border-white/10 rounded-sm text-t5 font-body text-fg px-3 py-2 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all duration-150"
                placeholder="e.g. the manual B2C transaction code"
              />
            </div>
          )}
          {pending?.decision === 'APPROVED' && (
            <p className="text-t5 font-body text-fg-muted">
              This commits the platform to paying the farmer. You will mark it paid once the manual
              M-Pesa transfer is done.
            </p>
          )}

          {actionError !== null && (
            <p role="alert" className="text-t6 font-body text-red-400">
              {actionError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={submitting}
              onClick={() => void submitDecision()}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
