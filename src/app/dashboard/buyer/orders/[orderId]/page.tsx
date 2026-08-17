'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Role,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  MediationCategory,
  MediationRequestStatus,
  MediationInitiator,
  MEDIATION_ESCALATION_HOURS,
  FulfillmentStage,
  FULFILLMENT_STAGE_LABEL,
} from '@/types';
import {
  Alert,
  Button,
  Card,
  DataItem,
  DataList,
  Disclosure,
  EmptyState,
  Page,
  Textarea,
} from '@/components/app';
import { OrderTimelineDetailed } from '@/components/foodhub/OrderTimeline';
import { MoneyStatement, NextStep } from '@/components/foodhub/MoneyStatement';
import { escrowNarrative } from '@/lib/foodhub/escrowNarrative';
import { orderEscrowState } from '@/lib/foodhub/orderEscrowState';
import { escrowReferenceFor } from '@/lib/foodhub/receipt';
import { SimulationNotice, type PaymentMode } from '@/components/foodhub/SimulationNotice';
import { loginUrlWithIntent } from '@/lib/auth/intent';
import {
  MediationPanel,
  EscalateForm,
  MEDIATION_CATEGORY_LABEL,
  type IMediationCase,
  isMediationOpen,
} from '@/components/foodhub/MediationPanel';

// ---------------------------------------------------------------------------
// The buyer's order, read as one statement about one payment.
//
// This screen was ten bordered cards deep — status pills, an escrow panel, a
// refund alert saying what the escrow panel had just said, a "latest from the
// farmer" card saying what the timeline already showed, a details table, a
// receipt link, an action panel, a mediation panel, an escalation panel and a
// rating panel. Every fact was in a box, so no fact outranked any other, and
// the amount of money involved appeared once, in 13px, inside a table.
//
// Four zones now, in the order the questions get asked:
//
//   1. the statement    how much, where it is, and what proves it
//   2. the next step    the one thing this buyer can do, or nothing at all
//   3. the journey      the whole lifecycle with the current stage marked
//   4. the detail       everything else, behind disclosure
//
// Cards survive in exactly one place: the mediation case, which is a genuine
// sub-document containing two people's accounts of what happened.
// ---------------------------------------------------------------------------

interface IBuyerOrder {
  _id: string;
  orderReferenceId: string;
  cropName: string;
  quantityOrdered: number;
  unit: string;
  totalAmountKES: number;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  farmer: { firstName: string; lastName: string };
  hasRated: boolean;
  createdAt: string;
  paidAt: string | null;
  confirmedByFarmerAt: string | null;
  receivedByBuyerAt: string | null;
  fulfillmentStage: FulfillmentStage | null;
  /** The M-Pesa receipt code, so the buyer can match this order to their SMS. */
  mpesaTransactionId: string | null;
  /** Whether that code came from the simulator. Decided server-side. */
  isSimulated: boolean;
  /** Which leg of the payment this order used. Derived server-side. */
  paymentMode?: PaymentMode;
  mpesaMerchantRequestId?: string | null;
  mpesaCheckoutRequestId?: string | null;
}

type IMediation = IMediationCase;

interface IPaymentStatusResponse {
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  isSimulated?: boolean;
}

type PageState = 'loading' | 'ready' | 'error' | 'not_found';
type ActionState = 'idle' | 'submitting' | 'error';

