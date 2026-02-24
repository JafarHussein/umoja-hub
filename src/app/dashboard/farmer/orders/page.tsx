'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
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
  createdAt: string;
  buyer: {
    firstName: string;
    lastName: string;
  };
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
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? {
                  ...o,
                  fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
                  confirmedByFarmerAt: new Date().toISOString(),
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
                  confirmedByFarmerAt: new Date().toISOString(),
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

  const canConfirmDispatch = (order: IFarmerOrder): boolean =>
    order.paymentStatus === OrderPaymentStatus.PAID &&
    order.fulfillmentStatus === OrderFulfillmentStatus.AWAITING_PAYMENT;

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
              <div className="flex items-center gap-2">
                {canConfirmDispatch(order) && (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={confirmingId === order._id}
                    onClick={() => void confirmDispatch(order._id)}
                    aria-label={`Confirm dispatch for order ${order.orderReferenceId}`}
                  >
                    Confirm dispatch
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
            {canConfirmDispatch(selectedOrder) && (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={confirmingId === selectedOrder._id}
                onClick={() => void confirmDispatch(selectedOrder._id)}
              >
                Confirm dispatch
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
