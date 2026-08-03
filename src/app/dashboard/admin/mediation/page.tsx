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
import { loginUrlWithIntent } from '@/lib/auth/intent';
import {
  Role,
  MediationRequestStatus,
  MediationCategory,
  MediationInitiator,
} from '@/types';

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

interface IMediationEvidence {
  url: string;
  uploadedByRole: string;
  uploadedAt: string;
}

interface IMediationRequest {
  _id: string;
  category: MediationCategory;
  description: string;
  status: MediationRequestStatus;
  /** Which party raised it — either side may now escalate. */
  initiatedBy: MediationInitiator;
  /** The other side's account, if they have given it yet. */
  respondentStatement?: string | null;
  respondentRespondedAt?: string | null;
  evidence?: IMediationEvidence[];
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
  return amount != null ? `KSh ${amount.toLocaleString()}` : '—';
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
      router.push(loginUrlWithIntent());
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
    <Page>
      {/* Header */}
      <PageHeader
        title="Mediation"
        description="Orders where a buyer or farmer has asked UmojaHub to step in. Resolving a case records a note only — it does not change the order status or either party's trust score."
        meta={
          queueSize > 0 ? (
            <span>
              {queueSize} open escalation{queueSize !== 1 ? 's' : ''}
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
              {tab.replace('_', ' ').toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Body */}
      {pageState === 'error' ? (
        <EmptyState
          title="We could not load the mediation queue"
          description="No case has been closed or altered. This screen simply could not read the queue."
          action={{ label: 'Try again', onClick: () => void fetchQueue(statusFilter) }}
        />
      ) : requests.length === 0 ? (
        <EmptyState
          title={`No ${statusFilter.replace('_', ' ').toLowerCase()} cases`}
          description="Escalations only open once an order has been paid and gone quiet for long enough that one side asks for help — so an empty queue means the marketplace is settling itself. Switch the filter above to review cases you have already decided."
        />
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req._id}
                className="space-y-3 rounded-app-card border border-app-hairline bg-app-card p-6"
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

                {/* The account of whoever raised it */}
                <div>
                  <p className="app-label text-app-muted">
                    Reported by the{' '}
                    {req.initiatedBy === MediationInitiator.FARMER ? 'farmer' : 'buyer'}
                  </p>
                  <p className="app-body mt-0.5 whitespace-pre-line text-app-ink">
                    {req.description}
                  </p>
                </div>

                {/* The other side's account — a case decided on one story is
                    not mediation, so this is called out when it is missing. */}
                <div>
                  <p className="app-label text-app-muted">
                    Response from the{' '}
                    {req.initiatedBy === MediationInitiator.FARMER ? 'buyer' : 'farmer'}
                  </p>
                  {req.respondentStatement ? (
                    <p className="app-body mt-0.5 whitespace-pre-line text-app-ink">
                      {req.respondentStatement}
                    </p>
                  ) : (
                    <p className="app-meta mt-0.5 text-app-warning">
                      Not yet given — they have not answered this case.
                    </p>
                  )}
                </div>

                {/* Photographic evidence from either side */}
                {req.evidence && req.evidence.length > 0 && (
                  <div>
                    <p className="app-label mb-1.5 text-app-muted">
                      Evidence ({req.evidence.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {req.evidence.map((item) => (
                        <a
                          key={item.url}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Uploaded by the ${item.uploadedByRole.toLowerCase()}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt={`Evidence from the ${item.uploadedByRole.toLowerCase()}`}
                            className="h-16 w-16 rounded-app-control border border-app-hairline object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

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
    </Page>
  );
}
