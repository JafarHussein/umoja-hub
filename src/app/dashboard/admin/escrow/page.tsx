'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  EmptyState,
  Modal,
  Page,
  PageHeader,
  StatusPill,
  Textarea,
  type StatusState,
} from '@/components/app';
import { cn } from '@/lib/cn';
import { Role, EscrowState, MediationOutcome } from '@/types';

// ---------------------------------------------------------------------------
// Admin escrow console. Platform custody totals (held / releasable /
// in-dispute / refunded / settled) and a per-order ledger with each order's
// derived escrow state — plus the decision surface over funds still held.
//
// An admin can settle held funds directly here, without a dispute having been
// filed: an order can stall with neither party escalating, and before this the
// money had nowhere to go. There are only two outcomes because there are only
// two places held money can go — to the farmer, or back to the buyer. Both
// demand a written reason and are recorded permanently against the admin.
// ---------------------------------------------------------------------------

interface ITotals {
  heldKES: number;
  heldCount: number;
  releasableKES: number;
  releasableCount: number;
  inDisputeKES: number;
  inDisputeCount: number;
  refundedKES: number;
  refundedCount: number;
  settledKES: number;
}

interface ILineItem {
  orderId: string;
  orderReferenceId: string;
  cropName: string;
  amountKES: number;
  escrowState: EscrowState;
  paidAt: string | null;
  farmerName: string;
  buyerName: string;
}

interface IEscrowResponse {
  data: { totals: ITotals; lineItems: ILineItem[] };
  nextCursor: string | null;
}

type PageState = 'loading' | 'ready' | 'error';
type LedgerFilter = 'ALL' | 'HELD' | 'RELEASABLE' | 'REFUNDED';

const FILTER_TABS: { key: LedgerFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'HELD', label: 'Held' },
  { key: 'RELEASABLE', label: 'Releasable' },
  { key: 'REFUNDED', label: 'Refunded' },
];

const ESCROW_PILL: Record<EscrowState, { state: StatusState; label: string }> = {
  [EscrowState.NO_FUNDS]: { state: 'pending', label: 'No funds' },
  [EscrowState.HELD]: { state: 'in-transit', label: 'Held' },
  [EscrowState.HELD_DISPATCHED]: { state: 'in-transit', label: 'Dispatched' },
  [EscrowState.HELD_UNDER_REVIEW]: { state: 'pending', label: 'In review' },
  [EscrowState.RELEASABLE]: { state: 'completed', label: 'Releasable' },
  [EscrowState.REFUNDED]: { state: 'denied', label: 'Refunded' },
};

// Funds can only be settled while they are genuinely in custody. A releasable
// or refunded order is already decided; the server enforces this too.
const SETTLEABLE: EscrowState[] = [
  EscrowState.HELD,
  EscrowState.HELD_DISPATCHED,
  EscrowState.HELD_UNDER_REVIEW,
];

function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString()}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function SummaryCard({
  label,
  amount,
  meta,
}: {
  label: string;
  amount: number;
  meta: string;
}): React.ReactElement {
  return (
    <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
      <p className="app-label text-app-muted">{label}</p>
      <p className="app-data-l mt-3 font-app-mono text-app-ink">{formatKES(amount)}</p>
      <p className="app-meta mt-2 text-pretty text-app-muted">{meta}</p>
    </div>
  );
}

