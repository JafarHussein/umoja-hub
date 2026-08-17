'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Button,
  DataItem,
  DataList,
  Disclosure,
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
import { MoneyStatement, NextStep } from '@/components/foodhub/MoneyStatement';
import { escrowNarrative } from '@/lib/foodhub/escrowNarrative';
import { orderEscrowState } from '@/lib/foodhub/orderEscrowState';
import { escrowReferenceFor } from '@/lib/foodhub/receipt';
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

  function formatDate(iso: string | null): string {
    if (!iso) return '—';
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

  // The escrow narrative for whichever order is open. Derived once, then read
  // three times: the headline is the status of the money, what releases it is
  // the consequence attached to the action, and what to do when it goes wrong
  // sits behind disclosure. Null when no order is open, which is also what
  // gates the modal below.
  const money = selectedOrder
    ? escrowNarrative(
        orderEscrowState(
          {
            paymentStatus: selectedOrder.paymentStatus,
            fulfillmentStatus: selectedOrder.fulfillmentStatus,
            confirmedByFarmerAt: selectedOrder.confirmedByFarmerAt ?? null,
          },
          isMediationOpen(mediation)
        ),
        'FARMER',
        selectedOrder.totalAmountKES,
        selectedOrder.buyer.firstName,
        selectedOrder.paymentStatus
      )
    : null;

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
      {selectedOrder && money && (
        <Modal
          open={selectedOrder !== null}
          onClose={() => setSelectedOrder(null)}
          title={`Order ${selectedOrder.orderReferenceId}`}
          className="max-w-lg"
        >
          <div className="space-y-6">
            {/* ── 1 · The statement ───────────────────────────────────────── */}
            <MoneyStatement
              label={money.label}
              amountKES={selectedOrder.totalAmountKES}
              status={money.headline}
              tone={money.tone}
              evidence={
                <span>
                  <span className="app-data-m text-app-muted">
                    {selectedOrder.orderReferenceId}
                  </span>{' '}
                  · {selectedOrder.buyer.firstName} {selectedOrder.buyer.lastName}
                </span>
              }
            />

            {/* ── 2 · The next step ───────────────────────────────────────── */}

            {/* The consequence is about the money. The operational instruction
                ("as soon as you hand it to the carrier") is on the timeline
                stage below, and appending it here made one sentence say the
                same thing twice. */}
            {selectedOrder.canConfirmDispatch && (
              <NextStep title="Confirm dispatch" consequence={money.releasedBy}>
                <div className="space-y-3">
                  {selectedOrder.paidAt && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="app-meta text-app-muted">
                        Confirming within 24 h of payment keeps your reliability score on time.
                      </p>
                      <HandoverCountdown paidAt={selectedOrder.paidAt} />
                    </div>
                  )}
                  <Button
                    isLoading={confirmingId === selectedOrder._id}
                    onClick={() => void confirmDispatch(selectedOrder._id)}
                  >
                    Confirm dispatch
                  </Button>
                </div>
              </NextStep>
            )}

            {/* Dispatched and waiting on the buyer. The useful action is no
                longer a button on this order, it is telling the buyer where the
                produce has got to, which is what makes them confirm. */}
            {selectedOrder.paymentStatus === OrderPaymentStatus.PAID &&
              selectedOrder.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT &&
              selectedOrder.confirmedByFarmerAt && (
                <NextStep
                  title="Tell the buyer where it is"
                  consequence={money.releasedBy}
                >
                  <FulfillmentStageControl
                    orderId={selectedOrder._id}
                    currentStage={selectedOrder.fulfillmentStage ?? null}
                    onAdvanced={(stage) => {
                      setSelectedOrder((prev) => (prev ? { ...prev, fulfillmentStage: stage } : prev));
                      setOrders((prev) =>
                        prev.map((o) =>
                          o._id === selectedOrder._id ? { ...o, fulfillmentStage: stage } : o
                        )
                      );
                    }}
                  />
                </NextStep>
              )}

            {selectedOrder.fulfillmentStatus === OrderFulfillmentStatus.COMPLETED &&
              selectedOrder.paymentStatus === OrderPaymentStatus.PAID && (
                <NextStep title="Request your payout" consequence={money.releasedBy}>
                  <Link
                    href="/dashboard/farmer/ledger"
                    className="app-body inline-flex items-center gap-1.5 text-app-brand transition-colors duration-150 hover:text-app-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring"
                  >
                    Go to your payments
                    <span aria-hidden>→</span>
                  </Link>
                </NextStep>
              )}

            {selectedOrder.paymentStatus === OrderPaymentStatus.UNRESOLVED && (
              <NextStep title="Hold this order" consequence={money.releasedBy} />
            )}

            {/* ── 3 · The journey ─────────────────────────────────────────── */}
            <section className="space-y-4 border-t border-app-hairline pt-6">
              <h3 className="app-h2 text-app-ink">How this order is going</h3>
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
            </section>

            {/* The case, when there is one — both accounts, all photos. */}
            {mediation && (
              <MediationPanel
                orderId={selectedOrder._id}
                mediation={mediation}
                viewerRole={Role.FARMER}
                onResponded={() => void fetchMediation(selectedOrder._id)}
              />
            )}

            {/* ── 4 · The detail ──────────────────────────────────────────── */}
            <div className="border-b border-app-hairline">
              <Disclosure summary="Order details">
                <DataList>
                  <DataItem label="Produce">
                    <span className="capitalize">{selectedOrder.cropName}</span>
                  </DataItem>
                  <DataItem label="Quantity" numeric>
                    {selectedOrder.quantityOrdered.toLocaleString()}{' '}
                    {selectedOrder.unit.toLowerCase()}
                  </DataItem>
                  <DataItem label="Total" numeric>
                    KSh {selectedOrder.totalAmountKES.toLocaleString()}
                  </DataItem>
                  <DataItem label="Collection">
                    <span className="capitalize">
                      {selectedOrder.fulfillmentType.toLowerCase()}
                    </span>
                  </DataItem>
                  <DataItem label="Buyer">
                    {selectedOrder.buyer.firstName} {selectedOrder.buyer.lastName}
                  </DataItem>
                  <DataItem label="Buyer phone" numeric>
                    {selectedOrder.buyerPhone}
                  </DataItem>
                  <DataItem label="Order placed">{formatDate(selectedOrder.createdAt)}</DataItem>
                </DataList>
              </Disclosure>

              {(selectedOrder.paymentStatus === OrderPaymentStatus.PAID ||
                selectedOrder.paymentStatus === OrderPaymentStatus.REFUNDED) && (
                <Disclosure summary="Payment details">
                  <DataList>
                    <DataItem label="Order reference" numeric>
                      {selectedOrder.orderReferenceId}
                    </DataItem>
                    <DataItem label="Escrow reference" numeric>
                      {escrowReferenceFor(selectedOrder.orderReferenceId)}
                    </DataItem>
                    <DataItem label="Method">M-PESA</DataItem>
                    <DataItem label="Buyer paid on">{formatDate(selectedOrder.paidAt ?? null)}</DataItem>
                  </DataList>
                  <div className="pt-4">
                    <Link
                      href={`/dashboard/farmer/orders/${selectedOrder._id}/receipt`}
                      className="app-body inline-flex items-center gap-1.5 text-app-brand transition-colors duration-150 hover:text-app-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring"
                    >
                      View the full receipt and transaction history
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </Disclosure>
              )}

              <Disclosure summary="If something goes wrong">
                <div className="space-y-4">
                  <p className="app-body max-w-app-prose text-pretty text-app-muted">
                    {money.ifItGoesWrong}
                  </p>

                  {selectedOrder.confirmedByFarmerAt &&
                    selectedOrder.paymentStatus === OrderPaymentStatus.PAID &&
                    selectedOrder.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT &&
                    (canEscalate ? (
                      escalateOpen ? (
                        <EscalateForm
                          orderId={selectedOrder._id}
                          categories={FARMER_MEDIATION_CATEGORIES}
                          onFiled={() => {
                            setEscalateOpen(false);
                            void fetchMediation(selectedOrder._id);
                          }}
                        />
                      ) : (
                        <Button variant="secondary" onClick={() => setEscalateOpen(true)}>
                          Ask UmojaHub to review
                        </Button>
                      )
                    ) : (
                      <p className="app-meta text-app-faint">
                        If the buyer has not confirmed{' '}
                        {Math.round(FARMER_ESCALATION_HOURS / 24)} days after your dispatch, you can
                        ask UmojaHub to review the order and decide. That is from{' '}
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
                    ))}
                </div>
              </Disclosure>
            </div>
          </div>
        </Modal>
      )}
    </Page>
  );
}
