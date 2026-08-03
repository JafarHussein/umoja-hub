'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Button,
  EmptyState,
  MetricGrid,
  MetricTile,
  Page,
  PageHeader,
} from '@/components/app';
import { Role } from '@/types';
import { loginUrlWithIntent } from '@/lib/auth/intent';

interface ISummary {
  totalFarmers: number;
  verifiedFarmers: number;
  totalBuyers: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenueKES: number;
  countiesCovered: number;
  generatedAt: string;
}

interface ISummaryResponse {
  summary: ISummary | null;
}

type PageState = 'loading' | 'ready' | 'error';

export default function AdminImpactSummaryPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [summary, setSummary] = useState<ISummary | null>(null);

  const fetchSummary = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/admin/impact-summary');
      if (!res.ok) throw new Error('Request failed');
      const data = (await res.json()) as ISummaryResponse;
      setSummary(data.summary);
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
      void fetchSummary();
    }
  }, [status, session, router, fetchSummary]);

  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="skeleton h-7 w-44 rounded" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-app-card" />
          ))}
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Could not load impact summary</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => void fetchSummary()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!summary) {
    return (
      <Page>
        <PageHeader title="Impact Summary" />
        <EmptyState
          title="No snapshot has been generated yet"
          description="This page reports from a periodic snapshot rather than querying live, so the figures stay stable between runs. Run the impact-summary cron once and the first record will appear here."
        />
      </Page>
    );
  }

  const metrics: { label: string; value: string }[] = [
    { label: 'Total farmers registered', value: summary.totalFarmers.toLocaleString() },
    { label: 'Verified farmers', value: summary.verifiedFarmers.toLocaleString() },
    { label: 'Total buyers', value: summary.totalBuyers.toLocaleString() },
    { label: 'Total orders placed', value: summary.totalOrders.toLocaleString() },
    { label: 'Completed orders', value: summary.completedOrders.toLocaleString() },
    { label: 'Revenue facilitated', value: `KSh ${summary.totalRevenueKES.toLocaleString()}` },
    { label: 'Counties active', value: summary.countiesCovered.toLocaleString() },
  ];

  const generatedAt = new Date(summary.generatedAt).toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Page>
      <PageHeader
        title="Impact Summary"
        description="What the platform has actually done, counted from a periodic snapshot: who is registered, what they traded, and how far across the country it reached."
        meta={<span>Last updated {generatedAt}</span>}
      />

      <MetricGrid columns={4}>
        {metrics.map(({ label, value }) => (
          <MetricTile key={label} label={label} value={value} />
        ))}
      </MetricGrid>
    </Page>
  );
}
