'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Alert, Page, PageHeader } from '@/components/app';
import { cn } from '@/lib/cn';
import { Role, STUCK_PAYMENT_TIMEOUT_MINUTES } from '@/types';
import { PAYMENT_LAB_ACTIONS, type PaymentLabAction } from '@/lib/validation/paymentLabSchema';
import { loginUrlWithIntent } from '@/lib/auth/intent';

// ---------------------------------------------------------------------------
// UI — Admin Payment Lab. Drive deterministic simulated payment scenarios and
// watch the platform react exactly as it would in production. Permanent
// operational tool (no "demo" framing).
// ---------------------------------------------------------------------------

interface IMetrics {
  initiated: number;
  success: number;
  failed: number;
  cancelled: number;
  timeout: number;
  duplicate: number;
  lost: number;
  avgCompletionMs: number;
}

interface IPendingOrder {
  orderId: string;
  orderReferenceId: string;
  cropName: string;
  totalAmountKES: number;
  buyerName: string;
  createdAt: string;
  /** How long this payment session has been silent. */
  waitingMinutes: number;
  /** Old enough for reconciliation to query the provider about it. */
  reconciliationDue: boolean;
}

interface IEvent {
  eventType: string;
  provider: string;
  amount: number | null;
  paymentReference: string | null;
  resultCode: number | null;
  processingTimeMs: number | null;
  /** Who caused it. Null on rows written before the field existed. */
  actor: string | null;
  previousStatus: string | null;
  newStatus: string | null;
  reason: string | null;
  correlationId: string | null;
  occurredAt: string;
}

/** What the platform is holding on other people's behalf, right now. */
interface IEscrowPosition {
  heldKES: number;
  heldOrders: number;
  underReviewKES: number;
  underReviewOrders: number;
  clearedKES: number;
  clearedOrders: number;
}

interface IUnresolvedPayment {
  orderId: string;
  orderReferenceId: string;
  cropName: string;
  totalAmountKES: number;
  buyerName: string;
  buyerPhone: string | null;
  /** The reference to search the M-Pesa statement or re-query Daraja with. */
  checkoutRequestId: string | null;
  unresolvedSince: string;
}

interface ILabResponse {
  provider: string;
  simulationActive: boolean;
  /** The loaded fixture and the workflow it exists to exercise. Null under a real provider. */
  simulationProfile: { name: string; purpose: string } | null;
  /** The real-STK demonstration configuration, and whether the bridge is usable. */
  realStkDemo: boolean;
  demoAmountKES: number | null;
  demoBridgeAvailable: boolean;
  /** Orders where the platform does not know whether the buyer was charged. */
  unresolvedPayments: IUnresolvedPayment[];
  metrics: IMetrics;
  escrowPosition: IEscrowPosition;
  pendingOrders: IPendingOrder[];
  recentEvents: IEvent[];
}

type PageState = 'loading' | 'ready' | 'error';
type EventTone = 'success' | 'danger' | 'warning' | 'neutral';

const ACTION_LABELS: Record<PaymentLabAction, string> = {
  success: 'Success',
  insufficient_funds: 'Insufficient funds',
  user_cancelled: 'User cancelled',
  phone_unreachable: 'Phone unreachable',
  timeout: 'Timeout',
  network_failure: 'Network failure',
  unknown_error: 'Unknown error',
  delayed: 'Delayed (30s)',
  duplicate: 'Duplicate callback',
  lost: 'Lost callback',
};

const EVENT_TONE: Record<string, EventTone> = {
  SUCCESS: 'success',
  INITIATED: 'neutral',
  CALLBACK_RECEIVED: 'neutral',
  FAILED: 'danger',
  TIMEOUT: 'warning',
  DUPLICATE: 'warning',
  LOST: 'danger',
  RECONCILED: 'warning',
  // Was absent, so the one event meaning "we do not know whether this buyer was
  // charged" rendered in the same neutral grey as a routine callback.
  UNRESOLVED: 'danger',
};