export default function AdminEscrowPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [totals, setTotals] = useState<ITotals | null>(null);
  const [items, setItems] = useState<ILineItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filter, setFilter] = useState<LedgerFilter>('ALL');
  const [pageState, setPageState] = useState<PageState>('loading');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Settlement decision state.
  const [settling, setSettling] = useState<ILineItem | null>(null);
  const [outcome, setOutcome] = useState<MediationOutcome.RELEASE | MediationOutcome.REFUND>(
    MediationOutcome.RELEASE
  );
  const [reason, setReason] = useState('');
  const [settleState, setSettleState] = useState<'idle' | 'submitting'>('idle');
  const [settleError, setSettleError] = useState<string | null>(null);
  const [settleNotice, setSettleNotice] = useState<string | null>(null);

  const fetchLedger = useCallback(async (state: LedgerFilter): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch(`/api/admin/escrow?state=${state}`);
      if (!res.ok) throw new Error('Request failed');
      const json = (await res.json()) as IEscrowResponse;
      setTotals(json.data.totals);
      setItems(json.data.lineItems);
      setNextCursor(json.nextCursor);
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
      void fetchLedger(filter);
    }
  }, [status, session, router, fetchLedger, filter]);

  function openSettle(item: ILineItem): void {
    setSettling(item);
    setOutcome(MediationOutcome.RELEASE);
    setReason('');
    setSettleError(null);
  }

  async function handleSettle(): Promise<void> {
    if (!settling) return;
    setSettleState('submitting');
    setSettleError(null);
    try {
      const res = await fetch(`/api/admin/escrow/${settling.orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome, reason }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSettleError(body.error ?? 'Could not settle these funds.');
        setSettleState('idle');
        return;
      }
      setSettleNotice(
        outcome === MediationOutcome.REFUND
          ? `${formatKES(settling.amountKES)} refunded to ${settling.buyerName} for ${settling.orderReferenceId}.`
          : `${formatKES(settling.amountKES)} released to ${settling.farmerName} for ${settling.orderReferenceId}.`
      );
      setSettling(null);
      setSettleState('idle');
      await fetchLedger(filter);
    } catch {
      setSettleError('Could not settle these funds. Check your connection and try again.');
      setSettleState('idle');
    }
  }

  async function loadMore(): Promise<void> {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/admin/escrow?state=${filter}&cursor=${nextCursor}`);
      if (!res.ok) throw new Error('Request failed');
      const json = (await res.json()) as IEscrowResponse;
      setItems((prev) => [...prev, ...json.data.lineItems]);
      setNextCursor(json.nextCursor);
    } catch {
      // Keep the loaded page; the same button retries.
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (status === 'loading' || (pageState === 'loading' && items.length === 0 && !totals)) {
    return (
      <Page>
        <div className="skeleton h-8 w-40 rounded" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-app-card" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-app-card" />
      </Page>
    );
  }

  return (
    <Page>
      {/* Header */}
      <PageHeader
        title="Escrow"
        description="Funds the platform holds in custody on behalf of farmers. Money is released only after the buyer confirms receipt; an open dispute holds it until you resolve the mediation."
      />

      {/* Totals */}
      {totals && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <SummaryCard
            label="Held in escrow"
            amount={totals.heldKES}
            meta={`${totals.heldCount} order${totals.heldCount !== 1 ? 's' : ''} awaiting receipt`}
          />
          <SummaryCard
            label="Releasable"
            amount={totals.releasableKES}
            meta={`${totals.releasableCount} confirmed received`}
          />
          <SummaryCard
            label="In dispute"
            amount={totals.inDisputeKES}
            meta={`${totals.inDisputeCount} blocked pending review`}
          />
          <SummaryCard
            label="Refunded"
            amount={totals.refundedKES}
            meta={`${totals.refundedCount} returned to buyers`}
          />
          <SummaryCard
            label="Settled"
            amount={totals.settledKES}
            meta="paid out to farmers"
          />
        </div>
      )}

      {/* Filter */}
      <div
        className="inline-flex flex-wrap gap-1 rounded-app-control border border-app-hairline bg-app-card p-1"
        role="tablist"
        aria-label="Filter the ledger"
      >
        {FILTER_TABS.map((tab) => {
          const isActive = tab.key === filter;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'app-label min-h-[32px] rounded-app-control px-3 transition-colors duration-150',
                isActive
                  ? 'bg-app-brand-surface text-app-brand'
                  : 'text-app-muted hover:bg-app-sunken hover:text-app-ink'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Ledger */}
      {pageState === 'error' ? (
        <EmptyState
          title="We could not load the escrow ledger"
          description="No funds have moved. The ledger is the record, not the mechanism — a failure to read it does not change what is held."
          action={{ label: 'Try again', onClick: () => void fetchLedger(filter) }}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing in this view"
          description="No order currently sits in this escrow state. Switch the filter above to see money held elsewhere in the cycle, or check back as buyers confirm receipt."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
            {items.map((item) => {
              const pill = ESCROW_PILL[item.escrowState];
              return (
                <div
                  key={item.orderId}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-app-hairline px-6 py-5 last:border-0"
                >
                  <div className="min-w-0 flex-1 basis-[16rem] space-y-1">
                    <p className="app-body-strong truncate text-app-ink">
                      {item.cropName}{' '}
                      <span className="app-meta font-app-mono text-app-faint">
                        {item.orderReferenceId}
                      </span>
                    </p>
                    <p className="app-meta truncate text-app-faint">
                      {item.farmerName} ← {item.buyerName} · paid {formatDate(item.paidAt)}
                    </p>
                  </div>
                  {/* Fixed widths on the money and status columns so the figures
                      line up down the ledger regardless of pill label length. */}
                  <div className="flex shrink-0 items-center gap-5">
                    <span className="app-data-l w-36 whitespace-nowrap text-right font-app-mono text-app-ink">
                      {formatKES(item.amountKES)}
                    </span>
                    <span className="flex w-32 justify-start">
                      <StatusPill state={pill.state} label={pill.label} />
                    </span>
                    <Link
                      href={`/dashboard/admin/escrow/${item.orderId}`}
                      className="app-label rounded-app-control px-2 py-1 text-app-muted transition-colors duration-150 hover:bg-app-sunken hover:text-app-ink"
                    >
                      Receipt
                    </Link>
                    {SETTLEABLE.includes(item.escrowState) && (
                      <Button variant="secondary" size="sm" onClick={() => openSettle(item)}>
                        Settle
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
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

      {/* Settlement decision */}
      <Modal
        open={settling !== null}
        onClose={() => setSettling(null)}
        title="Settle held funds"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSettling(null)}>
              Cancel
            </Button>
            <Button
              variant={outcome === MediationOutcome.REFUND ? 'danger' : 'primary'}
              isLoading={settleState === 'submitting'}
              disabled={reason.trim().length < 10}
              onClick={() => void handleSettle()}
            >
              {outcome === MediationOutcome.REFUND ? 'Refund the buyer' : 'Release to the farmer'}
            </Button>
          </>
        }
      >
        {settling && (
          <div className="space-y-4">
            <div className="rounded-app-control border border-app-hairline bg-app-sunken px-3 py-2.5">
              <p className="app-body-strong capitalize text-app-ink">
                {settling.cropName}{' '}
                <span className="app-meta font-app-mono text-app-faint">
                  {settling.orderReferenceId}
                </span>
              </p>
              <p className="app-meta text-app-muted">
                {formatKES(settling.amountKES)} held · {settling.farmerName} ←{' '}
                {settling.buyerName}
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="app-label mb-1 text-app-muted">Where do these funds go?</legend>
              {(
                [
                  {
                    value: MediationOutcome.RELEASE,
                    title: `Release to ${settling.farmerName}`,
                    detail:
                      'Closes the order as completed. The funds join the farmer’s releasable balance and can be paid out.',
                  },
                  {
                    value: MediationOutcome.REFUND,
                    title: `Refund to ${settling.buyerName}`,
                    detail:
                      'Returns the money to the buyer, marks the order disputed and puts the produce back on the marketplace.',
                  },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex cursor-pointer gap-2.5 rounded-app-control border px-3 py-2.5 transition-colors duration-150',
                    outcome === opt.value
                      ? 'border-app-brand bg-app-brand-surface'
                      : 'border-app-hairline hover:bg-app-sunken'
                  )}
                >
                  <input
                    type="radio"
                    name="escrow-outcome"
                    className="mt-1"
                    checked={outcome === opt.value}
                    onChange={() => setOutcome(opt.value)}
                  />
                  <span>
                    <span className="app-body-strong block text-app-ink">{opt.title}</span>
                    <span className="app-meta text-app-muted">{opt.detail}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="settle-reason" className="app-label block text-app-muted">
                Reason (recorded permanently)
              </label>
              <Textarea
                id="settle-reason"
                rows={3}
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you settling these funds without a buyer confirmation?"
              />
              <p className="app-meta text-app-faint">
                Stored on the escrow record and the admin audit log, against your name. Minimum 10
                characters.
              </p>
            </div>

            {settleError && <Alert tone="danger">{settleError}</Alert>}
          </div>
        )}
      </Modal>

      {/* Post-settlement confirmation */}
      {settleNotice && (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md">
          <Alert tone="success">
            <span className="flex items-center justify-between gap-3">
              {settleNotice}
              <button
                type="button"
                onClick={() => setSettleNotice(null)}
                className="app-label shrink-0 text-app-muted hover:text-app-ink"
              >
                Dismiss
              </button>
            </span>
          </Alert>
        </div>
      )}
    </Page>
  );
}
