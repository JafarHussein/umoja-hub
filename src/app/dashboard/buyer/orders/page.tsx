'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Role,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  ORDER_FULFILLMENT_LABEL,
} from '@/types';
import { Button, StatusPill, type StatusState } from '@/components/app';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';

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
}

interface IOrdersResponse {
  orders: IBuyerOrder[];
}

type PageState = 'loading' | 'ready' | 'error';

// Maps the order lifecycle to a trust StatusPill state — status is conveyed by
// icon + shape + text, never colour alone.
function resolvePillState(order: IBuyerOrder): StatusState {
  if (order.fulfillmentStatus === OrderFulfillmentStatus.COMPLETED) return 'completed';
  if (order.fulfillmentStatus === OrderFulfillmentStatus.RECEIVED) return 'completed';
  if (order.fulfillmentStatus === OrderFulfillmentStatus.DISPUTED) return 'denied';
  if (order.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT) return 'in-transit';
  if (order.paymentStatus === OrderPaymentStatus.PENDING_PAYMENT) return 'pending';
  return 'pending';
}

export default function BuyerOrdersPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [orders, setOrders] = useState<IBuyerOrder[]>([]);

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

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="max-w-4xl space-y-6">
        <ListSkeleton rows={5} />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Could not load your orders</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => void fetchOrders()}>
          Retry
        </Button>
      </div>
    );
  }

  // ── Ready ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="app-h1 text-app-ink">My Orders</h1>
        <Link
          href="/marketplace"
          className="app-body text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
        >
          Browse produce →
        </Link>
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="rounded-app-card border border-app-hairline bg-app-card p-10 text-center">
          <p className="app-body text-app-muted">No orders yet.</p>
          <p className="app-meta mt-1 text-app-faint">
            Find produce from verified farmers in the marketplace.
          </p>
          <Link
            href="/marketplace"
            className="app-body mt-4 inline-flex text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
          >
            Go to marketplace →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/dashboard/buyer/orders/${order._id}`}
              className="block transition-colors duration-150 hover:bg-app-sunken focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-app-ring"
            >
              <div className="flex items-center justify-between border-b border-app-hairline px-4 py-3.5 last:border-0">
                {/* Left: crop name + reference + farmer */}
                <div className="mr-4 min-w-0 space-y-0.5">
                  <p className="app-body-strong truncate capitalize text-app-ink">
                    {order.cropName}
                  </p>
                  <p className="app-meta text-app-muted">
                    <span className="app-data-m text-app-faint">{order.orderReferenceId}</span>
                    {' · '}
                    {order.farmer.firstName} {order.farmer.lastName}
                  </p>
                  {order.paymentStatus === OrderPaymentStatus.PAID &&
                    order.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT && (
                      <p className="app-meta text-app-brand">🔒 Payment protected in escrow</p>
                    )}
                </div>

                {/* Right: amount + status */}
                <div className="flex flex-shrink-0 items-center gap-3">
                  <span className="app-data-m text-app-ink">
                    KSh {order.totalAmountKES.toLocaleString()}
                  </span>
                  <StatusPill
                    state={resolvePillState(order)}
                    label={ORDER_FULFILLMENT_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
