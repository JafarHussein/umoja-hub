'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FulfillmentType, ListingUnit, OrderPaymentStatus } from '@/types';

export interface ICheckoutFormProps {
  listingId: string;
  cropName: string;
  unit: ListingUnit;
  pricePerUnit: number;
  maxQuantity: number;
  pickupCounty: string;
}

type CheckoutState =
  | 'idle'
  | 'submitting'
  | 'awaiting_payment'
  | 'paid'
  | 'failed'
  | 'timeout'
  | 'error';

interface IOrderResult {
  orderId: string;
  orderReferenceId: string;
  totalAmountKES: number;
  mpesaCheckoutRequestId: string;
}

interface IPaymentStatusResponse {
  paymentStatus: OrderPaymentStatus;
}

export function CheckoutForm({
  listingId,
  cropName,
  unit,
  pricePerUnit,
  maxQuantity,
  pickupCounty,
}: ICheckoutFormProps): React.ReactElement {
  const [quantity, setQuantity] = useState(1);
  const [phoneSuffix, setPhoneSuffix] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(FulfillmentType.PICKUP);
  const [state, setState] = useState<CheckoutState>('idle');
  const [orderResult, setOrderResult] = useState<IOrderResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingDeadline = useRef<number>(0);

  const totalKES = quantity * pricePerUnit;

  const stopPolling = useCallback(() => {
    if (pollingTimer.current !== null) {
      clearInterval(pollingTimer.current);
      pollingTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return stopPolling;
  }, [stopPolling]);

  const startPolling = useCallback(
    (orderId: string) => {
      pollingDeadline.current = Date.now() + 90_000;

      const timer = setInterval(() => {
        if (Date.now() >= pollingDeadline.current) {
          stopPolling();
          setState('timeout');
          return;
        }

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
      }, 3_000);

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

      const body = (await res.json()) as { data?: IOrderResult; error?: string };

      if (!res.ok) {
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

  // ── Awaiting M-Pesa PIN ───────────────────────────────────────────────────
  if (state === 'awaiting_payment' && orderResult) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-t4 font-body font-medium text-text-primary">PIN prompt sent</p>
            <p className="text-t5 font-body text-text-secondary mt-0.5">
              Awaiting Daraja verification...
            </p>
          </div>
        </div>

        <div className="bg-surface-secondary border border-zinc-800/50 rounded-[4px] p-3">
          <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
            Reference
          </p>
          <p className="text-t5 font-mono text-text-primary tabular-nums">
            {orderResult.orderReferenceId}
          </p>
        </div>

        <div className="space-y-2" aria-hidden="true">
          <div className="h-4 w-44 bg-surface-secondary rounded-[4px] animate-pulse" />
          <div className="h-4 w-32 bg-surface-secondary rounded-[4px] animate-pulse" />
          <div className="h-4 w-40 bg-surface-secondary rounded-[4px] animate-pulse" />
        </div>

        <p className="text-t6 font-body text-text-disabled">
          Enter your PIN on your phone. This usually takes under 30 seconds.
        </p>
      </div>
    );
  }

  // ── Payment confirmed ─────────────────────────────────────────────────────
  if (state === 'paid' && orderResult) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-accent-green flex-shrink-0" aria-hidden="true" />
          <p className="text-t4 font-body font-medium text-text-primary">Payment confirmed</p>
        </div>

        <div className="bg-surface-secondary border border-zinc-800/50 rounded-[4px]">
          {(
            [
              { label: 'Reference', value: orderResult.orderReferenceId, mono: true },
              { label: 'Amount', value: `KES ${orderResult.totalAmountKES.toLocaleString()}`, mono: true },
              { label: 'Crop', value: cropName, mono: false },
              {
                label: 'Collection',
                value: fulfillmentType === FulfillmentType.PICKUP
                  ? `Pickup · ${pickupCounty}`
                  : 'Delivery',
                mono: false,
              },
            ] as { label: string; value: string; mono: boolean }[]
          ).map(({ label, value, mono }) => (
            <div
              key={label}
              className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800/50 last:border-0"
            >
              <span className="text-t5 font-body text-text-secondary">{label}</span>
              <span className={['text-t5 text-text-primary', mono ? 'font-mono tabular-nums' : 'font-body'].join(' ')}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <p className="text-t6 font-body text-text-disabled">
          You will receive an M-Pesa SMS confirmation shortly.
        </p>

        <Link
          href="/dashboard/buyer/orders"
          className="flex items-center gap-1.5 text-t5 font-body text-accent-green hover:text-accent-green/80 transition-colors duration-150"
        >
          View my orders
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    );
  }

  // ── Checkout form (idle | submitting | error | failed | timeout) ──────────
  const showErrorBar =
    state === 'error' || state === 'failed' || state === 'timeout';

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
          Checkout
        </p>
        <h2 className="text-t3 font-heading font-semibold text-text-primary tracking-tight">
          Pay with M-Pesa
        </h2>
      </div>

      {/* Error bar */}
      {showErrorBar && (
        <div
          className="flex items-center justify-between p-3 bg-red-950/20 border border-red-900/30 rounded-[4px]"
          role="alert"
        >
          <p className="text-t5 font-body text-red-400">
            {state === 'failed'
              ? 'Payment was declined.'
              : state === 'timeout'
              ? 'Payment timed out — no confirmation received.'
              : (errorMessage ?? 'Something went wrong.')}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="text-t5 font-body text-red-400 underline underline-offset-2 hover:text-red-300 transition-colors duration-150 ml-4 flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Quantity stepper */}
      <div className="space-y-1.5">
        <p className="text-t5 font-body text-text-secondary">
          Quantity ({unit.toLowerCase()})
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => adjustQuantity(-1)}
            disabled={quantity <= 1}
            className="w-8 h-8 bg-surface-secondary border border-zinc-800/50 rounded-[4px] text-text-primary flex items-center justify-center hover:border-white/20 disabled:opacity-40 transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-green"
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
            onChange={(e) =>
              setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value, 10) || 1)))
            }
            aria-label="Quantity"
            className="w-14 h-8 bg-surface-secondary border border-zinc-800/50 rounded-[4px] text-t5 font-mono text-text-primary text-center tabular-nums focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all duration-150"
          />

          <button
            type="button"
            onClick={() => adjustQuantity(1)}
            disabled={quantity >= maxQuantity}
            className="w-8 h-8 bg-surface-secondary border border-zinc-800/50 rounded-[4px] text-text-primary flex items-center justify-center hover:border-white/20 disabled:opacity-40 transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-green"
            aria-label="Increase quantity"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
              <rect y="4" width="10" height="2" rx="1" />
              <rect x="4" width="2" height="10" rx="1" />
            </svg>
          </button>

          <span className="text-t6 font-body text-text-disabled">
            of {maxQuantity.toLocaleString()} avail.
          </span>
        </div>
      </div>

      {/* Fulfillment type */}
      <div className="space-y-1.5">
        <p className="text-t5 font-body text-text-secondary">Collection method</p>
        <div className="flex gap-2" role="group" aria-label="Collection method">
          {(Object.values(FulfillmentType) as FulfillmentType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFulfillmentType(type)}
              aria-pressed={fulfillmentType === type}
              className={[
                'flex-1 h-9 rounded-[4px] text-t5 font-body border transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-green',
                fulfillmentType === type
                  ? 'bg-accent-green text-surface-primary border-accent-green'
                  : 'bg-surface-secondary text-text-secondary border-zinc-800/50 hover:border-white/20',
              ].join(' ')}
            >
              {type === FulfillmentType.PICKUP ? `Pickup · ${pickupCounty}` : 'Delivery'}
            </button>
          ))}
        </div>
      </div>

      {/* +254 compound phone input */}
      <div className="space-y-1.5">
        <p className="text-t5 font-body text-text-secondary">M-Pesa number</p>
        <div
          className={[
            'flex items-stretch bg-surface-secondary border rounded-[4px] transition-all duration-150',
            phoneFocused
              ? 'border-accent-green ring-1 ring-accent-green'
              : 'border-zinc-800/50',
          ].join(' ')}
        >
          <span className="flex items-center px-3 text-t5 font-mono text-text-secondary border-r border-zinc-800/50 select-none flex-shrink-0">
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
            className="flex-1 bg-transparent px-3 py-2.5 text-t4 font-mono text-text-primary focus:outline-none tabular-nums"
            aria-label="M-Pesa phone number (9 digits after country code)"
            required
          />
        </div>
        <p className="text-t6 font-body text-text-disabled">
          Number registered with your M-Pesa account
        </p>
      </div>

      {/* Running total */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-surface-secondary border border-zinc-800/50 rounded-[4px]">
        <span className="text-t5 font-body text-text-secondary">Total</span>
        <span className="text-t2 font-mono font-semibold text-text-primary tabular-nums">
          KES {totalKES.toLocaleString()}
        </span>
      </div>

      <button
        type="submit"
        disabled={state === 'submitting' || phoneSuffix.length !== 9 || quantity < 1}
        className="w-full h-11 bg-accent-green text-surface-primary text-t4 font-body font-medium rounded-[4px] disabled:opacity-50 hover:bg-accent-green/90 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-1 focus-visible:ring-offset-surface-primary"
      >
        {state === 'submitting'
          ? 'Placing order...'
          : `Pay KES ${totalKES.toLocaleString()} with M-Pesa`}
      </button>
    </form>
  );
}
