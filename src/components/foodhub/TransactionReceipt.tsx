'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, StatusPill } from '@/components/app';
import { SimulationNotice } from '@/components/foodhub/SimulationNotice';
import { EscrowState, OrderPaymentStatus } from '@/types';

// ---------------------------------------------------------------------------
// TransactionReceipt — the formal record of a protected payment.
//
// Renders the receipt document and the full chronological audit trail from
// GET /api/orders/[orderId]/receipt. Both are derived server-side from the
// append-only payment and escrow logs, so this screen cannot show anything the
// platform did not actually record.
//
// "Download" is browser print-to-PDF: the layout carries print styles so the
// saved document is the receipt alone, without app chrome. That is how the
// receipt stays a single source of truth rather than a second, divergent
// rendering path.
// ---------------------------------------------------------------------------

interface IReceiptParty {
  name: string;
  phone?: string;
}

interface IReceipt {
  receiptNumber: string | null;
  orderReferenceId: string;
  escrowReference: string;
  paymentMethod: string;
  provider: string;
  isSimulated: boolean;
  buyer: IReceiptParty;
  farmer: IReceiptParty;
  cropName: string;
  quantityOrdered: number;
  unit: string;
  pricePerUnit: number;
  totalAmountKES: number;
  fulfillmentType: string;
  paymentStatus: string;
  escrowState: EscrowState;
  paidAt: string | null;
  issuedAt: string;
}

interface IReceiptEvent {
  kind: 'PAYMENT' | 'ESCROW';
  type: string;
  label: string;
  detail: string | null;
  actor: string;
  occurredAt: string;
  reference: string | null;
}

const ESCROW_STATE_LABEL: Record<EscrowState, string> = {
  [EscrowState.NO_FUNDS]: 'No funds held',
  // Not "no funds held" — we do not know that, and a receipt is the last place
  // to guess about it.
  [EscrowState.UNKNOWN]: 'Payment being checked',
  [EscrowState.HELD]: 'Held in escrow',
  [EscrowState.HELD_DISPATCHED]: 'Held — awaiting your confirmation',
  [EscrowState.HELD_UNDER_REVIEW]: 'Held — under mediation',
  [EscrowState.RELEASABLE]: 'Released to farmer',
  [EscrowState.REFUNDED]: 'Refunded to buyer',
};

