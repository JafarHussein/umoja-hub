'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Button,
  EmptyState,
  Input,
  MetricGrid,
  MetricTile,
  Modal,
  Page,
  PageHeader,
  PageSection,
  Table,
  THead,
  TH,
  TR,
  TD,
} from '@/components/app';
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
  heldKES: number;
  inDisputeKES: number;
  releasableKES: number;
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

// Per-payment escrow pill. A payment is HELD until the buyer confirms receipt,
// then RELEASABLE (it counts toward the available balance). Derived from the
// order's fulfillment status — the only two states a PAID ledger row can be in.
function EscrowPill({ status }: { status: OrderFulfillmentStatus }): React.ReactElement {
  const releasable = status === OrderFulfillmentStatus.COMPLETED;
  return (
    <span
      className={cn(
        'app-label inline-flex items-center gap-1 rounded-app-pill px-2 py-0.5',
        releasable ? 'bg-app-success-surface text-app-success' : 'bg-app-warning-surface text-app-warning'
      )}
    >
      <span aria-hidden>{releasable ? '✓' : '🔒'}</span>
      {releasable ? 'Cleared' : 'Held in escrow'}
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
      <Page>
        <div className="skeleton h-8 w-40 rounded" />
        <ListSkeleton rows={5} />
      </Page>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <Page>
        <PageHeader title="Payments" />
        <EmptyState
          title="We could not load your payments"
          description="Nothing has moved — any money held against your orders is untouched. This screen simply could not reach your balance just now."
          action={{ label: 'Try again', onClick: () => void fetchData() }}
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Payments"
        description="When a buyer pays, the money is held safely in escrow by the platform. It clears once the buyer confirms they received your produce — then you can request a payout."
        actions={
          <Button disabled={!canRequest} onClick={openForm} aria-label="Request a payout">
            Request payout
          </Button>
        }
      />

      {/* Balance summary — the escrow story: held → releasable → available */}
      <PageSection>
        <MetricGrid columns={3}>
          <MetricTile
            label="Held in escrow"
            value={formatKES(balance?.heldKES ?? 0)}
            caption="Paid by buyers, waiting on them to confirm they received the produce."
          />
          <MetricTile
            label="Cleared"
            value={formatKES(balance?.releasableKES ?? 0)}
            caption={
              balance && balance.committedPayoutsKES > 0
                ? `Confirmed received. ${formatKES(balance.committedPayoutsKES)} of this is already committed to a payout request.`
                : 'Confirmed received by the buyer and counted toward what you can withdraw.'
            }
          />
          <MetricTile
            label="Available to withdraw"
            value={formatKES(availableKES)}
            emphasis
            caption={
              balance && balance.inDisputeKES > 0
                ? `${formatKES(balance.inDisputeKES)} is held back while an order is under review.`
                : 'Yours to request whenever you want it. An administrator releases each payout.'
            }
          />
        </MetricGrid>

        {hasOpenRequest && (
          <p className="app-body text-app-muted">
            You have a payout request awaiting review. You can file another once it is resolved.
          </p>
        )}
      </PageSection>

      {/* Payout request history */}
      <PageSection title="Payout requests">
        {requests.length === 0 ? (
          <EmptyState
            title="You haven't requested a payout yet"
            description="Once you have a cleared balance, request a payout here and an administrator will release it to your M-Pesa number. Every request you make stays on this list with its outcome."
          />
        ) : (
          <Table layout="fixed">
            <THead>
              <TH className="w-[20%]">Amount</TH>
              <TH className="w-[20%]">Status</TH>
              <TH className="w-[40%]">Note</TH>
              <TH className="w-[20%] text-right">Requested</TH>
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
      </PageSection>

      {/* Settlement ledger — PAID-order line items */}
      <PageSection
        title="Payments received"
        description="Each payment is held in escrow until the buyer confirms receipt, at which point it clears. You can then request a payout, which an administrator releases."
      >
        {lineItems.length === 0 ? (
          <EmptyState
            title="No buyer has paid you yet"
            description="Every payment a buyer makes will be listed here with its escrow state, so you can always see which money is still held and which has cleared."
            hints={[
              {
                label: 'See your orders',
                href: '/dashboard/farmer/orders',
                description: 'payment follows an order being placed',
              },
            ]}
          />
        ) : (
          <Table layout="fixed">
            <THead>
              <TH className="w-[12%]">Ref</TH>
              <TH className="w-[30%]">Item</TH>
              <TH className="w-[18%] text-right">Amount</TH>
              <TH className="w-[22%]">Escrow</TH>
              <TH className="w-[18%] text-right">Received</TH>
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
                    <EscrowPill status={item.fulfillmentStatus} />
                  </TD>
                  <TD className="whitespace-nowrap text-right">
                    <span className="app-meta text-app-muted">{formatDate(item.paidAt)}</span>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </PageSection>

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
            label="Amount (KSh)"
            inputMode="numeric"
            min={1}
            max={availableKES}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            error={formError ?? undefined}
            hint={`Available: ${formatKES(availableKES)}`}
            aria-label="Payout amount in KSh"
          />
        </div>
      </Modal>
    </Page>
  );
}
