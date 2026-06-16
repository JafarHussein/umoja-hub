'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { Role } from '@/types';
import { PAYMENT_LAB_ACTIONS, type PaymentLabAction } from '@/lib/validation/paymentLabSchema';

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
  metrics: IMetrics;
  pendingOrders: IPendingOrder[];
  recentEvents: IEvent[];
}

type PageState = 'loading' | 'ready' | 'error';

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

const EVENT_VARIANT: Record<string, BadgeVariant> = {
  SUCCESS: 'success',
  INITIATED: 'neutral',
  CALLBACK_RECEIVED: 'neutral',
  FAILED: 'error',
  TIMEOUT: 'warning',
  DUPLICATE: 'warning',
  LOST: 'error',
  RECONCILED: 'warning',
};

function formatKES(amount?: number | null): string {
  return amount != null ? `KES ${amount.toLocaleString()}` : '—';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
      router.push('/auth/login');
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
        <div className="skeleton h-6 w-40 rounded" />
        <ListSkeleton rows={5} />
      </div>
    );
  }

  if (pageState === 'error' || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-t4 font-body font-medium text-fg mb-2">
          Could not load the Payment Lab
        </p>
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
    { label: 'Avg completion', value: m.avgCompletionMs ? `${(m.avgCompletionMs / 1000).toFixed(1)}s` : '—' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-t2 font-heading font-semibold text-fg">Payment Lab</h1>
          <p className="text-t5 font-body text-fg-muted mt-0.5 max-w-2xl">
            Drive payment scenarios against live orders and watch orders, notifications, audit, and
            trust react exactly as in production. The only thing simulated is the M-Pesa callback.
          </p>
        </div>
        <Badge
          variant={data.simulationActive ? 'success' : 'neutral'}
          label={data.provider}
        />
      </div>

      {!data.simulationActive && (
        <p className="text-t5 font-body text-fg-muted border border-yellow-800/40 bg-yellow-950/40 rounded px-4 py-3">
          A real Daraja provider is active — scenario triggers are disabled. Metrics below reflect
          real payment events.
        </p>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface border border-white/5 rounded p-3">
            <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest mb-1">
              {s.label}
            </p>
            <p className="text-t3 font-mono text-fg">{s.value}</p>
          </div>
        ))}
      </div>

      {notice && (
        <p className="text-t6 font-body text-fg-muted" role="status">
          {notice}
        </p>
      )}

      {/* Trigger panel — awaiting-payment orders */}
      <section className="space-y-3">
        <h2 className="text-t3 font-heading font-medium text-fg">Awaiting payment</h2>
        {data.pendingOrders.length === 0 ? (
          <div className="border border-white/5 rounded bg-surface px-4 py-8 text-center">
            <p className="text-t5 font-body text-fg-muted">
              No orders are awaiting payment. Place an order, then fire a scenario here.
            </p>
          </div>
        ) : (
          <div className="bg-surface border border-white/5 rounded overflow-hidden">
            {data.pendingOrders.map((o) => (
              <div
                key={o.orderId}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 border-b border-white/5 last:border-0"
              >
                <div className="min-w-0 flex-1 basis-[14rem]">
                  <p className="text-t5 font-body text-fg truncate">
                    {o.orderReferenceId}{' '}
                    <span className="text-fg-muted">· {o.cropName}</span>
                  </p>
                  <p className="text-t6 font-body text-fg-disabled truncate">
                    {o.buyerName} · {formatKES(o.totalAmountKES)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    aria-label={`Scenario for ${o.orderReferenceId}`}
                    value={selectedActions[o.orderId] ?? 'success'}
                    onChange={(e) =>
                      setSelectedActions((prev) => ({
                        ...prev,
                        [o.orderId]: e.target.value as PaymentLabAction,
                      }))
                    }
                    className="min-h-[36px] bg-surface-raised border border-white/10 rounded-sm text-t6 font-body text-fg px-2 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all duration-150"
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
          <h2 className="text-t3 font-heading font-medium text-fg">Recent events</h2>
          <Button variant="ghost" size="sm" onClick={() => void fetchData()}>
            Refresh
          </Button>
        </div>
        {data.recentEvents.length === 0 ? (
          <div className="border border-white/5 rounded bg-surface px-4 py-8 text-center">
            <p className="text-t5 font-body text-fg-muted">No payment events yet.</p>
          </div>
        ) : (
          <div className="bg-surface border border-white/5 rounded overflow-hidden">
            {data.recentEvents.map((e, i) => (
              <div
                key={`${e.occurredAt}-${i}`}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant={EVENT_VARIANT[e.eventType] ?? 'neutral'} label={e.eventType} />
                  <span className="text-t6 font-mono text-fg-disabled truncate">
                    {e.paymentReference ?? '—'}
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-t6 font-mono text-fg-muted">{formatKES(e.amount)}</span>
                  {e.resultCode != null && (
                    <span className="text-t6 font-mono text-fg-disabled">code {e.resultCode}</span>
                  )}
                  <span className="text-t6 font-body text-fg-disabled">
                    {formatTime(e.occurredAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
