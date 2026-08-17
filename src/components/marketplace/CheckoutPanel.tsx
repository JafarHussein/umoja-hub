'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Alert, DataItem, DataList, Disclosure } from '@/components/app';
import { MoneyStatement, NextStep } from '@/components/foodhub/MoneyStatement';
import { SimulationNotice } from '@/components/foodhub/SimulationNotice';
import { FulfillmentType, ListingUnit, OrderPaymentStatus } from '@/types';

// ---------------------------------------------------------------------------
// Buyer checkout — pay, wait, learn what happened.
//
// The order-creation and polling logic is preserved. What changed is what the
// buyer is told while it runs.
//
// The waiting screen used to run a 90-second depleting progress bar beside
// "Waiting for confirmation", which reads as a deadline on the payment. It is
// not: it is how long this component watches. The real STK prompt lives about
// thirty seconds and the payment session outlives our poll either way. The bar
// is gone; the recorded events stay, because those are facts.
//
// The serious one: when that window closed, the screen said "No confirmation
// arrived from M-Pesa. Nothing has been charged - you can try again", and the
// retry returned to an empty form, so the next submit created a SECOND order
// and a second STK push. Neither half was safe. After ninety seconds the
// platform does not know whether the buyer was charged, which is the entire
// reason UNRESOLVED and reconciliation exist, and a buyer who entered their PIN
// at second eighty-nine could pay twice. The window closing now says only what
// it means, and sends the buyer to the order, where the poll continues and
// reconciliation runs.
// ---------------------------------------------------------------------------

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
  // The poll window closed with no answer. Distinct from 'failed': we do not
  // know what happened, and must not imply that we do.
  | 'still_checking'
  | 'inventory_unavailable'
  | 'error';

/** How long this screen watches. Not how long the payment lives. */
const POLL_WINDOW_SECONDS = 90;

interface IOrderResult {
  orderId: string;
  orderReferenceId: string;
  totalAmountKES: number;
  mpesaCheckoutRequestId: string;
}

/**
 * One recorded step of the payment session, as the server narrates it from
 * PaymentEventLog. These are facts with timestamps, not animation: nothing here
 * is shown until the backend has actually written it.
 */
interface IPaymentSessionEvent {
  type: string;
  label: string;
  detail: string | null;
  occurredAt: string;
}

interface IPaymentStatusResponse {
  paymentStatus: OrderPaymentStatus;
  mpesaTransactionId?: string | null;
  isSimulated?: boolean;
  events?: IPaymentSessionEvent[];
}

function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * What the payment session has actually recorded, oldest first.
 *
 * This is the honest replacement for a spinner. Every line is a row the backend
 * wrote; if the server has not written it, it does not appear, and nothing here
 * moves on its own to suggest progress that is not happening.
 */
