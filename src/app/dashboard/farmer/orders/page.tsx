'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { OrderTimeline, OrderTimelineDetailed } from '@/components/foodhub/OrderTimeline';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { Modal } from '@/components/ui/Modal';
import {
  Role,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  FulfillmentType,
  ListingUnit,
} from '@/types';

interface IFarmerOrder {
  _id: string;
  orderReferenceId: string;
  cropName: string;
  quantityOrdered: number;
  unit: ListingUnit;
  totalAmountKES: number;
  fulfillmentType: FulfillmentType;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  buyerPhone: string;
  paidAt?: string | null;
  confirmedByFarmerAt?: string | null;
  receivedByBuyerAt?: string | null;
  // Authoritative gate from GET /api/orders (PAID && IN_FULFILLMENT &&
  // !confirmedByFarmerAt). The client must never recompute this.
  canConfirmDispatch: boolean;
  createdAt: string;
  buyer: {
    firstName: string;
    lastName: string;
  };
}

// Farmers who confirm carrier handover within 24 h of payment count as on-time
// in farmerTrustCalculator. The prompt counts down against that window.
const HANDOVER_WINDOW_HOURS = 24;

type HandoverUrgency = 'ok' | 'warning' | 'elapsed';

function handoverState(
  paidAt: string,
  now: number
): { urgency: HandoverUrgency; label: string } {
  const deadline = new Date(paidAt).getTime() + HANDOVER_WINDOW_HOURS * 60 * 60 * 1000;
  const remainingMs = deadline - now;
  if (remainingMs <= 0) {
    return { urgency: 'elapsed', label: 'Handover window elapsed' };
  }
  const totalMinutes = Math.floor(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const urgency: HandoverUrgency = remainingMs <= 6 * 60 * 60 * 1000 ? 'warning' : 'ok';
  return { urgency, label: `${hours}h ${minutes}m left to confirm` };
}

// Live 24-h handover countdown. Re-reads the clock every minute; tone escalates
// green -> yellow -> red as the on-time window closes (matching Badge precedent).
function HandoverCountdown({ paidAt }: { paidAt: string }): React.ReactElement {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { urgency, label } = handoverState(paidAt, now);

  const tone =
    urgency === 'elapsed'
      ? 'text-red-400 border-red-800/40 bg-red-950/40'
      : urgency === 'warning'
        ? 'text-yellow-400 border-yellow-800/40 bg-yellow-950/40'
        : 'text-accent-green border-accent-green/30 bg-accent-green/10';

  const dot =
    urgency === 'elapsed'
      ? 'bg-red-500'
      : urgency === 'warning'
        ? 'bg-yellow-400'
        : 'bg-accent-green';

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 font-mono text-t6 font-medium uppercase tracking-wide whitespace-nowrap',
        tone,
      ].join(' ')}
      role="status"
    >
      <span className={['w-1.5 h-1.5 rounded-full flex-shrink-0', dot].join(' ')} aria-hidden="true" />
      {label}
    </span>
  );
}

interface IOrdersResponse {
  orders: IFarmerOrder[];
}

type PageState = 'loading' | 'ready' | 'error';

