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
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
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

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'status' | 'tier-farmer' | 'tier-student' | 'project-status';

function paymentBadgeVariant(status: OrderPaymentStatus): BadgeVariant {
  if (status === OrderPaymentStatus.PAID) return 'success';
  if (status === OrderPaymentStatus.FAILED) return 'error';
  if (status === OrderPaymentStatus.PENDING_PAYMENT) return 'warning';
  return 'neutral';
}

function fulfillmentBadgeVariant(status: OrderFulfillmentStatus): BadgeVariant {
  if (status === OrderFulfillmentStatus.COMPLETED) return 'success';
  if (status === OrderFulfillmentStatus.DISPUTED) return 'error';
  if (status === OrderFulfillmentStatus.IN_FULFILLMENT) return 'neutral';
  return 'neutral';
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
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="space-y-1.5">
            <div className="h-3 w-20 bg-surface-secondary rounded-[4px] animate-pulse" />
            <div className="h-7 w-40 bg-surface-secondary rounded-[4px] animate-pulse" />
          </div>
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 bg-surface-secondary rounded-[4px] animate-pulse" />
                <div className="h-4 w-32 bg-surface-secondary rounded-[4px] animate-pulse" />
              </div>
            ))}
          </div>
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-full bg-surface-secondary rounded-[4px] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (pageState === 'not_found' || !order) {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-text-secondary">Order not found.</p>
            <Link
              href="/dashboard/buyer/orders"
              className="inline-flex mt-4 text-t5 font-body text-accent-green hover:text-accent-green/80 transition-colors duration-150"
            >
              ← Back to orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-text-secondary">Failed to load order.</p>
            <div className="mt-3">
              <Button variant="ghost" size="sm" onClick={() => void fetchOrder()}>
                Retry
              </Button>
            </div>
          </div>
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

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Back link */}
        <Link
          href="/dashboard/buyer/orders"
          className="inline-flex items-center gap-1.5 text-t5 font-body text-text-secondary hover:text-text-primary transition-colors duration-150"
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
          <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
            {order.orderReferenceId}
          </p>
          <h1 className="text-t2 font-heading font-semibold text-text-primary tracking-tight capitalize">
            {order.cropName}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant={paymentBadgeVariant(order.paymentStatus)}
              label={PAYMENT_LABEL[order.paymentStatus]}
            />
            <Badge
              variant={fulfillmentBadgeVariant(order.fulfillmentStatus)}
              label={FULFILLMENT_LABEL[order.fulfillmentStatus]}
            />
          </div>
        </div>

        {/* UNDER_MEDIATION alert bar — decoupled from order state */}
        {activeMediation && (
          <div className="bg-yellow-950/40 border border-yellow-800/40 rounded-[4px] p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" aria-hidden="true" />
              <p className="text-t4 font-body font-medium text-yellow-400">
                Under platform mediation
              </p>
            </div>
            <p className="text-t5 font-body text-text-secondary mt-2">
              Our mediation team{' '}
              {activeMediation.status === MediationRequestStatus.IN_REVIEW
                ? 'is reviewing'
                : 'has received'}{' '}
              your escalation ({MEDIATION_CATEGORY_LABEL[activeMediation.category]}). Your order
              status is unchanged while this is resolved.
            </p>
          </div>
        )}

        {/* Progress timeline */}
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
          <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
            Progress
          </p>
          <OrderTimelineDetailed
            paymentStatus={order.paymentStatus}
            fulfillmentStatus={order.fulfillmentStatus}
            paidAt={order.paidAt}
            confirmedByFarmerAt={order.confirmedByFarmerAt}
            receivedByBuyerAt={order.receivedByBuyerAt}
          />
        </div>

        {/* Order details */}
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px]">
          <div className="px-4 pt-4 pb-2">
            <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Order details
            </p>
          </div>
          {[
            { label: 'Crop', value: order.cropName, mono: false },
            {
              label: 'Quantity',
              value: `${order.quantityOrdered.toLocaleString()} ${order.unit.toLowerCase()}`,
              mono: true,
            },
            { label: 'Total', value: `KES ${order.totalAmountKES.toLocaleString()}`, mono: true },
            { label: 'Farmer', value: `${order.farmer.firstName} ${order.farmer.lastName}`, mono: false },
            { label: 'Placed', value: new Date(order.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }), mono: false },
          ].map(({ label, value, mono }) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-800/50"
            >
              <span className="text-t5 font-body text-text-secondary">{label}</span>
              <span
                className={[
                  'text-t5 text-text-primary capitalize',
                  mono ? 'font-mono tabular-nums' : 'font-body',
                ].join(' ')}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Action zone ─────────────────────────────────────────────────── */}

        {/* PENDING_PAYMENT — waiting for M-Pesa */}
        {order.paymentStatus === OrderPaymentStatus.PENDING_PAYMENT && (
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" aria-hidden="true" />
              <p className="text-t4 font-body font-medium text-text-primary">
                Awaiting payment
              </p>
            </div>
            <p className="text-t5 font-body text-text-secondary">
              Check your phone and enter your M-Pesa PIN to complete this order.
            </p>
          </div>
        )}

        {/* IN_FULFILLMENT — mark as received */}
        {order.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT && (
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
            <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Confirm receipt
            </p>
            <p className="text-t5 font-body text-text-secondary">
              Have you received your order from {order.farmer.firstName}?
            </p>
            {receiveError && (
              <p className="text-t5 font-body text-red-400" role="alert">
                {receiveError}
              </p>
            )}
            <Button
              variant="primary"
              size="md"
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
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
            <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Problem with this order?
            </p>

            {!canEscalate ? (
              <p className="text-t5 font-body text-text-secondary">
                Give {order.farmer.firstName} time to fulfil your order. If it still hasn&apos;t
                arrived, you can escalate to platform mediation from {eligibleDate}.
              </p>
            ) : !escalateOpen ? (
              <>
                <p className="text-t5 font-body text-text-secondary">
                  Haven&apos;t received your order? Our team can step in to help resolve it.
                </p>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setEscalateOpen(true)}
                  className="w-full"
                >
                  Escalate to Platform Mediation
                </Button>
              </>
            ) : (
              <form onSubmit={(e) => void submitMediation(e)} className="space-y-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="mediation-category"
                    className="text-t5 font-body text-text-secondary block"
                  >
                    What went wrong?
                  </label>
                  <select
                    id="mediation-category"
                    value={mediationForm.category}
                    onChange={(e) =>
                      setMediationForm((prev) => ({
                        ...prev,
                        category: e.target.value as MediationCategory,
                      }))
                    }
                    className="w-full min-h-[44px] bg-surface-secondary border border-zinc-800/50 rounded-[4px] px-3 py-2 text-t5 font-body text-text-primary focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all duration-150"
                  >
                    {Object.values(MediationCategory).map((c) => (
                      <option key={c} value={c} className="bg-surface-elevated">
                        {MEDIATION_CATEGORY_LABEL[c]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="mediation-description"
                    className="text-t5 font-body text-text-secondary block"
                  >
                    Describe the problem{' '}
                    <span className="text-text-disabled">(at least 20 characters)</span>
                  </label>
                  <textarea
                    id="mediation-description"
                    rows={4}
                    value={mediationForm.description}
                    onChange={(e) =>
                      setMediationForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full bg-surface-secondary border border-zinc-800/50 rounded-[4px] px-3 py-2 text-t5 font-body text-text-primary placeholder:text-text-disabled resize-none focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all duration-150"
                    placeholder="Tell our team what happened so we can help."
                  />
                </div>

                {mediationError && (
                  <p className="text-t5 font-body text-red-400" role="alert">
                    {mediationError}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setEscalateOpen(false);
                      setMediationError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
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
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-4">
            <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Rate this order
            </p>
            <form onSubmit={(e) => void handleRatingSubmit(e)} className="space-y-4">
              {/* Star selector */}
              <div>
                <p className="text-t5 font-body text-text-secondary mb-2">
                  How was your experience with {order.farmer.firstName}?
                </p>
                <div className="flex gap-1" role="group" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingForm((prev) => ({ ...prev, rating: star }))}
                      aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                      className="text-2xl leading-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-green rounded-[2px]"
                    >
                      <span
                        className={ratingForm.rating >= star ? 'text-accent-green' : 'text-text-disabled'}
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <label
                  htmlFor="rating-comment"
                  className="text-t5 font-body text-text-secondary block"
                >
                  Comment{' '}
                  <span className="text-text-disabled">(optional)</span>
                </label>
                <textarea
                  id="rating-comment"
                  rows={3}
                  value={ratingForm.comment}
                  onChange={(e) => setRatingForm((prev) => ({ ...prev, comment: e.target.value }))}
                  className="w-full bg-surface-secondary border border-zinc-800/50 rounded-[4px] px-3 py-2 text-t5 font-body text-text-primary placeholder:text-text-disabled resize-none focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all duration-150"
                  placeholder="Share your experience..."
                />
              </div>

              {ratingError && (
                <p className="text-t5 font-body text-red-400" role="alert">
                  {ratingError}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
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
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4">
            <p className="text-t5 font-body text-text-secondary">
              You have rated this order.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
