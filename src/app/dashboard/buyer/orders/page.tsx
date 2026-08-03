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
import {
  Button,
  EmptyState,
  Page,
  PageHeader,
  StatusPill,
  type StatusState,
} from '@/components/app';
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
      <Page>
        <div className="skeleton h-8 w-40 rounded" />
        <ListSkeleton rows={5} />
      </Page>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <Page>
        <PageHeader title="My Orders" />
        <EmptyState
          title="We could not load your orders"
          description="Any payment you have made is safe in escrow regardless of what this screen can reach. Trying again usually clears it."
          action={{ label: 'Try again', onClick: () => void fetchOrders() }}
        />
      </Page>
    );
  }

  const inEscrow = orders.filter(
    (o) =>
      o.paymentStatus === OrderPaymentStatus.PAID &&
      o.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT
  ).length;

  // ── Ready ──────────────────────────────────────────────────────────────────
  return (
    <Page>
      {/* Page header */}
      <PageHeader
        title="My Orders"
        description="Everything you have ordered and where it has reached. Your payment stays in escrow until you confirm the produce arrived — nothing reaches the farmer before then."
        meta={
          orders.length > 0 ? (
            <>
              <span>
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </span>
              {inEscrow > 0 && (
                <span>
                  {inEscrow} with payment held in escrow
                </span>
              )}
            </>
          ) : undefined
        }
        actions={
          <Button variant="secondary" onClick={() => router.push('/marketplace')}>
            Browse produce
          </Button>
        }
      />

      {/* Orders list */}
      {orders.length === 0 ? (
        <EmptyState
          title="When you place an order, you'll track every stage here"
          description="Each order shows you which farmer it came from, how much is held in escrow, and how far along delivery is — from payment through to the moment you confirm what arrived."
          action={{ label: 'Browse the marketplace', href: '/marketplace' }}
          hints={[
            {
              label: 'Find verified suppliers',
              href: '/dashboard/buyer/suppliers',
              description: 'input suppliers UmojaHub has already checked',
            },
          ]}
        />
      ) : (
        <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/dashboard/buyer/orders/${order._id}`}
              className="block transition-colors duration-150 hover:bg-app-sunken focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-app-ring"
            >
              <div className="flex items-center justify-between gap-6 border-b border-app-hairline px-6 py-5 last:border-0">
                {/* Left: crop name + reference + farmer */}
                <div className="min-w-0 space-y-1">
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
                      <p className="app-meta text-app-brand">
                        Your payment is held in escrow until you confirm delivery
                      </p>
                    )}
                </div>

                {/* Right: amount + status. Both columns are fixed-width so the
                    money lines up down the list however long the pill label is. */}
                <div className="flex flex-shrink-0 items-center gap-6">
                  <span className="app-data-m w-28 text-right text-app-ink">
                    KSh {order.totalAmountKES.toLocaleString()}
                  </span>
                  <span className="flex w-40 justify-start">
                    <StatusPill
                      state={resolvePillState(order)}
                      label={
                        ORDER_FULFILLMENT_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus
                      }
                    />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}
