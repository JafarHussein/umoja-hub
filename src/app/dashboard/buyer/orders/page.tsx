'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, OrderPaymentStatus, OrderFulfillmentStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
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

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'status' | 'tier-farmer' | 'tier-student' | 'project-status';

const FULFILLMENT_LABEL: Record<OrderFulfillmentStatus, string> = {
  [OrderFulfillmentStatus.AWAITING_PAYMENT]: 'Awaiting payment',
  [OrderFulfillmentStatus.IN_FULFILLMENT]: 'In fulfillment',
  [OrderFulfillmentStatus.RECEIVED]: 'Received',
  [OrderFulfillmentStatus.COMPLETED]: 'Completed',
  [OrderFulfillmentStatus.DISPUTED]: 'Disputed',
};

function resolveBadgeVariant(order: IBuyerOrder): BadgeVariant {
  if (order.fulfillmentStatus === OrderFulfillmentStatus.COMPLETED) return 'success';
  if (order.fulfillmentStatus === OrderFulfillmentStatus.DISPUTED) return 'error';
  if (order.paymentStatus === OrderPaymentStatus.PENDING_PAYMENT) return 'warning';
  if (order.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT) return 'neutral';
  return 'neutral';
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
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <ListSkeleton rows={5} />
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-fg-muted">Failed to load orders.</p>
            <div className="mt-3">
              <Button variant="ghost" size="sm" onClick={() => void fetchOrders()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Ready ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest mb-1">
              Buyer · Dashboard
            </p>
            <h1 className="text-t2 font-heading font-semibold text-fg tracking-tight">
              My Orders
            </h1>
          </div>
          <Link
            href="/marketplace"
            className="text-t5 font-body text-brand hover:text-brand/80 transition-colors duration-150"
          >
            Browse marketplace →
          </Link>
        </div>

        {/* Orders list */}
        {orders.length === 0 ? (
          <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-10 text-center">
            <p className="text-t4 font-body text-fg-muted">No orders yet.</p>
            <p className="text-t5 font-body text-fg-disabled mt-1">
              Find produce from verified farmers in the marketplace.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex mt-4 text-t5 font-body text-brand hover:text-brand/80 transition-colors duration-150"
            >
              Go to marketplace →
            </Link>
          </div>
        ) : (
          <div className="bg-surface border border-zinc-800/50 rounded-[4px] overflow-hidden">
            {orders.map((order) => (
              <Link
                key={order._id}
                href={`/dashboard/buyer/orders/${order._id}`}
                className="block hover:bg-surface-raised transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:ring-inset"
              >
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800/50 last:border-0">
                  {/* Left: crop name + reference + farmer */}
                  <div className="space-y-0.5 min-w-0 mr-4">
                    <p className="text-t4 font-body font-medium text-fg truncate capitalize">
                      {order.cropName}
                    </p>
                    <p className="text-t6 font-mono text-fg-disabled">
                      {order.orderReferenceId}
                      {' · '}
                      {order.farmer.firstName} {order.farmer.lastName}
                    </p>
                  </div>

                  {/* Right: amount + status */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-t4 font-mono font-semibold text-fg tabular-nums">
                      KES {order.totalAmountKES.toLocaleString()}
                    </span>
                    <Badge
                      variant={resolveBadgeVariant(order)}
                      label={FULFILLMENT_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
