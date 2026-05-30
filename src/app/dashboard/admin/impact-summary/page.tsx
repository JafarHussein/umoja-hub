'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@/types';

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
      router.push('/auth/login');
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
    return <p className="p-4">Loading...</p>;
  }

  if (pageState === 'error') {
    return (
      <div className="p-4 flex flex-col gap-2">
        <p>Failed to load impact summary.</p>
        <button type="button" onClick={() => void fetchSummary()}>
          Retry
        </button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-4 flex flex-col gap-2">
        <h1 className="text-base font-semibold">Impact Summary</h1>
        <p className="text-sm text-gray-500">
          No snapshot yet. Run the impact-summary cron to generate the first record.
        </p>
      </div>
    );
  }

  const metrics: { label: string; value: string }[] = [
    { label: 'Total farmers registered', value: summary.totalFarmers.toLocaleString() },
    { label: 'Verified farmers', value: summary.verifiedFarmers.toLocaleString() },
    { label: 'Total buyers', value: summary.totalBuyers.toLocaleString() },
    { label: 'Total orders placed', value: summary.totalOrders.toLocaleString() },
    { label: 'Completed orders', value: summary.completedOrders.toLocaleString() },
    {
      label: 'Revenue facilitated',
      value: `KES ${summary.totalRevenueKES.toLocaleString()}`,
    },
    { label: 'Counties active', value: summary.countiesCovered.toLocaleString() },
  ];

  const generatedAt = new Date(summary.generatedAt).toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-base font-semibold">Impact Summary</h1>
        <p className="text-xs text-gray-500">Last updated: {generatedAt}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map(({ label, value }) => (
          <div key={label} className="border border-gray-300 p-3 flex flex-col gap-1">
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-xl font-semibold tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
