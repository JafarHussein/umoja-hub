'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Modal, Table, THead, TH, TR, TD } from '@/components/app';
import { cn } from '@/lib/cn';
import { OrderTimeline, OrderTimelineDetailed } from '@/components/foodhub/OrderTimeline';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
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

// Payment-status pill — app design-system tinted pill (mirrors the listings
// status pill). State is conveyed by icon + text + tint, never colour alone.
const PAYMENT_PILL: Record<OrderPaymentStatus, { label: string; glyph: string; wrap: string; text: string }> = {
  [OrderPaymentStatus.PAID]: {
    label: 'Paid',
    glyph: '✓',
    wrap: 'bg-app-success-surface',
    text: 'text-app-success',
  },
  [OrderPaymentStatus.PENDING_PAYMENT]: {
    label: 'Pending',
    glyph: '◷',
    wrap: 'bg-app-warning-surface',
    text: 'text-app-warning',
  },
  [OrderPaymentStatus.FAILED]: {
    label: 'Failed',
    glyph: '⊘',
    wrap: 'bg-app-danger-surface',
    text: 'text-app-danger',
  },
  [OrderPaymentStatus.REFUNDED]: {
    label: 'Refunded',
    glyph: '↺',
    wrap: 'bg-app-info-surface',
    text: 'text-app-info',
  },
};

function PaymentPill({ status }: { status: OrderPaymentStatus }): React.ReactElement {
  const p = PAYMENT_PILL[status];
  return (
    <span
      className={cn(
        'app-label inline-flex items-center gap-1 rounded-app-pill px-2 py-0.5',
        p.wrap,
        p.text
      )}
    >
      <span aria-hidden>{p.glyph}</span>
      {p.label}
    </span>
  );
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
    return { urgency: 'elapsed', label: 'Dispatch window closed' };
  }
  const totalMinutes = Math.floor(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const urgency: HandoverUrgency = remainingMs <= 6 * 60 * 60 * 1000 ? 'warning' : 'ok';
  return { urgency, label: `${hours}h ${minutes}m left to confirm` };
}

