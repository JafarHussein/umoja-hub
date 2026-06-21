'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Input, Modal, Table, THead, TH, TR, TD } from '@/components/app';
import { cn } from '@/lib/cn';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { Role, OrderFulfillmentStatus, WithdrawalRequestStatus } from '@/types';

interface ILedgerLineItem {
  orderId: string;
  orderReferenceId: string;
  cropName: string;
  quantityOrdered: number;
  unit: string;
  amountKES: number;
  fulfillmentStatus: OrderFulfillmentStatus;
  paidAt?: string | null;
}

interface IEscrowBalance {
  grossReceivedKES: number;
  committedPayoutsKES: number;
  availableKES: number;
}

interface IPayoutRequest {
  _id: string;
  amountKES: number;
  status: WithdrawalRequestStatus;
  note?: string;
  resolvedAt?: string | null;
  createdAt: string;
}

type PageState = 'loading' | 'ready' | 'error';

// Withdrawal-request status pill — app design-system tinted pill (state conveyed
// by icon + text + tint, never colour alone). REQUESTED is an attention state.
const REQUEST_PILL: Record<
  WithdrawalRequestStatus,
  { label: string; glyph: string; wrap: string; text: string }
> = {
  [WithdrawalRequestStatus.REQUESTED]: {
    label: 'Requested',
    glyph: '◷',
    wrap: 'bg-app-warning-surface',
    text: 'text-app-warning',
  },
  [WithdrawalRequestStatus.APPROVED]: {
    label: 'Approved',
    glyph: '✓',
    wrap: 'bg-app-success-surface',
    text: 'text-app-success',
  },
  [WithdrawalRequestStatus.PAID]: {
    label: 'Paid',
    glyph: '✓',
    wrap: 'bg-app-success-surface',
    text: 'text-app-success',
  },
  [WithdrawalRequestStatus.REJECTED]: {
    label: 'Rejected',
    glyph: '⊘',
    wrap: 'bg-app-danger-surface',
    text: 'text-app-danger',
  },
};

function RequestPill({ status }: { status: WithdrawalRequestStatus }): React.ReactElement {
  const p = REQUEST_PILL[status];
  return (
    <span
      className={cn(
        'app-label inline-flex items-center gap-1 rounded-app-pill px-2 py-0.5',
        p.wrap,
        p.text
      )}
    >
      <span aria-hidden>{p.glyph}</span>
      {p.label}
    </span>
  );
}

