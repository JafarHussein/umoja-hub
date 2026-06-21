'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Modal, Textarea, StatusPill, type StatusState } from '@/components/app';
import { cn } from '@/lib/cn';
import { Role, MediationRequestStatus, MediationCategory } from '@/types';

// ---------------------------------------------------------------------------
// UI-14 — Admin mediation tracking (BE-05).
//
// Reads GET /api/admin/mediation-requests (filterable by status, enriched with
// both parties + the order ref) and drives the PATCH transition route:
// OPEN → IN_REVIEW, OPEN | IN_REVIEW → RESOLVED (resolution note required).
// Resolutions never touch the order state machine — mediation is decoupled
// from the order/trust pipeline (Q7), surfaced to the admin as a plain note.
// ---------------------------------------------------------------------------

interface IParty {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

interface IOrderRef {
  orderReferenceId?: string;
  cropName?: string;
  totalAmountKES?: number;
  fulfillmentStatus?: string;
}

interface IMediationRequest {
  _id: string;
  category: MediationCategory;
  description: string;
  status: MediationRequestStatus;
  resolutionNote?: string;
  createdAt: string;
  buyer: IParty | null;
  farmer: IParty | null;
  order: IOrderRef | null;
}

interface IQueueResponse {
  data: IMediationRequest[];
  nextCursor: string | null;
  meta: { queueSize: number };
}

type PageState = 'loading' | 'ready' | 'error';
type Decision = 'IN_REVIEW' | 'RESOLVED';

interface IPendingDecision {
  request: IMediationRequest;
  decision: Decision;
}

const STATUS_PILL: Record<MediationRequestStatus, { state: StatusState; label: string }> = {
  [MediationRequestStatus.OPEN]: { state: 'pending', label: 'Open' },
  [MediationRequestStatus.IN_REVIEW]: { state: 'in-transit', label: 'In review' },
  [MediationRequestStatus.RESOLVED]: { state: 'completed', label: 'Resolved' },
};

const STATUS_TABS: MediationRequestStatus[] = [
  MediationRequestStatus.OPEN,
  MediationRequestStatus.IN_REVIEW,
  MediationRequestStatus.RESOLVED,
];

function formatKES(amount?: number): string {
  return amount != null ? `KES ${amount.toLocaleString()}` : '—';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function partyName(party: IParty | null, fallback: string): string {
  if (!party) return fallback;
  const name = `${party.firstName ?? ''} ${party.lastName ?? ''}`.trim();
  return name.length > 0 ? name : fallback;
}

export default function AdminMediationPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [requests, setRequests] = useState<IMediationRequest[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [queueSize, setQueueSize] = useState(0);
  const [statusFilter, setStatusFilter] = useState<MediationRequestStatus>(
    MediationRequestStatus.OPEN
  );
  const [pageState, setPageState] = useState<PageState>('loading');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [pending, setPending] = useState<IPendingDecision | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchQueue = useCallback(async (filter: MediationRequestStatus): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch(`/api/admin/mediation-requests?status=${filter}`);
      if (!res.ok) throw new Error('Request failed');
      const json = (await res.json()) as IQueueResponse;
      setRequests(json.data);
      setNextCursor(json.nextCursor);
      setQueueSize(json.meta.queueSize);
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
      void fetchQueue(statusFilter);
    }
  }, [status, session, router, fetchQueue, statusFilter]);

