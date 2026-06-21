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
  MEDIATION_ESCALATION_HOURS,
} from '@/types';
import {
  Button,
  Select,
  Textarea,
  Alert,
  StatusPill,
  type StatusState,
} from '@/components/app';
import { cn } from '@/lib/cn';
import { OrderTimelineDetailed } from '@/components/foodhub/OrderTimeline';

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
}

interface IOrdersResponse {
  orders: IBuyerOrder[];
}

interface IMediation {
  _id: string;
  status: MediationRequestStatus;
  category: MediationCategory;
  description: string;
  resolutionNote?: string | null;
  createdAt: string;
}

const MEDIATION_CATEGORY_LABEL: Record<MediationCategory, string> = {
  [MediationCategory.NOT_DELIVERED]: 'Order not delivered',
  [MediationCategory.QUALITY_ISSUE]: 'Quality issue',
  [MediationCategory.WRONG_QUANTITY]: 'Wrong quantity',
  [MediationCategory.OTHER]: 'Other',
};

interface IPaymentStatusResponse {
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
}

type PageState = 'loading' | 'ready' | 'error' | 'not_found';
type ActionState = 'idle' | 'submitting' | 'error';

function paymentPillState(status: OrderPaymentStatus): StatusState {
  if (status === OrderPaymentStatus.PAID) return 'completed';
  if (status === OrderPaymentStatus.FAILED) return 'denied';
  return 'pending';
}

function fulfillmentPillState(status: OrderFulfillmentStatus): StatusState {
  if (status === OrderFulfillmentStatus.COMPLETED) return 'completed';
  if (status === OrderFulfillmentStatus.RECEIVED) return 'completed';
  if (status === OrderFulfillmentStatus.DISPUTED) return 'denied';
  if (status === OrderFulfillmentStatus.IN_FULFILLMENT) return 'in-transit';
  return 'pending';
}

const PAYMENT_LABEL: Record<OrderPaymentStatus, string> = {
  [OrderPaymentStatus.PENDING_PAYMENT]: 'Awaiting payment',
  [OrderPaymentStatus.PAID]: 'Paid',
  [OrderPaymentStatus.FAILED]: 'Payment failed',
  [OrderPaymentStatus.REFUNDED]: 'Refunded',
};

