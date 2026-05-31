'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Role,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
} from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
    }
  }, [status, session, router, fetchOrder]);

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
