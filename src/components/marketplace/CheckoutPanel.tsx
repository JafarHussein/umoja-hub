'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Alert } from '@/components/app';
import { FulfillmentType, ListingUnit, OrderPaymentStatus } from '@/types';

// Buyer checkout (Marketplace Rebuild, Stage 7 — ported to the .theme-app
// tokens). The order-creation + M-Pesa STK-push polling logic is preserved
// verbatim from the retired dark CheckoutForm; only the presentation changed.
// Stage 8 deepens the checkout *experience* (order summary, escrow steps,
// delivery expectations) on top of this panel.

export interface ICheckoutPanelProps {
  listingId: string;
  cropName: string;
  unit: ListingUnit;
  pricePerUnit: number;
  maxQuantity: number;
  pickupCounty: string;
  pickupDescription: string;
  farmerName: string;
  farmerVerified: boolean;
  trustScore?: number;
}

type CheckoutState =
  | 'idle'
  | 'submitting'
  | 'awaiting_payment'
  | 'paid'
  | 'failed'
  | 'timeout'
  | 'inventory_unavailable'
  | 'error';

const POLL_WINDOW_SECONDS = 90;

interface IOrderResult {
  orderId: string;
  orderReferenceId: string;
  totalAmountKES: number;
  mpesaCheckoutRequestId: string;
}

interface IPaymentStatusResponse {
  paymentStatus: OrderPaymentStatus;
}