export default function FarmerOrdersPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<IFarmerOrder[]>([]);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [selectedOrder, setSelectedOrder] = useState<IFarmerOrder | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/orders?role=farmer');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = (await res.json()) as IOrdersResponse;
      setOrders(data.orders ?? []);
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
      if (session.user.role !== Role.FARMER) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchOrders();
    }
  }, [status, session, router, fetchOrders]);

  async function confirmDispatch(orderId: string): Promise<void> {
    setConfirmingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT }),
      });
      if (res.ok) {
        const confirmedAt = new Date().toISOString();
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? {
                  ...o,
                  fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
                  confirmedByFarmerAt: confirmedAt,
                  canConfirmDispatch: false,
                }
              : o,
          ),
        );
        if (selectedOrder?._id === orderId) {
          setSelectedOrder((prev) =>
            prev
              ? {
                  ...prev,
                  fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
                  confirmedByFarmerAt: confirmedAt,
                  canConfirmDispatch: false,
                }
              : null,
          );
        }
      }
    } finally {
      setConfirmingId(null);
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-24 rounded" />
        <ListSkeleton rows={5} />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-t4 font-body font-medium text-text-primary mb-2">
          Could not load orders
        </p>
        <p className="text-t5 font-body text-text-secondary mb-4">
          Check your connection and try again.
        </p>
        <Button variant="secondary" onClick={() => void fetchOrders()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-t2 font-heading font-semibold text-text-primary">Orders</h1>
        <p className="text-t5 font-body text-text-secondary mt-0.5">
          {orders.length} order{orders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 rounded bg-surface-elevated">
          <div className="w-12 h-12 rounded bg-surface-secondary border border-white/5 flex items-center justify-center mb-4">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="5"
                width="14"
                height="12"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-text-disabled"
              />
              <path
                d="M7 5V4a3 3 0 016 0v1"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-text-disabled"
              />
            </svg>
          </div>
          <p className="text-t4 font-body font-medium text-text-primary mb-1">No orders yet</p>
          <p className="text-t5 font-body text-text-secondary">
            Orders will appear here once buyers purchase from your listings.
          </p>
        </div>
      ) : (
        /* Orders list */
        <div className="bg-surface-elevated border border-white/5 rounded overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-white/5">
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Ref
            </span>
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Order
            </span>
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest text-right">
              Amount
            </span>
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Progress
            </span>
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Actions
            </span>
          </div>

          {orders.map((order) => (
            <div
              key={order._id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-4 border-b border-white/5 last:border-0 items-center"
            >
              {/* Reference */}
              <span className="text-t6 font-mono text-text-disabled whitespace-nowrap">
                {order.orderReferenceId}
              </span>

              {/* Crop + buyer */}
              <div className="min-w-0">
                <p className="text-t5 font-body font-medium text-text-primary capitalize">
                  {order.cropName} ·{' '}
                  <span className="font-normal text-text-secondary">
                    {order.quantityOrdered} {order.unit.toLowerCase()}
                  </span>
                </p>
                <p className="text-t6 font-body text-text-disabled">
                  {order.buyer.firstName} {order.buyer.lastName} · {formatDate(order.createdAt)}
                </p>
              </div>

              {/* Amount */}
              <div className="text-right">
                <span className="text-t5 font-mono text-text-primary">
                  KES {order.totalAmountKES.toLocaleString()}
                </span>
                <p className="text-t6">
                  <Badge label={order.paymentStatus} />
                </p>
              </div>

              {/* Progress */}
              <OrderTimeline
                paymentStatus={order.paymentStatus}
                fulfillmentStatus={order.fulfillmentStatus}
                paidAt={order.paidAt}
                confirmedByFarmerAt={order.confirmedByFarmerAt}
                receivedByBuyerAt={order.receivedByBuyerAt}
              />

              {/* Actions */}
              <div className="flex flex-col items-end gap-2">
                {order.canConfirmDispatch && order.paidAt && (
                  <HandoverCountdown paidAt={order.paidAt} />
                )}
                <div className="flex items-center gap-2">
                  {order.canConfirmDispatch && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={confirmingId === order._id}
                      onClick={() => void confirmDispatch(order._id)}
                      aria-label={`Confirm carrier handover for order ${order.orderReferenceId}`}
                    >
                      Confirm Carrier Handover
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                    aria-label={`View details for order ${order.orderReferenceId}`}
                  >
                    Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <Modal
          isOpen={selectedOrder !== null}
          onClose={() => setSelectedOrder(null)}
          title={`Order ${selectedOrder.orderReferenceId}`}
          size="md"
        >
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-secondary rounded p-3">
                <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                  Crop
                </p>
                <p className="text-t5 font-body text-text-primary capitalize">
                  {selectedOrder.cropName}
                </p>
              </div>
              <div className="bg-surface-secondary rounded p-3">
                <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                  Quantity
                </p>
                <p className="text-t5 font-mono text-text-primary">
                  {selectedOrder.quantityOrdered} {selectedOrder.unit.toLowerCase()}
                </p>
              </div>
              <div className="bg-surface-secondary rounded p-3">
                <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                  Total
                </p>
                <p className="text-t5 font-mono text-text-primary">
                  KES {selectedOrder.totalAmountKES.toLocaleString()}
                </p>
              </div>
              <div className="bg-surface-secondary rounded p-3">
                <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                  Collection
                </p>
                <p className="text-t5 font-body text-text-primary capitalize">
                  {selectedOrder.fulfillmentType.toLowerCase()}
                </p>
              </div>
            </div>

            {/* Buyer */}
            <div>
              <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-2">
                Buyer
              </p>
              <p className="text-t5 font-body text-text-primary">
                {selectedOrder.buyer.firstName} {selectedOrder.buyer.lastName}
              </p>
              <p className="text-t5 font-body text-text-secondary">{selectedOrder.buyerPhone}</p>
            </div>

            {/* Timeline */}
            <div>
              <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-3">
                Order progress
              </p>
              <OrderTimelineDetailed
                paymentStatus={selectedOrder.paymentStatus}
                fulfillmentStatus={selectedOrder.fulfillmentStatus}
                paidAt={selectedOrder.paidAt}
                confirmedByFarmerAt={selectedOrder.confirmedByFarmerAt}
                receivedByBuyerAt={selectedOrder.receivedByBuyerAt}
              />
            </div>

            {/* Action */}
            {selectedOrder.canConfirmDispatch && (
              <div className="space-y-3">
                {selectedOrder.paidAt && (
                  <div className="flex items-center justify-between gap-3 rounded bg-surface-secondary border border-white/5 p-3">
                    <p className="text-t6 font-body text-text-secondary">
                      Confirm within 24 h of payment to keep your reliability score on-time.
                    </p>
                    <HandoverCountdown paidAt={selectedOrder.paidAt} />
                  </div>
                )}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={confirmingId === selectedOrder._id}
                  onClick={() => void confirmDispatch(selectedOrder._id)}
                >
                  Confirm Carrier Handover
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