function escrowPillState(state: EscrowState): 'verified' | 'pending' | 'in-transit' | 'completed' | 'denied' {
  switch (state) {
    case EscrowState.RELEASABLE:
      return 'completed';
    case EscrowState.REFUNDED:
      return 'denied';
    case EscrowState.HELD_UNDER_REVIEW:
    case EscrowState.UNKNOWN:
      return 'pending';
    default:
      return 'in-transit';
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface ITransactionReceiptProps {
  orderId: string;
}

export function TransactionReceipt({ orderId }: ITransactionReceiptProps): React.ReactElement {
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'unavailable'>('loading');
  const [receipt, setReceipt] = useState<IReceipt | null>(null);
  const [events, setEvents] = useState<IReceiptEvent[]>([]);
  const [message, setMessage] = useState<string>('');

  const load = useCallback(async (): Promise<void> => {
    setState('loading');
    try {
      const res = await fetch(`/api/orders/${orderId}/receipt`);
      const body: unknown = await res.json();
      if (!res.ok) {
        const err = body as { error?: string; code?: string };
        setMessage(err.error ?? 'Could not load this receipt.');
        setState(err.code === 'RECEIPT_NOT_AVAILABLE' ? 'unavailable' : 'error');
        return;
      }
      const data = (body as { data: { receipt: IReceipt; events: IReceiptEvent[] } }).data;
      setReceipt(data.receipt);
      setEvents(data.events);
      setState('ready');
    } catch {
      setMessage('Could not load this receipt. Check your connection and try again.');
      setState('error');
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === 'loading') {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-24 animate-pulse rounded-app-card bg-app-sunken" />
        <div className="h-64 animate-pulse rounded-app-card bg-app-sunken" />
      </div>
    );
  }

  if (state === 'unavailable') {
    return <Alert tone="info">{message}</Alert>;
  }

  if (state === 'error' || !receipt) {
    return (
      <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
        <p className="app-body mb-3 text-app-muted">{message || 'Could not load this receipt.'}</p>
        <Button variant="secondary" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  const isRefunded = receipt.paymentStatus === OrderPaymentStatus.REFUNDED;

  const rows: { label: string; value: string; mono?: boolean }[] = [
    // "M-Pesa receipt", not "Transaction reference". This is the code a buyer
    // matches against the SMS on their handset, and that SMS is what they
    // actually trust — so it has to be called what the handset calls it.
    // Checkout already used this wording; the receipt did not, which left one
    // value with two names across two screens.
    { label: 'M-Pesa receipt', value: receipt.receiptNumber ?? '—', mono: true },
    { label: 'Order number', value: receipt.orderReferenceId, mono: true },
    { label: 'Escrow reference', value: receipt.escrowReference, mono: true },
    { label: 'Payment method', value: receipt.paymentMethod },
    { label: 'Paid on', value: formatDateTime(receipt.paidAt) },
    { label: 'Buyer', value: receipt.buyer.name },
    ...(receipt.buyer.phone
      ? [{ label: 'Paid from', value: receipt.buyer.phone, mono: true }]
      : []),
    { label: 'Farmer', value: receipt.farmer.name },
    { label: 'Produce', value: receipt.cropName },
    {
      label: 'Quantity',
      value: `${receipt.quantityOrdered.toLocaleString()} ${receipt.unit}`,
      mono: true,
    },
    {
      label: 'Unit price',
      value: `KSh ${receipt.pricePerUnit.toLocaleString()}`,
      mono: true,
    },
    { label: 'Fulfilment', value: receipt.fulfillmentType.toLowerCase().replace(/_/g, ' ') },
  ];

  return (
    <div className="space-y-4">
      {/* Actions — omitted from the printed document */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <p className="app-label text-app-muted">Receipt</p>
        <Button variant="secondary" size="sm" onClick={() => window.print()}>
          Download / print
        </Button>
      </div>

      {receipt.isSimulated && <SimulationNotice className="print:hidden" />}

      <article className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card print:border-0">
        {/* Masthead */}
        <header className="border-b border-app-hairline px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="app-title text-app-ink">UmojaHub</p>
              <p className="app-meta text-app-faint">Payment receipt</p>
            </div>
            <div className="text-right">
              <StatusPill
                state={escrowPillState(receipt.escrowState)}
                label={ESCROW_STATE_LABEL[receipt.escrowState]}
              />
              {receipt.isSimulated && (
                <p className="app-meta mt-1 hidden text-app-faint print:block">
                  Simulated payment — no funds moved on the Safaricom network.
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Amount — the figure the reader is looking for */}
        <div className="border-b border-app-hairline px-5 py-4">
          <p className="app-label text-app-muted">{isRefunded ? 'Amount refunded' : 'Amount paid'}</p>
          <p className="app-data-l text-app-ink">KSh {receipt.totalAmountKES.toLocaleString()}</p>
        </div>

        {/* Detail rows */}
        <dl>
          {rows.map(({ label, value, mono }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-app-hairline px-5 py-2.5 last:border-b-0"
            >
              <dt className="app-body text-app-muted">{label}</dt>
              <dd
                className={[
                  'text-right text-app-ink',
                  mono ? 'app-data-m' : 'app-body capitalize',
                ].join(' ')}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <footer className="border-t border-app-hairline bg-app-sunken px-5 py-3">
          <p className="app-meta text-app-faint">
            Issued {formatDateTime(receipt.issuedAt)} · Payments are held by UmojaHub and released
            to the farmer only when the buyer confirms receipt.
          </p>
        </footer>
      </article>

      {/* Audit trail */}
      <section className="rounded-app-card border border-app-hairline bg-app-card">
        <div className="border-b border-app-hairline px-5 py-3">
          <p className="app-label text-app-muted">Transaction history</p>
          <p className="app-meta text-app-faint">
            Every recorded event for this payment, in order.
          </p>
        </div>

        {events.length === 0 ? (
          <p className="app-body px-5 py-4 text-app-muted">No events recorded for this order.</p>
        ) : (
          <ol className="px-5 py-4">
            {events.map((event, index) => (
              <li key={`${event.type}-${event.occurredAt}-${index}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={[
                      'mt-1.5 h-2 w-2 flex-shrink-0 rounded-app-pill',
                      event.kind === 'ESCROW' ? 'bg-app-brand' : 'bg-app-info',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                  {index < events.length - 1 && (
                    <span className="my-1 w-px flex-1 bg-app-hairline" aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0 pb-4">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="app-body-strong text-app-ink">{event.label}</p>
                    {event.reference && (
                      <span className="app-data-m text-app-faint">{event.reference}</span>
                    )}
                  </div>
                  {event.detail && <p className="app-meta text-app-muted">{event.detail}</p>}
                  <p className="app-meta text-app-faint">
                    {event.actor} · {formatDateTime(event.occurredAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