// Live 24-h handover countdown. Re-reads the clock every minute; tone escalates
// brand -> warning -> danger as the on-time window closes.
function HandoverCountdown({ paidAt }: { paidAt: string }): React.ReactElement {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { urgency, label } = handoverState(paidAt, now);

  const tone =
    urgency === 'elapsed'
      ? 'text-app-danger border-app-danger/40 bg-app-danger-surface'
      : urgency === 'warning'
        ? 'text-app-warning border-app-warning/40 bg-app-warning-surface'
        : 'text-app-brand border-app-brand-border bg-app-brand-surface';

  const dot =
    urgency === 'elapsed'
      ? 'bg-app-danger'
      : urgency === 'warning'
        ? 'bg-app-warning'
        : 'bg-app-brand';

  return (
    <span
      className={cn(
        'app-label inline-flex items-center gap-1.5 whitespace-nowrap rounded-app-pill border px-2 py-0.5 font-app-mono',
        tone
      )}
      role="status"
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-app-pill', dot)} aria-hidden="true" />
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
        <p className="app-title mb-2 text-app-ink">Could not load orders</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
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
        <h1 className="app-h1 text-app-ink">Orders</h1>
        <p className="app-meta mt-0.5 text-app-muted">
          {orders.length} order{orders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-app-card border border-app-hairline bg-app-card py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-app-control border border-app-hairline bg-app-sunken">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect
                x="3"
                y="5"
                width="14"
                height="12"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-app-faint"
              />
              <path
                d="M7 5V4a3 3 0 016 0v1"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-app-faint"
              />
            </svg>
          </div>
          <p className="app-title mb-1 text-app-ink">No orders yet</p>
          <p className="app-body text-app-muted">
            Orders will appear here once buyers order your produce.
          </p>
        </div>
      ) : (
        /* Orders table */
        <Table>
          <THead>
            <TH>Ref</TH>
            <TH>Order</TH>
            <TH className="text-right">Amount</TH>
            <TH>Progress</TH>
            <TH className="text-right">
              <span className="sr-only">Actions</span>
            </TH>
          </THead>
          <tbody>
            {orders.map((order) => (
              <TR key={order._id}>
                {/* Reference */}
                <TD className="whitespace-nowrap align-top">
                  <span className="app-data-m text-app-muted">{order.orderReferenceId}</span>
                </TD>

                {/* Crop + buyer */}
                <TD className="align-top">
                  <p className="app-body-strong capitalize text-app-ink">
                    {order.cropName}{' '}
                    <span className="app-body font-normal text-app-muted">
                      · {order.quantityOrdered} {order.unit.toLowerCase()}
                    </span>
                  </p>
                  <p className="app-meta text-app-muted">
                    {order.buyer.firstName} {order.buyer.lastName} · {formatDate(order.createdAt)}
                  </p>
                </TD>

                {/* Amount */}
                <TD className="whitespace-nowrap text-right align-top">
                  <span className="app-data-m text-app-ink">
                    KSh {order.totalAmountKES.toLocaleString()}
                  </span>
                  <div className="mt-1 flex justify-end">
                    <PaymentPill status={order.paymentStatus} />
                  </div>
                </TD>

                {/* Progress */}
                <TD className="align-top">
                  <OrderTimeline
                    paymentStatus={order.paymentStatus}
                    fulfillmentStatus={order.fulfillmentStatus}
                    paidAt={order.paidAt}
                    confirmedByFarmerAt={order.confirmedByFarmerAt}
                    receivedByBuyerAt={order.receivedByBuyerAt}
                  />
                </TD>

                {/* Actions */}
                <TD className="align-top">
                  <div className="flex flex-col items-end gap-2">
                    {order.canConfirmDispatch && order.paidAt && (
                      <HandoverCountdown paidAt={order.paidAt} />
                    )}
                    <div className="flex items-center gap-2">
                      {order.canConfirmDispatch && (
                        <Button
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
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <Modal
          open={selectedOrder !== null}
          onClose={() => setSelectedOrder(null)}
          title={`Order ${selectedOrder.orderReferenceId}`}
          className="max-w-lg"
        >
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-app-control bg-app-sunken p-3">
                <p className="app-label mb-1 text-app-muted">Crop</p>
                <p className="app-body capitalize text-app-ink">{selectedOrder.cropName}</p>
              </div>
              <div className="rounded-app-control bg-app-sunken p-3">
                <p className="app-label mb-1 text-app-muted">Quantity</p>
                <p className="app-data-m text-app-ink">
                  {selectedOrder.quantityOrdered} {selectedOrder.unit.toLowerCase()}
                </p>
              </div>
              <div className="rounded-app-control bg-app-sunken p-3">
                <p className="app-label mb-1 text-app-muted">Total</p>
                <p className="app-data-m text-app-ink">
                  KSh {selectedOrder.totalAmountKES.toLocaleString()}
                </p>
              </div>
              <div className="rounded-app-control bg-app-sunken p-3">
                <p className="app-label mb-1 text-app-muted">Collection</p>
                <p className="app-body capitalize text-app-ink">
                  {selectedOrder.fulfillmentType.toLowerCase()}
                </p>
              </div>
            </div>

            {/* Buyer */}
            <div>
              <p className="app-label mb-2 text-app-muted">Buyer</p>
              <p className="app-body text-app-ink">
                {selectedOrder.buyer.firstName} {selectedOrder.buyer.lastName}
              </p>
              <p className="app-body text-app-muted">{selectedOrder.buyerPhone}</p>
            </div>

            {/* Escrow status — what the buyer's payment means for the farmer */}
            {selectedOrder.paymentStatus === OrderPaymentStatus.PAID &&
              selectedOrder.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT && (
                <div className="flex items-start gap-3 rounded-app-control border border-app-brand-border bg-app-brand-surface p-3">
                  <span className="app-title leading-none text-app-brand" aria-hidden>
                    🔒
                  </span>
                  <p className="app-meta text-app-muted">
                    <span className="app-body-strong text-app-ink">The buyer has paid.</span> Their{' '}
                    <span className="app-data-m text-app-ink">
                      KSh {selectedOrder.totalAmountKES.toLocaleString()}
                    </span>{' '}
                    is held in escrow and released to you once they confirm they have received this
                    order.
                  </p>
                </div>
              )}

            {/* Refunded — escrow returned to the buyer by mediation */}
            {selectedOrder.paymentStatus === OrderPaymentStatus.REFUNDED && (
              <div className="rounded-app-control border border-app-hairline bg-app-info-surface p-3">
                <p className="app-meta text-app-muted">
                  <span className="app-body-strong text-app-ink">Refunded to buyer.</span> The
                  platform returned the held funds following a mediation decision.
                </p>
              </div>
            )}

            {/* Receipt — available from the moment payment is confirmed */}
            {(selectedOrder.paymentStatus === OrderPaymentStatus.PAID ||
              selectedOrder.paymentStatus === OrderPaymentStatus.REFUNDED) && (
              <Link
                href={`/dashboard/farmer/orders/${selectedOrder._id}/receipt`}
                className="flex items-center justify-between gap-3 rounded-app-control border border-app-hairline px-3 py-2.5 transition-colors duration-150 hover:bg-app-sunken"
              >
                <span>
                  <span className="app-body-strong block text-app-ink">View receipt</span>
                  <span className="app-meta text-app-muted">
                    M-Pesa reference and the full transaction history.
                  </span>
                </span>
                <span aria-hidden className="app-body text-app-muted">
                  →
                </span>
              </Link>
            )}

            {/* Timeline */}
            <div>
              <p className="app-label mb-3 text-app-muted">Order progress</p>
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
                  <div className="flex items-center justify-between gap-3 rounded-app-control border border-app-hairline bg-app-sunken p-3">
                    <p className="app-meta text-app-muted">
                      Confirm within 24 h of payment to keep your reliability score on-time.
                    </p>
                    <HandoverCountdown paidAt={selectedOrder.paidAt} />
                  </div>
                )}
                <Button
                  size="lg"
                  className="w-full"
                  isLoading={confirmingId === selectedOrder._id}
                  onClick={() => void confirmDispatch(selectedOrder._id)}
                >
                  Confirm dispatch
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