const BUYER_MEDIATION_CATEGORIES: MediationCategory[] = Object.values(MediationCategory);

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BuyerOrderDetailPage(): React.ReactElement {
  const params = useParams<{ orderId: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [order, setOrder] = useState<IBuyerOrder | null>(null);
  const [receiveState, setReceiveState] = useState<ActionState>('idle');
  const [receiveError, setReceiveError] = useState<string | null>(null);
  const [ratingForm, setRatingForm] = useState({ rating: 0, comment: '' });
  const [ratingState, setRatingState] = useState<ActionState>('idle');
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [hasRated, setHasRated] = useState(false);

  const [mediation, setMediation] = useState<IMediation | null>(null);
  const [escalateOpen, setEscalateOpen] = useState(false);

  const [isSimulated, setIsSimulated] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('simulation');

  const [paymentActionState, setPaymentActionState] = useState<'idle' | 'submitting'>('idle');
  const [paymentActionError, setPaymentActionError] = useState<string | null>(null);

  const pollingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingTimer.current !== null) {
      clearInterval(pollingTimer.current);
      pollingTimer.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const fetchOrder = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/orders/${params.orderId}`);
      if (res.status === 404) {
        setPageState('not_found');
        return;
      }
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const { data } = (await res.json()) as { data: IBuyerOrder };
      setOrder(data);
      setHasRated(data.hasRated);
      setIsSimulated(data.isSimulated);
      if (data.paymentMode) setPaymentMode(data.paymentMode);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, [params.orderId]);

  const fetchMediation = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/orders/${params.orderId}/mediation`);
      if (!res.ok) return;
      const data = (await res.json()) as { data: IMediation | null };
      setMediation(data.data);
    } catch {
      // Non-fatal — the page still renders without the mediation case.
    }
  }, [params.orderId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(loginUrlWithIntent());
      return;
    }
    if (status === 'authenticated') {
      if (session.user.role !== Role.BUYER) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchOrder();
      void fetchMediation();
    }
  }, [status, session, router, fetchOrder, fetchMediation]);

  // While a payment is outstanding this screen keeps asking. The poll is also
  // what triggers reconciliation for this order, so leaving it running is what
  // eventually resolves a payment whose callback never arrived.
  useEffect(() => {
    if (pageState !== 'ready' || !order) return;
    if (order.paymentStatus !== OrderPaymentStatus.PENDING_PAYMENT) return;

    const orderId = order._id;
    const deadline = Date.now() + 90_000;

    const timer = setInterval(() => {
      if (Date.now() >= deadline) {
        stopPolling();
        return;
      }
      void (async () => {
        try {
          const res = await fetch(`/api/orders/${orderId}/payment-status`);
          if (!res.ok) return;
          const data = (await res.json()) as IPaymentStatusResponse;
          if (data.isSimulated !== undefined) setIsSimulated(data.isSimulated);
          if (data.paymentStatus !== OrderPaymentStatus.PENDING_PAYMENT) {
            stopPolling();
            void fetchOrder();
          }
        } catch {
          // transient error — continue polling
        }
      })();
    }, 3_000);

    pollingTimer.current = timer;
    return stopPolling;
  }, [pageState, order, stopPolling, fetchOrder]);

  async function handlePaymentAction(action: 'RETRY' | 'CANCEL'): Promise<void> {
    if (!order) return;
    setPaymentActionState('submitting');
    setPaymentActionError(null);
    try {
      const res = await fetch(`/api/orders/${order._id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const body = (await res.json()) as { error?: string; data?: { isSimulated?: boolean } };
      if (!res.ok) {
        setPaymentActionError(body.error ?? 'Could not complete that request.');
        setPaymentActionState('idle');
        return;
      }
      if (body.data?.isSimulated !== undefined) setIsSimulated(body.data.isSimulated);
      setPaymentActionState('idle');
      await fetchOrder();
    } catch {
      setPaymentActionError('Could not complete that request. Check your connection.');
      setPaymentActionState('idle');
    }
  }

  async function handleMarkReceived(): Promise<void> {
    if (!order) return;
    setReceiveState('submitting');
    setReceiveError(null);
    try {
      const res = await fetch(`/api/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fulfillmentStatus: OrderFulfillmentStatus.RECEIVED }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Request failed.');
      }
      setOrder((prev) =>
        prev ? { ...prev, fulfillmentStatus: OrderFulfillmentStatus.COMPLETED } : prev
      );
      setReceiveState('idle');
    } catch (err) {
      setReceiveState('error');
      setReceiveError(err instanceof Error ? err.message : 'An error occurred.');
    }
  }

  async function handleRatingSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!order || ratingForm.rating === 0) return;
    setRatingState('submitting');
    setRatingError(null);
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          rating: ratingForm.rating,
          ...(ratingForm.comment.trim() && { comment: ratingForm.comment.trim() }),
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Rating submission failed.');
      }
      setRatingState('idle');
      setHasRated(true);
    } catch (err) {
      setRatingState('error');
      setRatingError(err instanceof Error ? err.message : 'An error occurred.');
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────
  if (status === 'loading' || pageState === 'loading') {
    return (
      <Page width="focus">
        <div className="space-y-3">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-7 w-56 rounded" />
        </div>
        <div className="space-y-3">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-9 w-48 rounded" />
          <div className="skeleton h-4 w-full max-w-md rounded" />
        </div>
        <div className="skeleton h-56 rounded-app-card" />
      </Page>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (pageState === 'not_found' || !order) {
    return (
      <Page width="focus">
        <EmptyState
          title="We can't find that order"
          description="The link may be out of date, or the order may belong to a different account. Your other orders are all listed together."
          action={{ label: 'Back to my orders', href: '/dashboard/buyer/orders' }}
        />
      </Page>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <Page width="focus">
        <EmptyState
          title="We could not load this order"
          description="Whatever you have paid is still held. This screen just could not reach the order's details."
          action={{ label: 'Try again', onClick: () => void fetchOrder() }}
          secondaryAction={{ label: 'Back to my orders', href: '/dashboard/buyer/orders' }}
        />
      </Page>
    );
  }

  // ── Ready ────────────────────────────────────────────────────────────────
  const openMediation = isMediationOpen(mediation);
  const activeMediation =
    mediation &&
    (mediation.status === MediationRequestStatus.OPEN ||
      mediation.status === MediationRequestStatus.IN_REVIEW)
      ? mediation
      : null;

  const escrowState = orderEscrowState(
    {
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      confirmedByFarmerAt: order.confirmedByFarmerAt ?? null,
    },
    openMediation
  );

  // One narrative, three placements: the headline is the status of the money,
  // what releases it is the consequence of the action, and what to do when it
  // goes wrong sits behind disclosure until it is needed.
  const money = escrowNarrative(
    escrowState,
    'BUYER',
    order.totalAmountKES,
    order.farmer.firstName,
    order.paymentStatus
  );

  // 48-h client gate, mirroring the server's MEDIATION_TOO_EARLY rule.
  const paidMs = order.paidAt ? new Date(order.paidAt).getTime() : null;
  const eligibleAtMs = paidMs !== null ? paidMs + MEDIATION_ESCALATION_HOURS * 60 * 60 * 1000 : null;
  const canEscalate = eligibleAtMs !== null && Date.now() >= eligibleAtMs;

  const isPaid =
    order.paymentStatus === OrderPaymentStatus.PAID ||
    order.paymentStatus === OrderPaymentStatus.REFUNDED;

  return (
    <Page width="focus">
      <Link
        href="/dashboard/buyer/orders"
        className="app-body inline-flex items-center gap-1.5 text-app-muted transition-colors duration-150 hover:text-app-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M9.5 6H2.5M5.5 9L2.5 6L5.5 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to orders
      </Link>

      {/* What this order is. Recognisable, but not the loudest thing — the
          amount below outranks it, because that is what the reader came for. */}
      <header className="space-y-1">
        <h1 className="app-h1 capitalize text-app-ink">
          {order.cropName}
          <span className="app-h1 font-normal text-app-muted">
            , {order.quantityOrdered.toLocaleString()} {order.unit.toLowerCase()}
          </span>
        </h1>
        <p className="app-meta text-app-faint">
          <span className="app-data-m">{order.orderReferenceId}</span> · from{' '}
          {order.farmer.firstName} {order.farmer.lastName} · placed {formatDate(order.createdAt)}
        </p>
      </header>

      {/* ── 1 · The statement ─────────────────────────────────────────────── */}
      <MoneyStatement
        label={money.label}
        amountKES={order.totalAmountKES}
        status={money.headline}
        tone={money.tone}
        evidence={
          <>
            {order.mpesaTransactionId && (
              <span>
                M-Pesa receipt{' '}
                <span className="app-data-m text-app-muted">{order.mpesaTransactionId}</span>
              </span>
            )}
            {order.isSimulated && <SimulationNotice mode={paymentMode} variant="badge" />}
          </>
        }
      />

      {/* A live review is an interruption to the story, not a stage of it, so it
          stays an alert. It is the one thing that outranks the next step. */}
      {activeMediation && (
        <Alert tone="warning">
          <span className="app-body-strong">UmojaHub is stepping in.</span> Our team{' '}
          {activeMediation.status === MediationRequestStatus.IN_REVIEW
            ? 'is reviewing'
            : 'has received'}{' '}
          {activeMediation.initiatedBy === MediationInitiator.BUYER
            ? 'your report'
            : `a report from ${order.farmer.firstName}`}{' '}
          ({MEDIATION_CATEGORY_LABEL[activeMediation.category]}). Nothing moves until it is decided.
        </Alert>
      )}

      {/* ── 2 · The next step ─────────────────────────────────────────────── */}

      {order.paymentStatus === OrderPaymentStatus.PENDING_PAYMENT && (
        <NextStep
          title="Waiting for your payment"
          consequence={
            isSimulated
              ? 'The payment request has been sent and is being processed. This page updates on its own, and no PIN is requested on your handset.'
              : 'Check your phone and enter your M-Pesa PIN. This page updates on its own once M-Pesa answers.'
          }
        >
          <div className="space-y-3">
            <SimulationNotice mode={paymentMode} />
            {paymentActionError && <Alert tone="danger">{paymentActionError}</Alert>}
            <Button
              variant="secondary"
              isLoading={paymentActionState === 'submitting'}
              onClick={() => void handlePaymentAction('CANCEL')}
            >
              Cancel this order
            </Button>
          </div>
        </NextStep>
      )}

      {order.paymentStatus === OrderPaymentStatus.FAILED && (
        <NextStep title="Pay for this order again" consequence={money.releasedBy}>
          <div className="space-y-3">
            {paymentActionError && <Alert tone="danger">{paymentActionError}</Alert>}
            <Button
              isLoading={paymentActionState === 'submitting'}
              onClick={() => void handlePaymentAction('RETRY')}
            >
              Try payment again
            </Button>
          </div>
        </NextStep>
      )}

      {/* No button, because there is genuinely nothing for the buyer to do and
          the one thing they might try — paying again — is the wrong move. */}
      {order.paymentStatus === OrderPaymentStatus.UNRESOLVED && (
        <NextStep title="While we check" consequence={money.releasedBy} />
      )}

      {order.paymentStatus === OrderPaymentStatus.PAID &&
        order.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT && (
          <NextStep
            title="Confirm receipt"
            consequence={
              openMediation
                ? 'Confirming would release the payment to the farmer, which is the very thing under review, so it is paused until UmojaHub decides.'
                : money.releasedBy
            }
          >
            <div className="space-y-3">
              {order.fulfillmentStage && (
                <p className="app-meta text-app-muted">
                  Latest from {order.farmer.firstName}:{' '}
                  <span className="text-app-ink">
                    {FULFILLMENT_STAGE_LABEL[order.fulfillmentStage]}
                  </span>
                </p>
              )}
              {receiveError && <Alert tone="danger">{receiveError}</Alert>}
              {!openMediation && (
                <Button
                  isLoading={receiveState === 'submitting'}
                  onClick={() => void handleMarkReceived()}
                >
                  Mark as received
                </Button>
              )}
            </div>
          </NextStep>
        )}

      {order.fulfillmentStatus === OrderFulfillmentStatus.COMPLETED && !hasRated && (
        <NextStep
          title={`Rate ${order.farmer.firstName}`}
          consequence="Your rating feeds their trust score, which is what other buyers see before they order. It is the last thing this order needs."
        >
          <form onSubmit={(e) => void handleRatingSubmit(e)} className="space-y-4">
            <div className="flex gap-1" role="group" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingForm((prev) => ({ ...prev, rating: star }))}
                  aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                  aria-pressed={ratingForm.rating >= star}
                  className="rounded-app-cell px-0.5 text-2xl leading-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring"
                >
                  <span className={ratingForm.rating >= star ? 'text-app-brand' : 'text-app-faint'}>
                    ★
                  </span>
                </button>
              ))}
            </div>

            <Textarea
              label="Comment (optional)"
              rows={3}
              value={ratingForm.comment}
              onChange={(e) => setRatingForm((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder="What was the produce like?"
            />

            {ratingError && <Alert tone="danger">{ratingError}</Alert>}

            <Button
              type="submit"
              isLoading={ratingState === 'submitting'}
              disabled={ratingForm.rating === 0}
            >
              Submit rating
            </Button>
          </form>
        </NextStep>
      )}

      {/* ── 3 · The journey ───────────────────────────────────────────────── */}
      <section className="space-y-4 border-t border-app-hairline pt-6" aria-label="Order progress">
        <h2 className="app-h2 text-app-ink">How this order is going</h2>
        <OrderTimelineDetailed
          paymentStatus={order.paymentStatus}
          fulfillmentStatus={order.fulfillmentStatus}
          createdAt={order.createdAt}
          paidAt={order.paidAt}
          confirmedByFarmerAt={order.confirmedByFarmerAt}
          receivedByBuyerAt={order.receivedByBuyerAt}
          viewer="BUYER"
          hasOpenMediation={openMediation}
        />
      </section>

      {/* The case itself is a real sub-document — two people's accounts and their
          photographs — so it keeps its container. */}
      {mediation && (
        <MediationPanel
          orderId={order._id}
          mediation={mediation}
          viewerRole={Role.BUYER}
          onResponded={() => void fetchMediation()}
        />
      )}

      {/* ── 4 · The detail ────────────────────────────────────────────────── */}
      <div className="border-b border-app-hairline">
        <Disclosure summary="Order details">
          <DataList>
            <DataItem label="Produce">
              <span className="capitalize">{order.cropName}</span>
            </DataItem>
            <DataItem label="Quantity" numeric>
              {order.quantityOrdered.toLocaleString()} {order.unit.toLowerCase()}
            </DataItem>
            <DataItem label="Total" numeric>
              KSh {order.totalAmountKES.toLocaleString()}
            </DataItem>
            <DataItem label="Farmer">
              {order.farmer.firstName} {order.farmer.lastName}
            </DataItem>
            <DataItem label="Order placed">{formatDateTime(order.createdAt)}</DataItem>
          </DataList>
        </Disclosure>

        {isPaid && (
          <Disclosure summary="Payment details">
            <div className="space-y-4">
              <SimulationNotice mode={paymentMode} />
              <DataList>
                {/* Named for what it is. A `DEMO-` reference is not an M-Pesa
                    receipt and must not be labelled as one; a buyer matching
                    this against their handset would find nothing. */}
                <DataItem
                  label={
                    paymentMode === 'demo-bridge' ? 'Demonstration reference' : 'M-Pesa receipt'
                  }
                  numeric
                >
                  {order.mpesaTransactionId ?? '—'}
                </DataItem>
                <DataItem label="Order reference" numeric>
                  {order.orderReferenceId}
                </DataItem>
                <DataItem label="Escrow reference" numeric>
                  {escrowReferenceFor(order.orderReferenceId)}
                </DataItem>
                <DataItem label="Method">M-PESA</DataItem>
                <DataItem label="Paid on">{formatDateTime(order.paidAt)}</DataItem>
                {/* The provider references. These are what Safaricom support
                    asks for, and on a sandbox order they are the evidence that
                    the request genuinely reached Daraja. */}
                {order.mpesaCheckoutRequestId && (
                  <DataItem label="Checkout request" numeric>
                    {order.mpesaCheckoutRequestId}
                  </DataItem>
                )}
                {order.mpesaMerchantRequestId && (
                  <DataItem label="Merchant request" numeric>
                    {order.mpesaMerchantRequestId}
                  </DataItem>
                )}
                <DataItem label="Payment route">{paymentMode}</DataItem>
              </DataList>
            </div>
            <div className="pt-4">
              <Link
                href={`/dashboard/buyer/orders/${order._id}/receipt`}
                className="app-body inline-flex items-center gap-1.5 text-app-brand transition-colors duration-150 hover:text-app-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring"
              >
                View the full receipt and transaction history
                <span aria-hidden>→</span>
              </Link>
            </div>
          </Disclosure>
        )}

        <Disclosure summary="If something goes wrong">
          <div className="space-y-4">
            <p className="app-body max-w-app-prose text-pretty text-app-muted">
              {money.ifItGoesWrong}
            </p>

            {order.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT &&
              !activeMediation &&
              (canEscalate ? (
                escalateOpen ? (
                  <EscalateForm
                    orderId={order._id}
                    categories={BUYER_MEDIATION_CATEGORIES}
                    onFiled={() => {
                      setEscalateOpen(false);
                      void fetchMediation();
                    }}
                  />
                ) : (
                  // Opens the form; the form's own button is the one that asks.
                  // Naming both "Ask UmojaHub to step in" put the same label on
                  // a disclosure and on a submit that files a case.
                  <Button variant="secondary" onClick={() => setEscalateOpen(true)}>
                    Report a problem
                  </Button>
                )
              ) : (
                <p className="app-meta text-app-faint">
                  Give {order.farmer.firstName} time to fulfil the order first. You can ask UmojaHub
                  to step in from {formatDate(eligibleAtMs ? new Date(eligibleAtMs).toISOString() : null)}.
                </p>
              ))}
          </div>
        </Disclosure>
      </div>

      {order.fulfillmentStatus === OrderFulfillmentStatus.COMPLETED && hasRated && (
        <Card pad="tight">
          <p className="app-body text-app-muted">
            You rated this order. That rating is part of {order.farmer.firstName}&apos;s trust score.
          </p>
        </Card>
      )}
    </Page>
  );
}