// Who caused an event, in the words an operator reading an audit uses.
const ACTOR_LABEL: Record<string, string> = {
  BUYER: 'Buyer',
  PROVIDER: 'M-Pesa',
  SYSTEM: 'UmojaHub',
  ADMIN: 'Administrator',
};

const TONE_CLASS: Record<EventTone, string> = {
  success: 'text-app-success',
  danger: 'text-app-danger',
  warning: 'text-app-warning',
  neutral: 'text-app-muted',
};

const SELECT_CLASS =
  'app-body min-h-[36px] rounded-app-control border border-app-border-strong bg-app-card px-2 text-app-ink transition-colors duration-150 focus:border-app-brand focus:outline-none focus:ring-2 focus:ring-app-brand/30';

function formatKES(amount?: number | null): string {
  return amount != null ? `KSh ${amount.toLocaleString()}` : '—';
}

function formatWait(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function EventBadge({ eventType }: { eventType: string }): React.ReactElement {
  const tone = EVENT_TONE[eventType] ?? 'neutral';
  return (
    <span
      className={cn(
        'app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2 py-0.5',
        TONE_CLASS[tone]
      )}
    >
      {eventType}
    </span>
  );
}

export default function AdminPaymentLabPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<ILabResponse | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [selectedActions, setSelectedActions] = useState<Record<string, PaymentLabAction>>({});
  const [firing, setFiring] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/admin/payment-lab');
      if (!res.ok) throw new Error('Request failed');
      const json = (await res.json()) as { data: ILabResponse };
      setData(json.data);
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
      if (session.user.role !== Role.ADMIN) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchData();
    }
  }, [status, session, router, fetchData]);

  async function confirmForDemo(orderId: string, reference: string): Promise<void> {
    setFiring(orderId);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/payment-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'demo_confirm' }),
      });
      const body = (await res.json()) as { data?: { reference: string }; error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Could not confirm this payment.');
      setNotice(
        `${reference} confirmed by the demonstration bridge as ${body.data?.reference}. The audit trail attributes it to UmojaHub, not to Safaricom.`
      );
      await fetchData();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setFiring(null);
    }
  }

  async function fire(orderId: string): Promise<void> {
    const action = selectedActions[orderId] ?? 'success';
    setFiring(orderId);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/payment-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });
      const body = (await res.json()) as { data?: { delivered: boolean }; error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Could not run the scenario.');
      setNotice(
        body.data?.delivered
          ? `Delivered "${ACTION_LABELS[action]}" callback.`
          : `Scheduled "${ACTION_LABELS[action]}" — it will be delivered shortly.`
      );
      await fetchData();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setFiring(null);
    }
  }

  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="skeleton h-7 w-40 rounded" />
        <div className="skeleton h-24 rounded-app-card" />
        <div className="skeleton h-48 rounded-app-card" />
      </div>
    );
  }

  if (pageState === 'error' || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Could not load the Payment Lab</p>
        <Button variant="secondary" onClick={() => void fetchData()}>
          Retry
        </Button>
      </div>
    );
  }

  const m = data.metrics;
  const stats: { label: string; value: string }[] = [
    { label: 'Initiated', value: String(m.initiated) },
    { label: 'Success', value: String(m.success) },
    { label: 'Failed', value: String(m.failed) },
    { label: 'Cancelled', value: String(m.cancelled) },
    { label: 'Timeout', value: String(m.timeout) },
    { label: 'Duplicate', value: String(m.duplicate) },
    { label: 'Lost', value: String(m.lost) },
    {
      label: 'Avg completion',
      value: m.avgCompletionMs ? `${(m.avgCompletionMs / 1000).toFixed(1)}s` : '—',
    },
  ];

  return (
    <Page>
      {/* Header */}
      <PageHeader
        title="Payment Lab"
        // Provider-aware, because the old sentence ("the only thing simulated
        // is the M-Pesa callback") is false under the sandbox, where the
        // callback is the most real part of the whole chain.
        description={
          data.simulationActive
            ? 'Drive payment scenarios against live orders and watch orders, notifications, audit and trust react exactly as in production. The M-Pesa leg is simulated; everything downstream of it is not.'
            : 'Payment requests reach Safaricom and its callbacks reach this server. Orders, notifications, audit and trust react exactly as in production.'
        }
        actions={
          <span
            className={cn(
              'app-label inline-flex shrink-0 items-center rounded-app-pill px-2.5 py-1',
              data.simulationActive
                ? 'bg-app-brand-surface text-app-brand'
                : 'bg-app-sunken text-app-muted'
            )}
          >
            {data.provider}
          </span>
        }
      />

      {!data.simulationActive && !data.realStkDemo && (
        <Alert tone="warning">
          A real Daraja provider is active; scenario triggers are disabled. Metrics below reflect
          real payment events.
        </Alert>
      )}

      {/* What the operator is actually looking at. Stated here rather than
          inferred from the provider pill, because the difference between a
          simulated payment and a real sandbox one is the whole argument. */}
      {data.realStkDemo && (
        <Alert tone="info">
          <span className="app-body-strong">Real STK demonstration.</span> Payment requests go to
          Safaricom&apos;s Daraja sandbox for a nominal{' '}
          <span className="app-data-m">KSh {data.demoAmountKES ?? 1}</span>, while each order keeps
          its true total. The sandbox issues real references and sends a real callback, but cannot
          complete a payment: its test handset has nobody to enter a PIN. Use{' '}
          <span className="app-body-strong">Confirm for demonstration</span> to record the
          confirmation against UmojaHub rather than Safaricom, which is how the audit trail will
          describe it.
        </Alert>
      )}

      {/* Which fixture is loaded, and what it is for.
          The outcome mix on this page is a consequence of a chosen profile, not
          a measurement of M-Pesa. Saying so here, beside the numbers it
          produces, is the difference between a demonstrable test bench and a
          set of invented statistics. */}
      {data.simulationProfile && (
        <div className="rounded-app-card border border-app-hairline bg-app-sunken p-4">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="app-label text-app-muted">Active simulation profile</p>
            <p className="app-body-strong text-app-ink">{data.simulationProfile.name}</p>
          </div>
          <p className="app-meta mt-1 text-app-muted">{data.simulationProfile.purpose}</p>
          <p className="app-meta mt-2 text-app-faint">
            Profiles are test fixtures chosen to exercise a workflow. The mix below follows from
            this profile and is not a measurement of how often M-Pesa succeeds or fails.
          </p>
        </div>
      )}

      {/* What the platform is holding on other people's behalf.
          The first question an auditor asks about an escrow, and the number a
          float has to cover. It was derivable one farmer at a time and so in
          practice unanswerable — every other figure on this page counts events,
          and none of them said how much money was actually in custody. */}
      <section className="rounded-app-card border border-app-hairline bg-app-card p-4">
        <p className="app-body-strong text-app-ink">Escrow position</p>
        <p className="app-meta mt-0.5 text-app-muted">
          Buyers&apos; money the platform is holding right now, and money that has cleared but not
          yet been paid out.
        </p>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-app-control bg-app-sunken p-3">
            <dt className="app-label text-app-muted">Held — awaiting confirmation</dt>
            <dd className="app-data-l mt-1 text-app-ink">
              KSh {data.escrowPosition.heldKES.toLocaleString()}
            </dd>
            <p className="app-meta mt-0.5 text-app-faint">
              across {data.escrowPosition.heldOrders} order
              {data.escrowPosition.heldOrders === 1 ? '' : 's'}
            </p>
          </div>
          <div className="rounded-app-control bg-app-sunken p-3">
            <dt className="app-label text-app-muted">Of that, blocked by a review</dt>
            <dd
              className={cn(
                'app-data-l mt-1',
                data.escrowPosition.underReviewKES > 0 ? 'text-app-warning' : 'text-app-ink'
              )}
            >
              KSh {data.escrowPosition.underReviewKES.toLocaleString()}
            </dd>
            <p className="app-meta mt-0.5 text-app-faint">
              across {data.escrowPosition.underReviewOrders} order
              {data.escrowPosition.underReviewOrders === 1 ? '' : 's'}
            </p>
          </div>
          <div className="rounded-app-control bg-app-sunken p-3">
            <dt className="app-label text-app-muted">Cleared — awaiting payout</dt>
            <dd className="app-data-l mt-1 text-app-ink">
              KSh {data.escrowPosition.clearedKES.toLocaleString()}
            </dd>
            <p className="app-meta mt-0.5 text-app-faint">
              across {data.escrowPosition.clearedOrders} order
              {data.escrowPosition.clearedOrders === 1 ? '' : 's'}
            </p>
          </div>
        </dl>
      </section>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-app-card border border-app-hairline bg-app-card p-3">
            <p className="app-label mb-1 text-app-faint">{s.label}</p>
            <p className="app-data-l text-app-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Unresolved payments — the only rows where UmojaHub does not know
          whether a buyer's money left their account. Placed above every other
          queue because it is the one failure the platform cannot answer on its
          own, and a buyer is waiting on the other end of each line. */}
      {data.unresolvedPayments.length > 0 && (
        <section className="rounded-app-card border border-app-warning/40 bg-app-warning-surface/30 p-4">
          <p className="app-body-strong text-app-ink">
            {data.unresolvedPayments.length} payment
            {data.unresolvedPayments.length === 1 ? '' : 's'} could not be resolved
          </p>
          <p className="app-meta mt-0.5 text-app-muted">
            No callback arrived and the provider could not say whether the buyer was charged. The
            produce stays reserved until someone decides. Check the M-Pesa statement for the
            checkout reference, then settle the order by hand.
          </p>

          <ul className="mt-3 space-y-2">
            {data.unresolvedPayments.map((p) => (
              <li
                key={p.orderId}
                className="rounded-app-control border border-app-hairline bg-app-card p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="app-data-m text-app-ink">{p.orderReferenceId}</span>
                  <span className="app-data-m text-app-ink">
                    KSh {p.totalAmountKES.toLocaleString()}
                  </span>
                </div>
                <p className="app-meta mt-0.5 text-app-muted">
                  {p.cropName} · {p.buyerName}
                  {p.buyerPhone ? ` · ${p.buyerPhone}` : ''}
                </p>
                {p.checkoutRequestId && (
                  <p className="app-meta mt-0.5 text-app-faint">
                    Checkout reference{' '}
                    <span className="app-data-m text-app-muted">{p.checkoutRequestId}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {notice && (
        <p className="app-meta text-app-muted" role="status">
          {notice}
        </p>
      )}

      {/* Trigger panel — awaiting-payment orders */}
      <section className="space-y-3">
        <h2 className="app-h2 text-app-ink">Awaiting payment</h2>
        <p className="app-meta text-app-muted">
          Oldest first. Each of these has produce reserved behind it that no other buyer can order.
          Once a session has been silent for {STUCK_PAYMENT_TIMEOUT_MINUTES} minutes, reconciliation
          asks M-Pesa what happened and either completes the order, releases the produce, or raises
          it to the queue above.
        </p>
        {data.pendingOrders.length === 0 ? (
          <div className="rounded-app-card border border-app-hairline bg-app-card px-4 py-8 text-center">
            <p className="app-body text-app-muted">
              No orders are awaiting payment. Place an order, then fire a scenario here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
            {data.pendingOrders.map((o) => (
              <div
                key={o.orderId}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-app-hairline px-4 py-4 last:border-0"
              >
                <div className="min-w-0 flex-1 basis-[14rem]">
                  <p className="app-body-strong truncate text-app-ink">
                    {o.orderReferenceId} <span className="text-app-muted">· {o.cropName}</span>
                  </p>
                  <p className="app-meta truncate text-app-faint">
                    {o.buyerName} · {formatKES(o.totalAmountKES)}
                  </p>
                  {/* How long the produce has been reserved against a payment
                      nobody has heard back about. */}
                  <p
                    className={cn(
                      'app-meta mt-0.5',
                      o.reconciliationDue ? 'text-app-warning' : 'text-app-faint'
                    )}
                  >
                    {o.reconciliationDue
                      ? `Silent ${formatWait(o.waitingMinutes)} — due for reconciliation`
                      : `Waiting ${formatWait(o.waitingMinutes)}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {/* The bridge. Present only under the demonstration
                      configuration with the Daraja sandbox active, because that
                      is the only situation it exists for: a real STK Push that
                      Safaricom cannot complete. */}
                  {data.demoBridgeAvailable && (
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={firing === o.orderId}
                      onClick={() => void confirmForDemo(o.orderId, o.orderReferenceId)}
                    >
                      Confirm for demonstration
                    </Button>
                  )}
                  <select
                    aria-label={`Scenario for ${o.orderReferenceId}`}
                    value={selectedActions[o.orderId] ?? 'success'}
                    onChange={(e) =>
                      setSelectedActions((prev) => ({
                        ...prev,
                        [o.orderId]: e.target.value as PaymentLabAction,
                      }))
                    }
                    className={SELECT_CLASS}
                  >
                    {PAYMENT_LAB_ACTIONS.map((a) => (
                      <option key={a} value={a}>
                        {ACTION_LABELS[a]}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={firing === o.orderId}
                    disabled={!data.simulationActive}
                    onClick={() => void fire(o.orderId)}
                  >
                    Trigger
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent events */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="app-h2 text-app-ink">Recent events</h2>
          <Button variant="ghost" size="sm" onClick={() => void fetchData()}>
            Refresh
          </Button>
        </div>
        {data.recentEvents.length === 0 ? (
          <div className="rounded-app-card border border-app-hairline bg-app-card px-4 py-8 text-center">
            <p className="app-body text-app-muted">No payment events yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
            {data.recentEvents.map((e, i) => (
              <div
                key={`${e.occurredAt}-${i}`}
                className="border-b border-app-hairline px-4 py-3 last:border-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <EventBadge eventType={e.eventType} />
                    {/* Who caused it. The feed used to attribute nothing, so a
                        buyer cancelling and our own sweep closing a payment out
                        read identically. */}
                    {e.actor && (
                      <span className="app-meta shrink-0 text-app-muted">
                        {ACTOR_LABEL[e.actor] ?? e.actor}
                      </span>
                    )}
                    <span className="app-meta truncate font-app-mono text-app-faint">
                      {e.paymentReference ?? '—'}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    {/* What it moved. Equal values are shown as a dash rather
                        than hidden — an event that changed nothing is a fact
                        worth being able to see. */}
                    {e.newStatus && (
                      <span className="app-meta font-app-mono text-app-faint">
                        {e.previousStatus && e.previousStatus !== e.newStatus
                          ? `${e.previousStatus} → ${e.newStatus}`
                          : e.previousStatus
                            ? `${e.newStatus} — unchanged`
                            : e.newStatus}
                      </span>
                    )}
                    <span className="app-data-m text-app-muted">{formatKES(e.amount)}</span>
                    {e.resultCode != null && (
                      <span className="app-meta font-app-mono text-app-faint">
                        code {e.resultCode}
                      </span>
                    )}
                    <span className="app-meta text-app-faint">{formatTime(e.occurredAt)}</span>
                  </div>
                </div>
                {e.reason && <p className="app-meta mt-1 text-app-faint">{e.reason}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}