export function CheckoutPanel({
  listingId,
  cropName,
  unit,
  pricePerUnit,
  maxQuantity,
  pickupCounty,
  pickupDescription,
  farmerName,
  farmerVerified,
  trustScore,
}: ICheckoutPanelProps): React.ReactElement {
  const [quantity, setQuantity] = useState(1);
  const [phoneSuffix, setPhoneSuffix] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(FulfillmentType.PICKUP);
  const [state, setState] = useState<CheckoutState>('idle');
  const [orderResult, setOrderResult] = useState<IOrderResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(POLL_WINDOW_SECONDS);

  const pollingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalKES = quantity * pricePerUnit;

  const stopPolling = useCallback(() => {
    if (pollingTimer.current !== null) {
      clearInterval(pollingTimer.current);
      pollingTimer.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const startPolling = useCallback(
    (orderId: string) => {
      const deadline = Date.now() + POLL_WINDOW_SECONDS * 1_000;
      setRemainingSeconds(POLL_WINDOW_SECONDS);

      let tick = 0;
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1_000));
        setRemainingSeconds(remaining);

        if (Date.now() >= deadline) {
          stopPolling();
          setState('timeout');
          return;
        }

        tick += 1;
        if (tick % 3 !== 0) return;

        void (async () => {
          try {
            const res = await fetch(`/api/orders/${orderId}/payment-status`);
            if (!res.ok) return;
            const data = (await res.json()) as IPaymentStatusResponse;
            if (data.paymentStatus === OrderPaymentStatus.PAID) {
              stopPolling();
              setState('paid');
            } else if (data.paymentStatus === OrderPaymentStatus.FAILED) {
              stopPolling();
              setState('failed');
            }
          } catch {
            // transient network error — continue polling
          }
        })();
      }, 1_000);

      pollingTimer.current = timer;
    },
    [stopPolling]
  );

  function adjustQuantity(delta: number): void {
    setQuantity((q) => Math.min(maxQuantity, Math.max(1, q + delta)));
  }

  function handleRetry(): void {
    stopPolling();
    setOrderResult(null);
    setErrorMessage(null);
    setState('idle');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (phoneSuffix.length !== 9) return;
    setState('submitting');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          quantityOrdered: quantity,
          fulfillmentType,
          buyerPhone: `+254${phoneSuffix}`,
        }),
      });

      const body = (await res.json()) as { data?: IOrderResult; error?: string; code?: string };

      if (!res.ok) {
        if (body.code === 'ORDER_INSUFFICIENT_STOCK' || body.code === 'FARMER_LISTING_UNAVAILABLE') {
          setErrorMessage(body.error ?? 'This quantity is no longer available.');
          setState('inventory_unavailable');
          return;
        }
        setErrorMessage(body.error ?? 'Failed to place order. Please try again.');
        setState('error');
        return;
      }

      if (!body.data) {
        setErrorMessage('Unexpected response from server. Please try again.');
        setState('error');
        return;
      }

      setOrderResult(body.data);
      setState('awaiting_payment');
      startPolling(body.data.orderId);
    } catch {
      setErrorMessage('Network error. Check your connection and try again.');
      setState('error');
    }
  }

  // ── Awaiting M-Pesa PIN ─────────────────────────────────────────────────
  if (state === 'awaiting_payment' && orderResult) {
    const rows: { label: string; value: string }[] = [
      { label: 'Pay to', value: 'UmojaHub' },
      { label: 'Amount', value: `KSh ${orderResult.totalAmountKES.toLocaleString()}` },
      { label: 'Phone', value: `+254${phoneSuffix}` },
      { label: 'Reference', value: orderResult.orderReferenceId },
    ];
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 flex-shrink-0 animate-pulse rounded-app-pill bg-app-brand" aria-hidden="true" />
          <div>
            <p className="app-body-strong text-app-ink">STK push sent</p>
            <p className="app-meta text-app-muted">Check your phone and enter your M-Pesa PIN to confirm.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-app-control border border-app-hairline">
          {rows.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-app-hairline px-3 py-2.5 last:border-0"
            >
              <span className="app-body text-app-muted">{label}</span>
              <span className="app-data-m text-app-ink">{value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2" role="timer" aria-live="polite">
          <div className="flex items-center justify-between">
            <p className="app-body text-app-muted">Waiting for confirmation</p>
            <p className="app-data-m text-app-ink">{remainingSeconds}s</p>
          </div>
          <div className="h-1 overflow-hidden rounded-app-pill bg-app-sunken">
            <div
              className="h-full bg-app-brand transition-all duration-1000 ease-linear"
              style={{ width: `${(remainingSeconds / POLL_WINDOW_SECONDS) * 100}%` }}
            />
          </div>
        </div>

        <p className="app-meta text-app-faint">
          Enter your PIN on your phone. We&apos;ll stop checking after {POLL_WINDOW_SECONDS} seconds
          and let you retry.
        </p>
      </div>
    );
  }

  // ── Payment confirmed ───────────────────────────────────────────────────
  if (state === 'paid' && orderResult) {
    const rows: { label: string; value: string; mono: boolean }[] = [
      { label: 'Reference', value: orderResult.orderReferenceId, mono: true },
      { label: 'Amount', value: `KSh ${orderResult.totalAmountKES.toLocaleString()}`, mono: true },
      { label: 'Crop', value: cropName, mono: false },
      {
        label: 'Collection',
        value: fulfillmentType === FulfillmentType.PICKUP ? `Collect · ${pickupCounty}` : 'Delivery',
        mono: false,
      },
    ];
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 flex-shrink-0 rounded-app-pill bg-app-success" aria-hidden="true" />
          <p className="app-body-strong text-app-ink">Payment confirmed</p>
        </div>

        <div className="overflow-hidden rounded-app-control border border-app-hairline">
          {rows.map(({ label, value, mono }) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-app-hairline px-3 py-2.5 last:border-0"
            >
              <span className="app-body text-app-muted">{label}</span>
              <span className={cn('text-app-ink', mono ? 'app-data-m' : 'app-body capitalize')}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2.5 rounded-app-control border border-app-brand-border bg-app-brand-surface p-3">
          <span aria-hidden className="app-title leading-none text-app-brand">🔒</span>
          <p className="app-meta text-app-muted">
            <span className="app-body-strong text-app-ink">Held in escrow.</span> Your payment is
            protected until you confirm you received your order — then it is released to the farmer.
          </p>
        </div>

        <p className="app-meta text-app-faint">You will receive an M-Pesa SMS confirmation shortly.</p>

        <Link
          href="/dashboard/buyer/orders"
          className="app-body inline-flex items-center gap-1.5 text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
        >
          View my orders
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    );
  }

  // ── Checkout form ───────────────────────────────────────────────────────
  const showError =
    state === 'error' || state === 'failed' || state === 'timeout' || state === 'inventory_unavailable';

  const errorText =
    state === 'failed'
      ? 'Payment was declined.'
      : state === 'timeout'
        ? 'Payment timed out — no confirmation received.'
        : state === 'inventory_unavailable'
          ? `${errorMessage ?? 'This quantity is no longer available.'} Refresh to see current stock.`
          : (errorMessage ?? 'Something went wrong.');

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <p className="app-label text-app-muted">Checkout</p>
        <h2 className="app-h2 text-app-ink">Pay with M-Pesa</h2>
      </div>

      {/* Who you're buying from */}
      <div className="flex items-center justify-between gap-3 rounded-app-control border border-app-hairline bg-app-sunken px-3 py-2.5">
        <div className="min-w-0">
          <p className="app-meta text-app-muted">Buying from</p>
          <p className="app-body-strong flex items-center gap-1.5 truncate text-app-ink">
            {farmerName || '—'}
            {farmerVerified && (
              <span className="app-label text-app-success" aria-label="Verified farmer">
                ✓
              </span>
            )}
          </p>
        </div>
        {trustScore != null && trustScore > 0 && (
          <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-app-pill bg-app-brand-surface px-2 py-0.5">
            <span aria-hidden className="text-app-brand">◆</span>
            <span className="app-label text-app-muted">Trust</span>
            <span className="app-data-m text-app-brand">{trustScore}</span>
          </span>
        )}
      </div>

      {showError && (
        <Alert tone="danger">
          <div className="flex items-center justify-between gap-3">
            <span>{errorText}</span>
            {state === 'inventory_unavailable' ? (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="app-body-strong flex-shrink-0 underline underline-offset-2"
              >
                Refresh
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRetry}
                className="app-body-strong flex-shrink-0 underline underline-offset-2"
              >
                Retry
              </button>
            )}
          </div>
        </Alert>
      )}

      {/* Quantity */}
      <div className="space-y-1.5">
        <p className="app-meta text-app-muted">Quantity ({unit.toLowerCase()})</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => adjustQuantity(-1)}
            disabled={quantity <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-app-control border border-app-hairline text-app-ink transition-colors duration-150 hover:border-app-border-strong disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring"
            aria-label="Decrease quantity"
          >
            <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor" aria-hidden="true">
              <rect width="10" height="2" rx="1" />
            </svg>
          </button>
          <input
            type="number"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value, 10) || 1)))}
            aria-label="Quantity"
            className="app-data-m h-10 w-16 rounded-app-control border border-app-hairline bg-app-card text-center text-app-ink focus:border-app-brand focus:outline-none focus:ring-1 focus:ring-app-brand"
          />
          <button
            type="button"
            onClick={() => adjustQuantity(1)}
            disabled={quantity >= maxQuantity}
            className="flex h-10 w-10 items-center justify-center rounded-app-control border border-app-hairline text-app-ink transition-colors duration-150 hover:border-app-border-strong disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring"
            aria-label="Increase quantity"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
              <rect y="4" width="10" height="2" rx="1" />
              <rect x="4" width="2" height="10" rx="1" />
            </svg>
          </button>
          <span className="app-meta text-app-faint">of {maxQuantity.toLocaleString()} avail.</span>
        </div>
      </div>

      {/* Fulfillment */}
      <div className="space-y-1.5">
        <p className="app-meta text-app-muted">How you&apos;ll get it</p>
        <div className="flex gap-2" role="group" aria-label="How you'll get it">
          {(Object.values(FulfillmentType) as FulfillmentType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFulfillmentType(type)}
              aria-pressed={fulfillmentType === type}
              className={cn(
                'app-body h-10 flex-1 rounded-app-control border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring',
                fulfillmentType === type
                  ? 'border-app-brand bg-app-brand text-app-on-brand'
                  : 'border-app-hairline bg-app-card text-app-body hover:border-app-border-strong'
              )}
            >
              {type === FulfillmentType.PICKUP ? `Collect · ${pickupCounty}` : 'Delivery'}
            </button>
          ))}
        </div>
        <p className="app-meta text-app-faint">
          {fulfillmentType === FulfillmentType.PICKUP
            ? `Collect from ${pickupCounty}. ${pickupDescription}`
            : 'Delivery is arranged directly with the farmer after payment.'}
        </p>
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <p className="app-meta text-app-muted">M-Pesa number</p>
        <div
          className={cn(
            'flex items-stretch rounded-app-control border bg-app-card transition-colors duration-150',
            phoneFocused ? 'border-app-brand ring-1 ring-app-brand' : 'border-app-hairline'
          )}
        >
          <span className="app-data-m flex flex-shrink-0 select-none items-center border-r border-app-hairline px-3 text-app-muted">
            +254
          </span>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="700000000"
            maxLength={9}
            value={phoneSuffix}
            onChange={(e) => setPhoneSuffix(e.target.value.replace(/\D/g, '').slice(0, 9))}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
            className="app-data-m flex-1 bg-transparent px-3 py-2.5 text-app-ink focus:outline-none"
            aria-label="M-Pesa phone number (9 digits after country code)"
            required
          />
        </div>
        <p className="app-meta text-app-faint">Number registered with your M-Pesa account</p>
      </div>

      {/* Order summary */}
      <div className="overflow-hidden rounded-app-control border border-app-hairline">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="app-body text-app-muted">
            {quantity.toLocaleString()} {unit.toLowerCase()} × KSh {pricePerUnit.toLocaleString()}
          </span>
          <span className="app-data-m text-app-ink">KSh {totalKES.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between border-t border-app-hairline px-3 py-2.5">
          <span className="app-body text-app-muted">Platform fee</span>
          <span className="app-body text-app-success">Free</span>
        </div>
        <div className="flex items-center justify-between border-t border-app-hairline bg-app-sunken px-3 py-2.5">
          <span className="app-body-strong text-app-ink">Total</span>
          <span className="app-data-l text-app-ink">KSh {totalKES.toLocaleString()}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={state === 'submitting' || phoneSuffix.length !== 9 || quantity < 1}
        className="app-body-strong h-11 w-full rounded-app-control bg-app-brand text-app-on-brand transition-colors duration-150 hover:bg-app-brand-hover disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app-canvas"
      >
        {state === 'submitting' ? 'Placing order…' : `Pay KSh ${totalKES.toLocaleString()} with M-Pesa`}
      </button>

      {/* Escrow explainer — reduces uncertainty about when the farmer is paid */}
      <div className="space-y-2 rounded-app-control border border-app-brand-border bg-app-brand-surface p-3">
        <p className="app-label flex items-center gap-1.5 text-app-brand">
          <span aria-hidden>🔒</span>
          How your payment is protected
        </p>
        <ol className="space-y-1.5">
          {[
            'You pay now — the money is held safely in escrow, not sent to the farmer yet.',
            'The farmer dispatches your order.',
            'You confirm you received it — only then is the payment released to the farmer.',
          ].map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="app-data-m flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-app-pill bg-app-brand text-app-on-brand">
                {i + 1}
              </span>
              <span className="app-meta text-app-muted">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </form>
  );
}
