'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Button,
  EmptyState,
  Modal,
  Page,
  PageHeader,
  Table,
  THead,
  TH,
  TR,
  TD,
} from '@/components/app';
import { cn } from '@/lib/cn';
import { OrderTimeline, OrderTimelineDetailed } from '@/components/foodhub/OrderTimeline';
import { EscrowExplainer } from '@/components/foodhub/EscrowExplainer';
import { orderEscrowState } from '@/lib/foodhub/orderEscrowState';
import { FulfillmentStageControl } from '@/components/foodhub/FulfillmentStageControl';
import {
  MediationPanel,
  EscalateForm,
  type IMediationCase,
  isMediationOpen,
} from '@/components/foodhub/MediationPanel';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { loginUrlWithIntent } from '@/lib/auth/intent';
import {
  Role,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  FulfillmentType,
  ListingUnit,
  FulfillmentStage,
  MediationRequestStatus,
  FARMER_MEDIATION_CATEGORIES,
  FARMER_ESCALATION_HOURS,
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
  fulfillmentStage?: FulfillmentStage | null;
  // Whether a live escalation sits on this order. Supplied per row by
  // GET /api/orders, because the page only ever fetches the full mediation
  // record for the order the farmer has opened — without this the rows behind
  // it could not tell the difference between a quiet order and a contested one.
  hasOpenMediation?: boolean;
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
  // The buyer's payment could not be confirmed either way. The farmer must not
  // read this as money received, nor as a buyer who failed to pay.
  [OrderPaymentStatus.UNRESOLVED]: {
    label: 'Being checked',
    glyph: '◌',
    wrap: 'bg-app-warning-surface',
    text: 'text-app-warning',
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
  const [mediation, setMediation] = useState<IMediationCase | null>(null);
  const [escalateOpen, setEscalateOpen] = useState(false);

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
      router.push(loginUrlWithIntent());
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

  // The escalation case for whichever order is open, so the farmer can both see
  // a buyer's complaint and answer it.
  const fetchMediation = useCallback(async (orderId: string): Promise<void> => {
    try {
      const res = await fetch(`/api/orders/${orderId}/mediation`);
      if (!res.ok) return;
      const data = (await res.json()) as { data: IMediationCase | null };
      setMediation(data.data);
    } catch {
      // Non-fatal — the modal still renders without the mediation section.
    }
  }, []);

  useEffect(() => {
    if (!selectedOrder) {
      setMediation(null);
      setEscalateOpen(false);
      return;
    }
    void fetchMediation(selectedOrder._id);
  }, [selectedOrder, fetchMediation]);

  // A farmer may ask us to review an order the buyer has received but never
  // confirmed — the only thing standing between them and their money.
  const canEscalate = ((): boolean => {
    if (!selectedOrder?.confirmedByFarmerAt) return false;
    if (selectedOrder.paymentStatus !== OrderPaymentStatus.PAID) return false;
    if (selectedOrder.fulfillmentStatus !== OrderFulfillmentStatus.IN_FULFILLMENT) return false;
    if (mediation && mediation.status !== MediationRequestStatus.RESOLVED) return false;
    const elapsedHours =
      (Date.now() - new Date(selectedOrder.confirmedByFarmerAt).getTime()) / 3_600_000;
    return elapsedHours >= FARMER_ESCALATION_HOURS;
  })();

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
      <Page>
        <div className="skeleton h-8 w-32 rounded" />
        <ListSkeleton rows={5} />
      </Page>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <Page>
        <PageHeader title="Orders" />
        <EmptyState
          title="We could not load your orders"
          description="Your orders and any money held against them are unaffected — this screen just could not reach them. Trying again usually clears it."
          action={{ label: 'Try again', onClick: () => void fetchOrders() }}
        />
      </Page>
    );
  }

  const awaitingDispatch = orders.filter((o) => o.canConfirmDispatch).length;

  return (
    <Page>
      <PageHeader
        title="Orders"
        description="Every order buyers have placed with you, and where each one has reached. Confirm dispatch as soon as you hand produce to the carrier — that is what starts the clock on your payment."
        meta={
          orders.length > 0 ? (
            <>
              <span>
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </span>
              {awaitingDispatch > 0 && (
                <span className="text-app-warning">
                  {awaitingDispatch} waiting for you to confirm dispatch
                </span>
              )}
            </>
          ) : undefined
        }
      />

      {/* Empty state */}
      {orders.length === 0 ? (
        <EmptyState
          title="When buyers order your produce, you'll track every stage here"
          description="Each order arrives with the buyer's details and the amount they have paid into escrow. You confirm dispatch, they confirm receipt, and the money is released to you — this screen shows exactly where each order sits in that sequence."
          hints={[
            {
              label: 'List more produce',
              href: '/dashboard/farmer/listings',
              description: 'buyers can only order what you have published',
            },
            {
              label: 'Check your trust score',
              href: '/dashboard/farmer/profile',
              description: 'a higher score puts you above other farmers in search',
            },
          ]}
        />
      ) : (
        /* Orders table */
        <Table layout="fixed">
          <THead>
            <TH className="w-[11%]">Ref</TH>
            <TH className="w-[27%]">Order</TH>
            <TH className="w-[17%] text-right">Amount</TH>
            <TH className="w-[21%]">Progress</TH>
            <TH className="w-[24%] text-right">
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
                    createdAt={order.createdAt}
                    paidAt={order.paidAt}
                    confirmedByFarmerAt={order.confirmedByFarmerAt}
                    receivedByBuyerAt={order.receivedByBuyerAt}
                    hasOpenMediation={order.hasOpenMediation}
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

            {/* What is happening to this money, and what governs it.
                The farmer previously got two hand-written blocks: one while
                PAID + IN_FULFILLMENT, one on a refund. Between them they cover
                two of the six escrow states, so the screen fell silent in
                exactly the ones a farmer chases us about — an order under
                review, and one whose money has cleared but not yet been paid
                out. Neither block said what would move the money or what to do
                if it did not. This is the same component the buyer's order
                uses, told from the farmer's side, where the exposure is
                delivering and not being paid rather than paying and not
                receiving. */}
            <EscrowExplainer
              escrowState={orderEscrowState(
                {
                  paymentStatus: selectedOrder.paymentStatus,
                  fulfillmentStatus: selectedOrder.fulfillmentStatus,
                  confirmedByFarmerAt: selectedOrder.confirmedByFarmerAt ?? null,
                },
                isMediationOpen(mediation)
              )}
              viewer="FARMER"
              amountKES={selectedOrder.totalAmountKES}
              counterpartyName={selectedOrder.buyer.firstName}
            />


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
                createdAt={selectedOrder.createdAt}
                paidAt={selectedOrder.paidAt}
                confirmedByFarmerAt={selectedOrder.confirmedByFarmerAt}
                receivedByBuyerAt={selectedOrder.receivedByBuyerAt}
                viewer="FARMER"
                hasOpenMediation={isMediationOpen(mediation)}
              />
            </div>

            {/* Fulfilment progress — only meaningful once dispatch is confirmed */}
            {selectedOrder.paymentStatus === OrderPaymentStatus.PAID &&
              selectedOrder.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT &&
              selectedOrder.confirmedByFarmerAt && (
                <div className="border-t border-app-hairline pt-4">
                  <FulfillmentStageControl
                    orderId={selectedOrder._id}
                    currentStage={selectedOrder.fulfillmentStage ?? null}
                    onAdvanced={(stage) => {
                      setSelectedOrder((prev) =>
                        prev ? { ...prev, fulfillmentStage: stage } : prev
                      );
                      setOrders((prev) =>
                        prev.map((o) =>
                          o._id === selectedOrder._id ? { ...o, fulfillmentStage: stage } : o
                        )
                      );
                    }}
                  />
                </div>
              )}

            {/* When does the farmer get paid? Stated, not left to guesswork. */}
            {selectedOrder.paymentStatus === OrderPaymentStatus.PAID &&
              selectedOrder.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT &&
              selectedOrder.confirmedByFarmerAt &&
              !mediation && (
                <div className="rounded-app-control border border-app-hairline bg-app-sunken px-3 py-2.5">
                  <p className="app-label text-app-muted">When you get paid</p>
                  <p className="app-meta mt-1 text-app-muted">
                    The buyer releases the funds by confirming receipt. If they have not confirmed{' '}
                    {Math.round(FARMER_ESCALATION_HOURS / 24)} days after your dispatch, you can ask
                    UmojaHub to review the order and decide.
                  </p>
                  {!canEscalate && (
                    <p className="app-meta mt-1 text-app-faint">
                      You can ask for a review from{' '}
                      {new Date(
                        new Date(selectedOrder.confirmedByFarmerAt).getTime() +
                          FARMER_ESCALATION_HOURS * 3_600_000
                      ).toLocaleDateString('en-KE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      .
                    </p>
                  )}
                </div>
              )}

            {/* The case, if there is one — visible to both sides */}
            {mediation && (
              <MediationPanel
                orderId={selectedOrder._id}
                mediation={mediation}
                viewerRole={Role.FARMER}
                onResponded={() => void fetchMediation(selectedOrder._id)}
              />
            )}

            {/* Farmer-initiated escalation */}
            {canEscalate && (
              <div className="space-y-3 border-t border-app-hairline pt-4">
                {!escalateOpen ? (
                  <>
                    <p className="app-body-strong text-app-ink">
                      The buyer has not confirmed receipt
                    </p>
                    <p className="app-meta text-app-muted">
                      Your payment stays held until they do. Ask UmojaHub to review the order and
                      decide what happens to the funds.
                    </p>
                    <Button variant="secondary" onClick={() => setEscalateOpen(true)}>
                      Ask UmojaHub to review
                    </Button>
                  </>
                ) : (
                  <EscalateForm
                    orderId={selectedOrder._id}
                    categories={FARMER_MEDIATION_CATEGORIES}
                    onFiled={() => {
                      setEscalateOpen(false);
                      void fetchMediation(selectedOrder._id);
                    }}
                  />
                )}
              </div>
            )}

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
    </Page>
  );
}
