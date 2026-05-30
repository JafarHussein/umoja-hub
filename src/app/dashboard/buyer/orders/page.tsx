'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, OrderPaymentStatus, OrderFulfillmentStatus } from '@/types';

interface IBuyerOrder {
  _id: string;
  orderReferenceId: string;
  cropName: string;
  quantityOrdered: number;
  unit: string;
  totalAmountKES: number;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  mpesaCheckoutRequestId: string | null;
  farmer: { firstName: string; lastName: string };
  hasRated: boolean;
  createdAt: string;
}

interface IOrdersResponse {
  orders: IBuyerOrder[];
}

interface IPaymentStatusResponse {
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
}

interface IRatingForm {
  rating: number;
  comment: string;
}

type PageState = 'loading' | 'ready' | 'error';
type ActionState = 'idle' | 'submitting' | 'error';

const FULFILLMENT_LABEL: Record<OrderFulfillmentStatus, string> = {
  [OrderFulfillmentStatus.AWAITING_PAYMENT]: 'Awaiting payment',
  [OrderFulfillmentStatus.IN_FULFILLMENT]: 'In fulfillment',
  [OrderFulfillmentStatus.RECEIVED]: 'Received',
  [OrderFulfillmentStatus.COMPLETED]: 'Completed',
  [OrderFulfillmentStatus.DISPUTED]: 'Disputed',
};