function SessionLog({ events }: { events: IPaymentSessionEvent[] }): React.ReactElement | null {
  if (events.length === 0) return null;
  return (
    <ol className="space-y-2.5" aria-live="polite" aria-label="What has happened so far">
      {events.map((e) => (
        <li key={`${e.type}-${e.occurredAt}`} className="flex gap-3">
          <span className="app-data-m w-12 shrink-0 pt-px text-app-faint">
            {clockTime(e.occurredAt)}
          </span>
          <span className="min-w-0">
            <span className="app-body block text-app-ink">{e.label}</span>
            {e.detail && <span className="app-meta block text-app-muted">{e.detail}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Why a payment did not go through, in the words the platform recorded.
 *
 * Every non-success used to collapse to "Payment was declined" — wrong for a
 * timeout, wrong for an unreachable handset, and unhelpful for insufficient
 * funds, where the buyer can fix it in thirty seconds if only they are told.
 */
function failureReason(events: IPaymentSessionEvent[]): string | null {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const e = events[i];
    if (
      e &&
      e.detail &&
      (e.type === 'FAILED' || e.type === 'TIMEOUT' || e.type === 'CALLBACK_RECEIVED')
    ) {
      return e.detail;
    }
  }
  return null;
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
  const [sessionEvents, setSessionEvents] = useState<IPaymentSessionEvent[]>([]);
  const [mpesaReceipt, setMpesaReceipt] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

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

      let tick = 0;
      const timer = setInterval(() => {
        if (Date.now() >= deadline) {
          stopPolling();
          setState('still_checking');
          return;
        }

        tick += 1;
        if (tick % 3 !== 0) return;

        void (async () => {
          try {
            const res = await fetch(`/api/orders/${orderId}/payment-status`);
            if (!res.ok) return;
            const data = (await res.json()) as IPaymentStatusResponse;
            if (data.events) setSessionEvents(data.events);
            if (data.mpesaTransactionId) setMpesaReceipt(data.mpesaTransactionId);
            if (data.isSimulated !== undefined) setIsSimulated(data.isSimulated);
            if (data.paymentStatus === OrderPaymentStatus.PAID) {
              stopPolling();
              setState('paid');
            } else if (data.paymentStatus === OrderPaymentStatus.FAILED) {
              stopPolling();
              setState('failed');
            } else if (data.paymentStatus === OrderPaymentStatus.UNRESOLVED) {
              stopPolling();
              setState('still_checking');
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

  /**
   * Back to an empty form.
   *
   * Only ever offered where we know no money moved: an order that never
   * reached the provider, or stock that was gone before payment began. It is
   * deliberately NOT offered after a payment we could not confirm — starting a
   * fresh checkout there is how a buyer pays twice.
   */
  function startOver(): void {
    stopPolling();
    setOrderResult(null);
    setErrorMessage(null);
    setSessionEvents([]);
    setMpesaReceipt(null);
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
        if (
          body.code === 'ORDER_INSUFFICIENT_STOCK' ||
          body.code === 'FARMER_LISTING_UNAVAILABLE'
        ) {
          setErrorMessage(body.error ?? 'This quantity is no longer available.');
          setState('inventory_unavailable');
          return;
        }
        setErrorMessage(body.error ?? 'Could not place your order. Please try again.');
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

  // Detail that belongs on the record but not in the buyer's face while they
  // are being asked to enter a PIN. The checkout session id is what Safaricom
  // support asks for, and it is one disclosure away rather than in a table.
  function PaymentDetail({ order }: { order: IOrderResult }): React.ReactElement {
    return (
      <Disclosure summary="Payment details">
        <DataList>
          {mpesaReceipt && (
            <DataItem label="M-Pesa receipt" numeric>
              {mpesaReceipt}
            </DataItem>
          )}
          <DataItem label="Order reference" numeric>
            {order.orderReferenceId}
          </DataItem>
          <DataItem label="Paid to">UmojaHub</DataItem>
          <DataItem label="From" numeric>
            +254{phoneSuffix}
          </DataItem>
          <DataItem label="Method">M-PESA</DataItem>
          <DataItem label="Checkout session" numeric>
            {order.mpesaCheckoutRequestId}
          </DataItem>
        </DataList>
      </Disclosure>
    );
  }

  // ── Waiting for the buyer's PIN ─────────────────────────────────────────
  if (state === 'awaiting_payment' && orderResult) {
    return (
      <div className="space-y-6">
        <MoneyStatement
          label="Paying now"
          amountKES={orderResult.totalAmountKES}
          status={
            isSimulated
              ? 'The payment request has been sent and is being processed. No PIN is requested on your handset.'
              : `A payment request has been sent to +254${phoneSuffix}. Enter your M-Pesa PIN on your phone to complete it.`
          }
          tone="checking"
          evidence={<span>To UmojaHub · {orderResult.orderReferenceId}</span>}
        />

        {isSimulated && <SimulationNotice />}

        <section className="space-y-3 border-t border-app-hairline pt-5">
          <h3 className="app-label text-app-muted">What has happened so far</h3>
          {sessionEvents.length === 0 ? (
            <p className="app-meta text-app-faint">
              Waiting for M-Pesa. Each step appears here as it is recorded.
            </p>
          ) : (
            <SessionLog events={sessionEvents} />
          )}
        </section>

        <div className="border-y border-app-hairline">
          <PaymentDetail order={orderResult} />
        </div>
      </div>
    );
  }

  // ── Payment confirmed ───────────────────────────────────────────────────
  if (state === 'paid' && orderResult) {
    return (
      <div className="space-y-6">
        <MoneyStatement
          label="Amount paid"
          amountKES={orderResult.totalAmountKES}
          status={`Held by UmojaHub until you confirm the produce arrived. ${farmerName || 'The farmer'} has not been paid yet.`}
          tone="settled"
          evidence={
            <>
              {mpesaReceipt && (
                <span>
                  M-Pesa receipt <span className="app-data-m text-app-muted">{mpesaReceipt}</span>
                </span>
              )}
              {isSimulated && <SimulationNotice variant="badge" />}
            </>
          }
        />

        <NextStep
          title="Next, the farmer sends your order"
          consequence={`${farmerName || 'The farmer'} has been told to prepare your ${cropName.toLowerCase()}. When it reaches you, confirm receipt on the order and the payment is released to them. Until you do, UmojaHub holds it.`}
        >
          <Link
            href="/dashboard/buyer/orders"
            className="app-body inline-flex items-center gap-1.5 text-app-brand transition-colors duration-150 hover:text-app-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring"
          >
            Track this order
            <span aria-hidden>→</span>
          </Link>
        </NextStep>

        <section className="space-y-3 border-t border-app-hairline pt-5">
          <h3 className="app-label text-app-muted">What happened</h3>
          <SessionLog events={sessionEvents} />
        </section>

        <div className="border-y border-app-hairline">
          <PaymentDetail order={orderResult} />
        </div>
      </div>
    );
  }

  // ── The window closed without an answer ─────────────────────────────────
  //
  // Not a failure, and not stated as one. The order exists, its poll continues
  // on the order screen, and reconciliation will ask M-Pesa what happened.
  if (state === 'still_checking' && orderResult) {
    return (
      <div className="space-y-6">
        <MoneyStatement
          label="Payment being checked"
          amountKES={orderResult.totalAmountKES}
          status="We have not had a final answer from M-Pesa yet, so we cannot say whether this payment went through."
          tone="checking"
          evidence={<span>{orderResult.orderReferenceId}</span>}
        />

        <NextStep
          title="Do not pay again yet"
          consequence="Check your M-Pesa messages. If the money left your account, UmojaHub will complete this order and you will see it on your orders page. If it did not, the order closes and the produce goes back on sale. Paying again now is the one thing that could cost you twice."
        >
          <Link
            href="/dashboard/buyer/orders"
            className="app-body inline-flex items-center gap-1.5 text-app-brand transition-colors duration-150 hover:text-app-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring"
          >
            Go to this order
            <span aria-hidden>→</span>
          </Link>
        </NextStep>

        <section className="space-y-3 border-t border-app-hairline pt-5">
          <h3 className="app-label text-app-muted">What has happened so far</h3>
          <SessionLog events={sessionEvents} />
        </section>

        <div className="border-y border-app-hairline">
          <PaymentDetail order={orderResult} />
        </div>
      </div>
    );
  }

  // ── The payment did not go through ──────────────────────────────────────
  //
  // An established failure, which is a different thing from the state above:
  // M-Pesa answered, and the answer was no. Nothing was charged, so returning
  // to the form is safe here.
  if (state === 'failed' && orderResult) {
    const reason = failureReason(sessionEvents);
    return (
      <div className="space-y-6">
        <MoneyStatement
          label="Payment not completed"
          amountKES={orderResult.totalAmountKES}
          status={reason ?? 'M-Pesa did not complete this payment. Nothing left your account.'}
          tone="stopped"
          evidence={<span>{orderResult.orderReferenceId}</span>}
        />

        <NextStep
          title="Try again"
          consequence={`Nothing has been charged. The produce is back on sale, so the same order is only available while ${farmerName || 'the farmer'} still has the stock.`}
        >
          <button
            type="button"
            onClick={startOver}
            className="app-body-strong h-11 rounded-app-control bg-app-brand px-5 text-app-on-brand transition-colors duration-150 hover:bg-app-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring"
          >
            Start again
          </button>
        </NextStep>

        <section className="space-y-3 border-t border-app-hairline pt-5">
          <h3 className="app-label text-app-muted">What happened</h3>
          <SessionLog events={sessionEvents} />
        </section>
      </div>
    );
  }

  // ── The form ────────────────────────────────────────────────────────────
  const showError = state === 'error' || state === 'inventory_unavailable';
  const errorText =
    state === 'inventory_unavailable'
      ? `${errorMessage ?? 'This quantity is no longer available.'} Refresh to see current stock.`
      : (errorMessage ?? 'Something went wrong.');

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <h2 className="app-h2 text-app-ink">Pay with M-Pesa</h2>
        <p className="app-meta mt-1 text-app-muted">
          Buying from {farmerName || 'this farmer'}
          {farmerVerified && (
            <span className="text-app-success">
              {' '}
              <span aria-hidden>✓</span> verified
            </span>
          )}
          {trustScore != null && trustScore > 0 && (
            <>
              {' '}
              · trust score <span className="app-data-m text-app-ink">{trustScore}</span>
            </>
          )}
        </p>
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
                Refresh stock
              </button>
            ) : (
              <button
                type="button"
                onClick={startOver}
                className="app-body-strong flex-shrink-0 underline underline-offset-2"
              >
                Try again
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
            className="flex h-11 w-11 items-center justify-center rounded-app-control border border-app-hairline text-app-ink transition-colors duration-150 hover:border-app-border-strong disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring"
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
            className="app-data-m h-11 w-16 rounded-app-control border border-app-hairline bg-app-card text-center text-app-ink focus:border-app-brand focus:outline-none focus:ring-1 focus:ring-app-brand"
          />
          <button
            type="button"
            onClick={() => adjustQuantity(1)}
            disabled={quantity >= maxQuantity}
            className="flex h-11 w-11 items-center justify-center rounded-app-control border border-app-hairline text-app-ink transition-colors duration-150 hover:border-app-border-strong disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring"
            aria-label="Increase quantity"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
              <rect y="4" width="10" height="2" rx="1" />
              <rect x="4" width="2" height="10" rx="1" />
            </svg>
          </button>
          <span className="app-meta text-app-faint">
            of {maxQuantity.toLocaleString()} available
          </span>
        </div>
      </div>

      {/* Fulfilment */}
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
                'app-body h-11 flex-1 rounded-app-control border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring',
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
        <label htmlFor="mpesa-number" className="app-meta block text-app-muted">
          M-Pesa number
        </label>
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
            id="mpesa-number"
            type="tel"
            inputMode="numeric"
            placeholder="700000000"
            maxLength={9}
            value={phoneSuffix}
            onChange={(e) => setPhoneSuffix(e.target.value.replace(/\D/g, '').slice(0, 9))}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
            className="app-data-m min-h-[44px] flex-1 bg-transparent px-3 text-app-ink focus:outline-none"
            required
          />
        </div>
        <p className="app-meta text-app-faint">The number registered with your M-Pesa account</p>
      </div>

      {/* What you pay. The total is the figure, so it is set as one. */}
      <div className="space-y-2 border-t border-app-hairline pt-5">
        <div className="flex items-baseline justify-between">
          <span className="app-body text-app-muted">
            {quantity.toLocaleString()} {unit.toLowerCase()} × KSh {pricePerUnit.toLocaleString()}
          </span>
          <span className="app-data-m text-app-muted">KSh {totalKES.toLocaleString()}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="app-body text-app-muted">Platform fee</span>
          <span className="app-body text-app-muted">None</span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="app-body-strong text-app-ink">Total</span>
          <span className="app-data-l text-app-ink">KSh {totalKES.toLocaleString()}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={state === 'submitting' || phoneSuffix.length !== 9 || quantity < 1}
        className="app-body-strong h-12 w-full rounded-app-control bg-app-brand text-app-on-brand transition-colors duration-150 hover:bg-app-brand-hover disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring"
      >
        {state === 'submitting'
          ? 'Sending the payment request…'
          : `Pay KSh ${totalKES.toLocaleString()}`}
      </button>

      {/* No escrow explainer here.
          This panel sits beside "Your protections" on the listing page, which
          is the canonical telling and carries two protections this would not.
          A second version a few hundred pixels away is the same fault the order
          screens had: one mechanism described twice, in different words. The
          promise becomes concrete after payment, and the confirmed state says
          it there. */}
    </form>
  );
}