// Neutral fulfillment-status pill — informational, not a trust signal.
function FulfillmentPill({ status }: { status: OrderFulfillmentStatus }): React.ReactElement {
  return (
    <span className="app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2 py-0.5 text-app-muted">
      {status.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}

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

export default function FarmerLedgerPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [lineItems, setLineItems] = useState<ILedgerLineItem[]>([]);
  const [balance, setBalance] = useState<IEscrowBalance | null>(null);
  const [requests, setRequests] = useState<IPayoutRequest[]>([]);
  const [pageState, setPageState] = useState<PageState>('loading');

  const [showForm, setShowForm] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const [ledgerRes, payoutRes] = await Promise.all([
        fetch('/api/farmers/ledger'),
        fetch('/api/farmers/payout-requests'),
      ]);
      if (!ledgerRes.ok || !payoutRes.ok) throw new Error('Failed to fetch');

      const ledgerJson = (await ledgerRes.json()) as {
        data: { lineItems: ILedgerLineItem[]; balance: IEscrowBalance };
      };
      const payoutJson = (await payoutRes.json()) as { data: IPayoutRequest[] };

      setLineItems(ledgerJson.data.lineItems);
      setBalance(ledgerJson.data.balance);
      setRequests(payoutJson.data);
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
      if (session.user.role !== Role.FARMER) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchData();
    }
  }, [status, session, router, fetchData]);

  const hasOpenRequest = requests.some((r) => r.status === WithdrawalRequestStatus.REQUESTED);
  const availableKES = balance?.availableKES ?? 0;
  const canRequest = availableKES > 0 && !hasOpenRequest;

  function openForm(): void {
    setFormError(null);
    setAmountInput(String(availableKES));
    setShowForm(true);
  }

  async function submitPayout(): Promise<void> {
    setFormError(null);
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Enter an amount greater than zero.');
      return;
    }
    if (amount > availableKES) {
      setFormError(`Amount exceeds your available balance of ${formatKES(availableKES)}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/farmers/payout-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountKES: amount }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFormError(json.error ?? 'Could not submit your payout request.');
        return;
      }
      setShowForm(false);
      setAmountInput('');
      await fetchData();
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-32 rounded" />
        <ListSkeleton rows={5} />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Could not load your settlement ledger</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => void fetchData()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="app-h1 text-app-ink">Settlement</h1>
          <p className="app-meta mt-0.5 max-w-prose text-app-muted">
            Funds the platform has received on your behalf. Payouts are released manually after
            review — there is no automated disbursement.
          </p>
        </div>
        <Button size="sm" disabled={!canRequest} onClick={openForm} aria-label="Request a payout">
          Request Payout
        </Button>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-app-card border border-app-hairline bg-app-card p-4">
          <p className="app-label mb-2 text-app-muted">Received by platform</p>
          <p className="app-data-l text-app-ink">{formatKES(balance?.grossReceivedKES ?? 0)}</p>
        </div>
        <div className="rounded-app-card border border-app-hairline bg-app-card p-4">
          <p className="app-label mb-2 text-app-muted">Committed to payouts</p>
          <p className="app-data-l text-app-ink">{formatKES(balance?.committedPayoutsKES ?? 0)}</p>
        </div>
        <div className="rounded-app-card border border-app-brand-border bg-app-brand-surface p-4">
          <p className="app-label mb-2 text-app-muted">Available to request</p>
          <p className="app-data-l text-app-brand">{formatKES(availableKES)}</p>
        </div>
      </div>

      {hasOpenRequest && (
        <p className="app-meta text-app-muted">
          You have a payout request awaiting review. You can file another once it is resolved.
        </p>
      )}

      {/* Payout request history */}
      <section className="space-y-3">
        <h2 className="app-h2 text-app-ink">Payout requests</h2>
        {requests.length === 0 ? (
          <div className="rounded-app-card border border-app-hairline bg-app-card px-4 py-8 text-center">
            <p className="app-body text-app-muted">No payout requests yet.</p>
          </div>
        ) : (
          <Table>
            <THead>
              <TH>Amount</TH>
              <TH>Status</TH>
              <TH>Note</TH>
              <TH className="text-right">Requested</TH>
            </THead>
            <tbody>
              {requests.map((req) => (
                <TR key={req._id}>
                  <TD className="whitespace-nowrap">
                    <span className="app-data-m text-app-ink">{formatKES(req.amountKES)}</span>
                  </TD>
                  <TD>
                    <RequestPill status={req.status} />
                  </TD>
                  <TD className="max-w-0">
                    <span className="block truncate text-app-muted">{req.note ?? '—'}</span>
                  </TD>
                  <TD className="whitespace-nowrap text-right">
                    <span className="app-meta text-app-muted">{formatDate(req.createdAt)}</span>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      {/* Settlement ledger — PAID-order line items */}
      <section className="space-y-3">
        <h2 className="app-h2 text-app-ink">Payments received</h2>
        <p className="app-meta text-app-muted">
          Each payment below has been received by the platform — payout pending until you request
          settlement and an administrator releases it.
        </p>
        {lineItems.length === 0 ? (
          <div className="rounded-app-card border border-app-hairline bg-app-card px-4 py-8 text-center">
            <p className="app-body text-app-muted">No payments received yet.</p>
          </div>
        ) : (
          <Table>
            <THead>
              <TH>Ref</TH>
              <TH>Item</TH>
              <TH className="text-right">Amount</TH>
              <TH>Fulfillment</TH>
              <TH className="text-right">Received</TH>
            </THead>
            <tbody>
              {lineItems.map((item) => (
                <TR key={item.orderId}>
                  <TD className="whitespace-nowrap">
                    <span className="app-data-m text-app-muted">{item.orderReferenceId}</span>
                  </TD>
                  <TD className="max-w-0">
                    <p className="app-body-strong truncate capitalize text-app-ink">
                      {item.cropName}{' '}
                      <span className="app-body font-normal text-app-muted">
                        · {item.quantityOrdered} {item.unit.toLowerCase()}
                      </span>
                    </p>
                  </TD>
                  <TD className="whitespace-nowrap text-right">
                    <span className="app-data-m text-app-ink">{formatKES(item.amountKES)}</span>
                  </TD>
                  <TD>
                    <FulfillmentPill status={item.fulfillmentStatus} />
                  </TD>
                  <TD className="whitespace-nowrap text-right">
                    <span className="app-meta text-app-muted">{formatDate(item.paidAt)}</span>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      {/* Payout request modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Request Payout"
        className="max-w-sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button size="sm" isLoading={submitting} onClick={() => void submitPayout()}>
              Submit Request
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="app-meta text-app-muted">
            Payouts are released manually by an administrator after review. There is no automated
            disbursement.
          </p>
          <Input
            type="number"
            label="Amount (KES)"
            inputMode="numeric"
            min={1}
            max={availableKES}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            error={formError ?? undefined}
            hint={`Available: ${formatKES(availableKES)}`}
            aria-label="Payout amount in KES"
          />
        </div>
      </Modal>
    </div>
  );
}
