'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Alert, Page, PageHeader } from '@/components/app';
import { cn } from '@/lib/cn';
import { Role } from '@/types';
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
}

interface IEvent {
  eventType: string;
  provider: string;
  amount: number | null;
  paymentReference: string | null;
  resultCode: number | null;
  processingTimeMs: number | null;
  occurredAt: string;
}

interface ILabResponse {
  provider: string;
  simulationActive: boolean;
  /** The loaded fixture and the workflow it exists to exercise. Null under a real provider. */
  simulationProfile: { name: string; purpose: string } | null;
  metrics: IMetrics;
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
        description="Drive payment scenarios against live orders and watch orders, notifications, audit, and trust react exactly as in production. The only thing simulated is the M-Pesa callback."
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

      {!data.simulationActive && (
        <Alert tone="warning">
          A real Daraja provider is active; scenario triggers are disabled. Metrics below reflect
          real payment events.
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

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-app-card border border-app-hairline bg-app-card p-3">
            <p className="app-label mb-1 text-app-faint">{s.label}</p>
            <p className="app-data-l text-app-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {notice && (
        <p className="app-meta text-app-muted" role="status">
          {notice}
        </p>
      )}

      {/* Trigger panel — awaiting-payment orders */}
      <section className="space-y-3">
        <h2 className="app-h2 text-app-ink">Awaiting payment</h2>
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
                </div>
                <div className="flex shrink-0 items-center gap-2">
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
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-app-hairline px-4 py-3 last:border-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <EventBadge eventType={e.eventType} />
                  <span className="app-meta truncate font-app-mono text-app-faint">
                    {e.paymentReference ?? '—'}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="app-data-m text-app-muted">{formatKES(e.amount)}</span>
                  {e.resultCode != null && (
                    <span className="app-meta font-app-mono text-app-faint">code {e.resultCode}</span>
                  )}
                  <span className="app-meta text-app-faint">{formatTime(e.occurredAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}