export default function BuyerOrdersPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [orders, setOrders] = useState<IBuyerOrder[]>([]);
  const [actionState, setActionState] = useState<Record<string, ActionState>>({});
  const [actionError, setActionError] = useState<Record<string, string | null>>({});
  const [ratingForms, setRatingForms] = useState<Record<string, IRatingForm>>({});

  const ordersRef = useRef<IBuyerOrder[]>([]);
  ordersRef.current = orders;

  const pollingTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const fetchOrders = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Request failed');
      const data = (await res.json()) as IOrdersResponse;
      setOrders(data.orders);
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
      if (session.user.role !== Role.BUYER) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchOrders();
    }
  }, [status, session, router, fetchOrders]);

  // Start payment pollers for PENDING_PAYMENT orders on initial load
  useEffect(() => {
    if (pageState !== 'ready') return;

    const timers = pollingTimers.current;
    timers.forEach((timer) => clearInterval(timer));
    timers.clear();

    ordersRef.current.forEach((order) => {
      if (order.paymentStatus !== OrderPaymentStatus.PENDING_PAYMENT) return;

      const orderId = order._id;
      const deadline = Date.now() + 90_000;

      const timer = setInterval(() => {
        if (Date.now() >= deadline) {
          clearInterval(timers.get(orderId));
          timers.delete(orderId);
          return;
        }
        void (async () => {
          try {
            const res = await fetch(`/api/orders/${orderId}/payment-status`);
            if (!res.ok) return;
            const data = (await res.json()) as IPaymentStatusResponse;
            if (data.paymentStatus !== OrderPaymentStatus.PENDING_PAYMENT) {
              clearInterval(timers.get(orderId));
              timers.delete(orderId);
              setOrders((prev) =>
                prev.map((o) =>
                  o._id === orderId
                    ? { ...o, paymentStatus: data.paymentStatus, fulfillmentStatus: data.fulfillmentStatus }
                    : o
                )
              );
            }
          } catch {
            // ignore transient poll errors
          }
        })();
      }, 5_000);

      timers.set(orderId, timer);
    });

    return () => {
      timers.forEach((timer) => clearInterval(timer));
      timers.clear();
    };
  }, [pageState]); // intentionally excludes orders — pollers start once on ready

  async function handleMarkReceived(orderId: string): Promise<void> {
    setActionState((prev) => ({ ...prev, [orderId]: 'submitting' }));
    setActionError((prev) => ({ ...prev, [orderId]: null }));
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fulfillmentStatus: OrderFulfillmentStatus.RECEIVED }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Request failed.');
      }
      setActionState((prev) => ({ ...prev, [orderId]: 'idle' }));
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, fulfillmentStatus: OrderFulfillmentStatus.COMPLETED } : o
        )
      );
    } catch (err) {
      setActionState((prev) => ({ ...prev, [orderId]: 'error' }));
      setActionError((prev) => ({
        ...prev,
        [orderId]: err instanceof Error ? err.message : 'An error occurred.',
      }));
    }
  }

  async function handleRatingSubmit(
    e: React.FormEvent<HTMLFormElement>,
    orderId: string
  ): Promise<void> {
    e.preventDefault();
    const form = ratingForms[orderId];
    if (!form || form.rating === 0) return;

    const key = `rating_${orderId}`;
    setActionState((prev) => ({ ...prev, [key]: 'submitting' }));
    setActionError((prev) => ({ ...prev, [key]: null }));
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          rating: form.rating,
          ...(form.comment.trim() && { comment: form.comment.trim() }),
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Rating submission failed.');
      }
      setActionState((prev) => ({ ...prev, [key]: 'idle' }));
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, hasRated: true } : o))
      );
    } catch (err) {
      setActionState((prev) => ({ ...prev, [key]: 'error' }));
      setActionError((prev) => ({
        ...prev,
        [key]: err instanceof Error ? err.message : 'An error occurred.',
      }));
    }
  }

  if (status === 'loading' || pageState === 'loading') {
    return <p className="p-4">Loading...</p>;
  }

  if (pageState === 'error') {
    return (
      <div className="p-4 flex flex-col gap-2">
        <p>Failed to load orders.</p>
        <button type="button" onClick={() => void fetchOrders()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-base font-semibold">My Orders</h1>

      {orders.length === 0 && (
        <p className="text-sm text-gray-500">No orders yet.</p>
      )}

      {orders.map((order) => {
        const ratingKey = `rating_${order._id}`;
        const ratingForm = ratingForms[order._id] ?? { rating: 0, comment: '' };
        const isReceivingAction = actionState[order._id] === 'submitting';
        const isRatingAction = actionState[ratingKey] === 'submitting';

        return (
          <div key={order._id} className="border border-gray-300 flex flex-col gap-0">
            {/* ── Order summary row ─── */}
            <table className="border-collapse text-sm w-full">
              <tbody>
                <tr className="border-b border-gray-300">
                  <th className="px-3 py-2 text-left bg-gray-50 w-36 border-r border-gray-300">
                    Ref
                  </th>
                  <td className="px-3 py-2 font-mono text-xs">{order.orderReferenceId}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="px-3 py-2 text-left bg-gray-50 border-r border-gray-300">
                    Farmer
                  </th>
                  <td className="px-3 py-2">
                    {order.farmer.firstName} {order.farmer.lastName}
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="px-3 py-2 text-left bg-gray-50 border-r border-gray-300">
                    Crop
                  </th>
                  <td className="px-3 py-2">
                    {order.cropName} — {order.quantityOrdered} {order.unit}
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="px-3 py-2 text-left bg-gray-50 border-r border-gray-300">
                    Amount
                  </th>
                  <td className="px-3 py-2">KES {order.totalAmountKES.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="px-3 py-2 text-left bg-gray-50 border-r border-gray-300">
                    Payment
                  </th>
                  <td className="px-3 py-2">{order.paymentStatus}</td>
                </tr>
                <tr>
                  <th className="px-3 py-2 text-left bg-gray-50 border-r border-gray-300">
                    Status
                  </th>
                  <td className="px-3 py-2">
                    {FULFILLMENT_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── Payment pending notice ─── */}
            {order.paymentStatus === OrderPaymentStatus.PENDING_PAYMENT && (
              <div className="px-3 py-2 border-t border-gray-300 text-sm text-gray-600">
                Waiting for M-Pesa payment. Check your phone and enter your PIN.
              </div>
            )}

            {/* ── Mark as received ─── */}
            {order.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT && (
              <div className="px-3 py-2 border-t border-gray-300 flex flex-col gap-1">
                <button
                  type="button"
                  disabled={isReceivingAction}
                  onClick={() => void handleMarkReceived(order._id)}
                  className="self-start border border-gray-400 px-3 py-1 text-sm disabled:opacity-50"
                >
                  {isReceivingAction ? 'Confirming...' : 'Mark as received'}
                </button>
                {actionError[order._id] !== null && actionError[order._id] !== undefined && (
                  <p role="alert" className="text-xs text-red-600">
                    {actionError[order._id]}
                  </p>
                )}
              </div>
            )}

            {/* ── Star rating form ─── */}
            {order.fulfillmentStatus === OrderFulfillmentStatus.COMPLETED &&
              !order.hasRated && (
                <form
                  className="px-3 py-3 border-t border-gray-300 flex flex-col gap-2"
                  onSubmit={(e) => void handleRatingSubmit(e, order._id)}
                >
                  <p className="text-sm font-medium">Rate this farmer</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={[
                          'text-lg leading-none px-1',
                          ratingForm.rating >= star ? 'text-yellow-500' : 'text-gray-300',
                        ].join(' ')}
                        onClick={() =>
                          setRatingForms((prev) => ({
                            ...prev,
                            [order._id]: { ...ratingForm, rating: star },
                          }))
                        }
                        aria-label={`${star} star`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`comment-${order._id}`} className="text-sm">
                      Comment <span className="text-gray-500">(optional)</span>
                    </label>
                    <textarea
                      id={`comment-${order._id}`}
                      rows={2}
                      className="border border-gray-300 px-2 py-1 text-sm resize-none"
                      value={ratingForm.comment}
                      onChange={(e) =>
                        setRatingForms((prev) => ({
                          ...prev,
                          [order._id]: { ...ratingForm, comment: e.target.value },
                        }))
                      }
                    />
                  </div>
                  {actionError[ratingKey] !== null && actionError[ratingKey] !== undefined && (
                    <p role="alert" className="text-xs text-red-600">
                      {actionError[ratingKey]}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isRatingAction || ratingForm.rating === 0}
                    className="self-start border border-gray-400 px-3 py-1 text-sm disabled:opacity-50"
                  >
                    {isRatingAction ? 'Submitting...' : 'Submit rating'}
                  </button>
                </form>
              )}

            {/* ── Already rated ─── */}
            {order.fulfillmentStatus === OrderFulfillmentStatus.COMPLETED &&
              order.hasRated && (
                <div className="px-3 py-2 border-t border-gray-300 text-sm text-gray-500">
                  Rated
                </div>
              )}
          </div>
        );
      })}
    </div>
  );
}
