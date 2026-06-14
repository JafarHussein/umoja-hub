'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
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

const STATUS_VARIANT: Record<WithdrawalRequestStatus, BadgeVariant> = {
  [WithdrawalRequestStatus.REQUESTED]: 'warning',
  [WithdrawalRequestStatus.APPROVED]: 'success',
  [WithdrawalRequestStatus.PAID]: 'success',
  [WithdrawalRequestStatus.REJECTED]: 'error',
};

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
        <p className="text-t4 font-body font-medium text-text-primary mb-2">
          Could not load your settlement ledger
        </p>
        <p className="text-t5 font-body text-text-secondary mb-4">
          Check your connection and try again.
        </p>
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
          <h1 className="text-t2 font-heading font-semibold text-text-primary">Settlement</h1>
          <p className="text-t5 font-body text-text-secondary mt-0.5">
            Funds the platform has received on your behalf. Payouts are released manually after
            review — there is no automated disbursement.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          disabled={!canRequest}
          onClick={openForm}
          aria-label="Request a payout"
        >
          Request Payout
        </Button>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-elevated border border-white/5 rounded p-4">
          <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-2">
            Received by platform
          </p>
          <p className="text-t2 font-mono text-text-primary">
            {formatKES(balance?.grossReceivedKES ?? 0)}
          </p>
        </div>
        <div className="bg-surface-elevated border border-white/5 rounded p-4">
          <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-2">
            Committed to payouts
          </p>
          <p className="text-t2 font-mono text-text-primary">
            {formatKES(balance?.committedPayoutsKES ?? 0)}
          </p>
        </div>
        <div className="bg-surface-elevated border border-accent-green/30 rounded p-4">
          <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-2">
            Available to request
          </p>
          <p className="text-t2 font-mono text-accent-green">{formatKES(availableKES)}</p>
        </div>
      </div>

      {hasOpenRequest && (
        <p className="text-t6 font-body text-text-secondary">
          You have a payout request awaiting review. You can file another once it is resolved.
        </p>
      )}

      {/* Payout request history */}
      <section className="space-y-3">
        <h2 className="text-t3 font-heading font-medium text-text-primary">Payout requests</h2>
        {requests.length === 0 ? (
          <div className="border border-white/5 rounded bg-surface-elevated px-4 py-8 text-center">
            <p className="text-t5 font-body text-text-secondary">No payout requests yet.</p>
          </div>
        ) : (
          <div className="bg-surface-elevated border border-white/5 rounded overflow-hidden">
            <div className="grid grid-cols-[auto_auto_1fr_auto] gap-4 px-4 py-3 border-b border-white/5">
              <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                Amount
              </span>
              <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                Status
              </span>
              <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                Note
              </span>
              <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest text-right">
                Requested
              </span>
            </div>
            {requests.map((req) => (
              <div
                key={req._id}
                className="grid grid-cols-[auto_auto_1fr_auto] gap-4 px-4 py-4 border-b border-white/5 last:border-0 items-center"
              >
                <span className="text-t5 font-mono text-text-primary whitespace-nowrap">
                  {formatKES(req.amountKES)}
                </span>
                <Badge variant={STATUS_VARIANT[req.status]} label={req.status} />
                <span className="text-t6 font-body text-text-secondary min-w-0 truncate">
                  {req.note ?? '—'}
                </span>
                <span className="text-t6 font-body text-text-disabled text-right whitespace-nowrap">
                  {formatDate(req.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Settlement ledger — PAID-order line items */}
      <section className="space-y-3">
        <h2 className="text-t3 font-heading font-medium text-text-primary">Payments received</h2>
        <p className="text-t6 font-body text-text-secondary">
          Each payment below has been received by the platform — payout pending until you request
          settlement and an administrator releases it.
        </p>
        {lineItems.length === 0 ? (
          <div className="border border-white/5 rounded bg-surface-elevated px-4 py-8 text-center">
            <p className="text-t5 font-body text-text-secondary">No payments received yet.</p>
          </div>
        ) : (
          <div className="bg-surface-elevated border border-white/5 rounded overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-white/5">
              <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                Ref
              </span>
              <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                Item
              </span>
              <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest text-right">
                Amount
              </span>
              <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                Fulfillment
              </span>
              <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest text-right">
                Received
              </span>
            </div>
            {lineItems.map((item) => (
              <div
                key={item.orderId}
                className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-4 border-b border-white/5 last:border-0 items-center"
              >
                <span className="text-t6 font-mono text-text-disabled whitespace-nowrap">
                  {item.orderReferenceId}
                </span>
                <p className="text-t5 font-body text-text-primary capitalize min-w-0 truncate">
                  {item.cropName}{' '}
                  <span className="font-normal text-text-secondary">
                    · {item.quantityOrdered} {item.unit.toLowerCase()}
                  </span>
                </p>
                <span className="text-t5 font-mono text-text-primary text-right whitespace-nowrap">
                  {formatKES(item.amountKES)}
                </span>
                <Badge variant="neutral" label={item.fulfillmentStatus} />
                <span className="text-t6 font-body text-text-disabled text-right whitespace-nowrap">
                  {formatDate(item.paidAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payout request modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Request Payout"
        description="Payouts are released manually by an administrator after review. There is no automated disbursement."
        size="sm"
      >
        <div className="space-y-4">
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
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={submitting}
              onClick={() => void submitPayout()}
            >
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