  async function loadMore(): Promise<void> {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/admin/mediation-requests?status=${statusFilter}&cursor=${nextCursor}`
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

  function openDecision(request: IMediationRequest, decision: Decision): void {
    setPending({ request, decision });
    setNoteInput('');
    setActionError(null);
  }

  async function submitDecision(): Promise<void> {
    if (!pending) return;
    const { request, decision } = pending;
    const note = noteInput.trim();

    if (decision === 'RESOLVED' && note.length === 0) {
      setActionError('A resolution note is required to resolve a case.');
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/mediation-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request._id,
          status: decision,
          ...(note.length > 0 ? { resolutionNote: note } : {}),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? 'The decision could not be recorded. Try again.');
      }
      // The case leaves the current filter view (its status changed).
      setRequests((prev) => prev.filter((r) => r._id !== request._id));
      if (statusFilter === MediationRequestStatus.OPEN) {
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
        <div className="skeleton h-7 w-44 rounded" />
        <div className="skeleton h-9 w-60 rounded-app-control" />
        <div className="skeleton h-64 rounded-app-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="app-h1 text-app-ink">Mediation</h1>
        <p className="app-body mt-1 max-w-2xl text-app-muted">
          {queueSize} open escalation{queueSize !== 1 ? 's' : ''}. Resolving a case records a note
          only; it does not change the order status or either party&apos;s trust score.
        </p>
      </div>

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
              {tab.replace('_', ' ').toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Body */}
      {pageState === 'error' ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="app-title mb-2 text-app-ink">Could not load the mediation queue</p>
          <Button variant="secondary" onClick={() => void fetchQueue(statusFilter)}>
            Retry
          </Button>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-app-card border border-app-hairline bg-app-card px-4 py-12 text-center">
          <p className="app-body text-app-muted">
            No {statusFilter.replace('_', ' ').toLowerCase()} cases.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req._id}
                className="space-y-3 rounded-app-card border border-app-hairline bg-app-card p-4"
              >
                {/* Top row: order ref + category + status */}
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="app-data-m whitespace-nowrap text-app-ink">
                      {req.order?.orderReferenceId ?? 'Unknown order'}
                    </span>
                    <span className="app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2 py-0.5 capitalize text-app-muted">
                      {req.category.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <StatusPill
                      state={STATUS_PILL[req.status].state}
                      label={STATUS_PILL[req.status].label}
                    />
                  </div>
                  <span className="app-meta whitespace-nowrap text-app-faint">
                    {formatDate(req.createdAt)}
                  </span>
                </div>

                {/* Parties + order summary */}
                <div className="app-meta flex flex-wrap gap-x-6 gap-y-1 text-app-muted">
                  <span>
                    <span className="text-app-faint">Buyer: </span>
                    {partyName(req.buyer, 'Unknown buyer')}
                  </span>
                  <span>
                    <span className="text-app-faint">Farmer: </span>
                    {partyName(req.farmer, 'Unknown farmer')}
                  </span>
                  <span>
                    <span className="text-app-faint">Order: </span>
                    {req.order?.cropName ?? '—'} · {formatKES(req.order?.totalAmountKES)}
                  </span>
                </div>

                {/* Buyer's complaint */}
                <p className="app-body text-app-ink">{req.description}</p>

                {/* Resolution note (resolved cases) */}
                {req.resolutionNote && (
                  <p className="app-meta border-l-2 border-app-brand/40 pl-3 text-app-muted">
                    <span className="text-app-faint">Resolution: </span>
                    {req.resolutionNote}
                  </p>
                )}

                {/* Actions */}
                {req.status !== MediationRequestStatus.RESOLVED && (
                  <div className="flex items-center gap-2 pt-1">
                    {req.status === MediationRequestStatus.OPEN && (
                      <Button variant="secondary" size="sm" onClick={() => openDecision(req, 'IN_REVIEW')}>
                        Start review
                      </Button>
                    )}
                    <Button variant="primary" size="sm" onClick={() => openDecision(req, 'RESOLVED')}>
                      Resolve
                    </Button>
                  </div>
                )}
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
        title={pending?.decision === 'IN_REVIEW' ? 'Start review' : 'Resolve case'}
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
            <p className="app-meta font-app-mono text-app-muted">
              {pending.request.order?.orderReferenceId ?? 'Unknown order'}
            </p>
          )}
          {pending?.decision === 'RESOLVED' ? (
            <Textarea
              label="Resolution note"
              hint="Required. This does not change the order."
              rows={3}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              maxLength={500}
              placeholder="Record how this escalation was resolved."
            />
          ) : (
            <p className="app-body text-app-muted">
              Mark this escalation as under review so the parties know an administrator is looking
              into it. The order status is unaffected.
            </p>
          )}

          {actionError !== null && (
            <p role="alert" className="app-meta text-app-danger">
              {actionError}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