const FULFILLMENT_LABEL: Record<OrderFulfillmentStatus, string> = {
  [OrderFulfillmentStatus.AWAITING_PAYMENT]: 'Awaiting payment',
  [OrderFulfillmentStatus.IN_FULFILLMENT]: 'In fulfillment',
  [OrderFulfillmentStatus.RECEIVED]: 'Received',
  [OrderFulfillmentStatus.COMPLETED]: 'Completed',
  [OrderFulfillmentStatus.DISPUTED]: 'Disputed',
};

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
  const [mediationForm, setMediationForm] = useState<{
    category: MediationCategory;
    description: string;
  }>({ category: MediationCategory.NOT_DELIVERED, description: '' });
  const [mediationState, setMediationState] = useState<ActionState>('idle');
  const [mediationError, setMediationError] = useState<string | null>(null);

  const pollingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingTimer.current !== null) {
      clearInterval(pollingTimer.current);
      pollingTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return stopPolling;
  }, [stopPolling]);

  const fetchOrder = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const data = (await res.json()) as IOrdersResponse;
      const match = data.orders.find((o) => o._id === params.orderId);
      if (!match) {
        setPageState('not_found');
        return;
      }
      setOrder(match);
      setHasRated(match.hasRated);
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
      // Non-fatal — the page still renders without the mediation banner.
    }
  }, [params.orderId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
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

  // Start polling if order is PENDING_PAYMENT on load
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
          if (data.paymentStatus !== OrderPaymentStatus.PENDING_PAYMENT) {
            stopPolling();
            setOrder((prev) =>
              prev
                ? {
                    ...prev,
                    paymentStatus: data.paymentStatus,
                    fulfillmentStatus: data.fulfillmentStatus,
                  }
                : prev
            );
          }
        } catch {
          // transient error — continue polling
        }
      })();
    }, 3_000);

    pollingTimer.current = timer;
    return stopPolling;
  }, [pageState, order, stopPolling]);

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

  async function submitMediation(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!order) return;
    setMediationError(null);
    if (mediationForm.description.trim().length < 20) {
      setMediationError('Describe the problem in at least 20 characters.');
      return;
    }
    setMediationState('submitting');
    try {
      const res = await fetch(`/api/orders/${order._id}/mediation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: mediationForm.category,
          description: mediationForm.description.trim(),
        }),
      });
      const body = (await res.json()) as { data?: IMediation; error?: string };
      if (!res.ok) {
        setMediationError(body.error ?? 'Could not file your escalation.');
        setMediationState('error');
        return;
      }
      if (body.data) setMediation(body.data);
      setEscalateOpen(false);
      setMediationState('idle');
    } catch {
      setMediationError('Something went wrong. Please try again.');
      setMediationState('error');
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────
  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="space-y-1.5">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-7 w-40 rounded" />
        </div>
        <div className="skeleton h-40 rounded-app-card" />
        <div className="skeleton h-48 rounded-app-card" />
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (pageState === 'not_found' || !order) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
          <p className="app-body text-app-muted">Order not found.</p>
          <Link
            href="/dashboard/buyer/orders"
            className="app-body mt-4 inline-flex text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
          >
            ← Back to orders
          </Link>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="max-w-2xl">
        <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
          <p className="app-body mb-3 text-app-muted">Failed to load order.</p>
          <Button variant="secondary" onClick={() => void fetchOrder()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // ── Ready ────────────────────────────────────────────────────────────────
  // Mediation is decoupled from the order state machine: an OPEN/IN_REVIEW
  // escalation only surfaces a banner; it never changes the order's status.
  const activeMediation =
    mediation &&
    (mediation.status === MediationRequestStatus.OPEN ||
      mediation.status === MediationRequestStatus.IN_REVIEW)
      ? mediation
      : null;

  // 48-h client gate (mirrors the server's MEDIATION_TOO_EARLY rule): mediation
  // opens 48h after payment, giving the farmer time to fulfil first.
  const paidMs = order.paidAt ? new Date(order.paidAt).getTime() : null;
  const eligibleAtMs = paidMs !== null ? paidMs + MEDIATION_ESCALATION_HOURS * 60 * 60 * 1000 : null;
  const canEscalate = eligibleAtMs !== null && Date.now() >= eligibleAtMs;
  const eligibleDate =
    eligibleAtMs !== null
      ? new Date(eligibleAtMs).toLocaleDateString('en-KE', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

  const detailRows: { label: string; value: string; mono: boolean }[] = [
    { label: 'Crop', value: order.cropName, mono: false },
    {
      label: 'Quantity',
      value: `${order.quantityOrdered.toLocaleString()} ${order.unit.toLowerCase()}`,
      mono: true,
    },
    { label: 'Total', value: `KSh ${order.totalAmountKES.toLocaleString()}`, mono: true },
    { label: 'Farmer', value: `${order.farmer.firstName} ${order.farmer.lastName}`, mono: false },
    {
      label: 'Placed',
      value: new Date(order.createdAt).toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      mono: false,
    },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/buyer/orders"
        className="app-body inline-flex items-center gap-1.5 text-app-muted transition-colors duration-150 hover:text-app-ink"
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

      {/* Page header */}
      <div>
        <p className="app-data-m text-app-faint">{order.orderReferenceId}</p>
        <h1 className="app-h1 capitalize text-app-ink">{order.cropName}</h1>
        <div className="mt-2 flex items-center gap-2">
          <StatusPill
            state={paymentPillState(order.paymentStatus)}
            label={PAYMENT_LABEL[order.paymentStatus]}
          />
          <StatusPill
            state={fulfillmentPillState(order.fulfillmentStatus)}
            label={FULFILLMENT_LABEL[order.fulfillmentStatus]}
          />
        </div>
      </div>

      {/* UNDER_MEDIATION alert bar — decoupled from order state */}
      {activeMediation && (
        <Alert tone="warning">
          <span className="app-body-strong">Under platform mediation.</span> Our mediation team{' '}
          {activeMediation.status === MediationRequestStatus.IN_REVIEW
            ? 'is reviewing'
            : 'has received'}{' '}
          your escalation ({MEDIATION_CATEGORY_LABEL[activeMediation.category]}). Your order status
          is unchanged while this is resolved.
        </Alert>
      )}

      {/* Progress timeline */}
      <div className="space-y-3 rounded-app-card border border-app-hairline bg-app-card p-4">
        <p className="app-label text-app-muted">Progress</p>
        <OrderTimelineDetailed
          paymentStatus={order.paymentStatus}
          fulfillmentStatus={order.fulfillmentStatus}
          paidAt={order.paidAt}
          confirmedByFarmerAt={order.confirmedByFarmerAt}
          receivedByBuyerAt={order.receivedByBuyerAt}
        />
      </div>

      {/* Order details */}
      <div className="rounded-app-card border border-app-hairline bg-app-card">
        <div className="px-4 pb-2 pt-4">
          <p className="app-label text-app-muted">Order details</p>
        </div>
        {detailRows.map(({ label, value, mono }) => (
          <div
            key={label}
            className="flex items-center justify-between border-t border-app-hairline px-4 py-2.5"
          >
            <span className="app-body text-app-muted">{label}</span>
            <span
              className={cn(
                'capitalize text-app-ink',
                mono ? 'app-data-m' : 'app-body'
              )}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Action zone ─────────────────────────────────────────────────── */}

      {/* PENDING_PAYMENT — waiting for M-Pesa */}
      {order.paymentStatus === OrderPaymentStatus.PENDING_PAYMENT && (
        <div className="space-y-2 rounded-app-card border border-app-hairline bg-app-card p-4">
          <div className="flex items-center gap-2.5">
            <div
              className="h-2 w-2 flex-shrink-0 animate-pulse rounded-app-pill bg-app-warning"
              aria-hidden="true"
            />
            <p className="app-body-strong text-app-ink">Awaiting payment</p>
          </div>
          <p className="app-body text-app-muted">
            Check your phone and enter your M-Pesa PIN to complete this order.
          </p>
        </div>
      )}

      {/* IN_FULFILLMENT — mark as received */}
      {order.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT && (
        <div className="space-y-3 rounded-app-card border border-app-hairline bg-app-card p-4">
          <p className="app-label text-app-muted">Confirm receipt</p>
          <p className="app-body text-app-muted">
            Have you received your order from {order.farmer.firstName}?
          </p>
          {receiveError && <Alert tone="danger">{receiveError}</Alert>}
          <Button
            isLoading={receiveState === 'submitting'}
            onClick={() => void handleMarkReceived()}
            className="w-full"
          >
            Mark as received
          </Button>
        </div>
      )}

      {/* IN_FULFILLMENT + no active escalation — platform mediation (48-h gate) */}
      {order.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT && !activeMediation && (
        <div className="space-y-3 rounded-app-card border border-app-hairline bg-app-card p-4">
          <p className="app-label text-app-muted">Problem with this order?</p>

          {!canEscalate ? (
            <p className="app-body text-app-muted">
              Give {order.farmer.firstName} time to fulfil your order. If it still hasn&apos;t
              arrived, you can escalate to platform mediation from {eligibleDate}.
            </p>
          ) : !escalateOpen ? (
            <>
              <p className="app-body text-app-muted">
                Haven&apos;t received your order? Our team can step in to help resolve it.
              </p>
              <Button variant="secondary" onClick={() => setEscalateOpen(true)} className="w-full">
                Escalate to Platform Mediation
              </Button>
            </>
          ) : (
            <form onSubmit={(e) => void submitMediation(e)} className="space-y-3">
              <Select
                label="What went wrong?"
                value={mediationForm.category}
                onChange={(e) =>
                  setMediationForm((prev) => ({
                    ...prev,
                    category: e.target.value as MediationCategory,
                  }))
                }
              >
                {Object.values(MediationCategory).map((c) => (
                  <option key={c} value={c}>
                    {MEDIATION_CATEGORY_LABEL[c]}
                  </option>
                ))}
              </Select>

              <Textarea
                label="Describe the problem (at least 20 characters)"
                rows={4}
                value={mediationForm.description}
                onChange={(e) =>
                  setMediationForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Tell our team what happened so we can help."
              />

              {mediationError && <Alert tone="danger">{mediationError}</Alert>}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEscalateOpen(false);
                    setMediationError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={mediationState === 'submitting'}
                  className="flex-1"
                >
                  Submit escalation
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* COMPLETED + not rated — rating form */}
      {order.fulfillmentStatus === OrderFulfillmentStatus.COMPLETED && !hasRated && (
        <div className="space-y-4 rounded-app-card border border-app-hairline bg-app-card p-4">
          <p className="app-label text-app-muted">Rate this order</p>
          <form onSubmit={(e) => void handleRatingSubmit(e)} className="space-y-4">
            {/* Star selector */}
            <div>
              <p className="app-body mb-2 text-app-muted">
                How was your experience with {order.farmer.firstName}?
              </p>
              <div className="flex gap-1" role="group" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingForm((prev) => ({ ...prev, rating: star }))}
                    aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                    className="rounded-app-cell text-2xl leading-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-app-ring"
                  >
                    <span className={ratingForm.rating >= star ? 'text-app-brand' : 'text-app-faint'}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <Textarea
              label="Comment (optional)"
              rows={3}
              value={ratingForm.comment}
              onChange={(e) => setRatingForm((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience..."
            />

            {ratingError && <Alert tone="danger">{ratingError}</Alert>}

            <Button
              type="submit"
              isLoading={ratingState === 'submitting'}
              disabled={ratingForm.rating === 0}
              className="w-full"
            >
              Submit rating
            </Button>
          </form>
        </div>
      )}

      {/* COMPLETED + already rated */}
      {order.fulfillmentStatus === OrderFulfillmentStatus.COMPLETED && hasRated && (
        <div className="rounded-app-card border border-app-hairline bg-app-card p-4">
          <p className="app-body text-app-muted">You have rated this order.</p>
        </div>
      )}
    </div>
  );
}
