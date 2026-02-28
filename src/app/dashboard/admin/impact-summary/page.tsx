'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';
import { Role } from '@/types';

interface IFoodMetrics {
  verifiedFarmerCount: number;
  activeBuyerCount: number;
  completedOrderCount: number;
  totalTransactionVolumeKES: number;
  averagePlatformPremium: number;
  activeCropCount: number;
  countiesRepresented: number;
  avgTrustScore: number;
}

interface IEducationMetrics {
  registeredStudentCount: number;
  verifiedProjectCount: number;
  activeStudentCount: number;
  averageProjectScore: number;
  skillsIssuedCount: number;
  lecturerCount: number;
  universitiesRepresented: number;
}

interface IImpactSummary {
  _id: string;
  computedAt: string;
  food: IFoodMetrics;
  education: IEducationMetrics;
}

type PageState = 'loading' | 'ready' | 'empty' | 'error';

function MetricCard({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}): React.ReactElement {
  return (
    <div className="bg-surface-secondary border border-white/5 rounded p-4">
      <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className={`text-t2 font-semibold text-text-primary ${mono ? 'font-mono' : 'font-heading'}`}>
        {value}
      </p>
    </div>
  );
}

function formatKES(amount: number): string {
  if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(0)}K`;
  return `KES ${amount.toLocaleString('en-KE')}`;
}

export default function AdminImpactSummaryPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [summary, setSummary] = useState<IImpactSummary | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  const fetchSummary = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/admin/impact-summary');
      if (res.status === 404) {
        setPageState('empty');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const json = (await res.json()) as { data: IImpactSummary };
      setSummary(json.data);
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

  async function triggerCron(): Promise<void> {
    setIsTriggering(true);
    setTriggerMessage(null);
    try {
      const res = await fetch('/api/cron/impact-summary', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env['NEXT_PUBLIC_CRON_SECRET'] ?? ''}` },
      });
      if (res.ok) {
        setTriggerMessage('Cron job triggered. Refreshing data...');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        void fetchSummary();
      } else {
        setTriggerMessage('Could not trigger cron. Run it from the Vercel dashboard.');
      }
    } catch {
      setTriggerMessage('Network error. Try again.');
    } finally {
      setIsTriggering(false);
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-48 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-t4 font-body font-medium text-text-primary mb-2">
          Could not load impact summary
        </p>
        <Button variant="secondary" onClick={() => void fetchSummary()}>
          Retry
        </Button>
      </div>
    );
  }

  if (pageState === 'empty' || !summary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-t2 font-heading font-semibold text-text-primary">Platform impact</h1>
          <p className="text-t5 font-body text-text-secondary mt-0.5">
            No summary computed yet
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 rounded bg-surface-elevated">
          <p className="text-t4 font-body font-medium text-text-primary mb-1">
            Impact summary not yet generated
          </p>
          <p className="text-t5 font-body text-text-secondary mb-6 max-w-sm">
            The nightly cron job at{' '}
            <span className="font-mono text-text-secondary">POST /api/cron/impact-summary</span>{' '}
            generates this data. Trigger it manually to seed the first summary.
          </p>
          <Button variant="primary" isLoading={isTriggering} onClick={() => void triggerCron()}>
            Generate now
          </Button>
          {triggerMessage && (
            <p className="text-t5 font-body text-text-secondary mt-4">{triggerMessage}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-t2 font-heading font-semibold text-text-primary">Platform impact</h1>
          <p className="text-t6 font-mono text-text-disabled mt-0.5">
            Last computed: {formatDate(summary.computedAt)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button variant="secondary" isLoading={isTriggering} onClick={() => void triggerCron()}>
            Recompute
          </Button>
          {triggerMessage && (
            <p className="text-t6 font-body text-text-secondary">{triggerMessage}</p>
          )}
        </div>
      </div>

      {/* Food Hub metrics */}
      <section>
        <h2 className="text-t3 font-heading font-medium text-text-primary mb-4">Food Hub</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Verified farmers"
            value={summary.food.verifiedFarmerCount.toLocaleString('en-KE')}
            mono
          />
          <MetricCard
            label="Active buyers"
            value={summary.food.activeBuyerCount.toLocaleString('en-KE')}
            mono
          />
          <MetricCard
            label="Completed orders"
            value={summary.food.completedOrderCount.toLocaleString('en-KE')}
            mono
          />
          <MetricCard
            label="Total volume"
            value={formatKES(summary.food.totalTransactionVolumeKES)}
            mono
          />
          <MetricCard
            label="Avg trust score"
            value={`${summary.food.avgTrustScore.toFixed(1)}`}
            mono
          />
          <MetricCard
            label="Platform premium"
            value={`${summary.food.averagePlatformPremium.toFixed(1)}%`}
            mono
          />
          <MetricCard
            label="Active crops"
            value={summary.food.activeCropCount.toLocaleString('en-KE')}
            mono
          />
          <MetricCard
            label="Counties represented"
            value={summary.food.countiesRepresented.toLocaleString('en-KE')}
            mono
          />
        </div>
      </section>

      {/* Education Hub metrics */}
      <section>
        <h2 className="text-t3 font-heading font-medium text-text-primary mb-4">Education Hub</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Registered students"
            value={summary.education.registeredStudentCount.toLocaleString('en-KE')}
            mono
          />
          <MetricCard
            label="Active students"
            value={summary.education.activeStudentCount.toLocaleString('en-KE')}
            mono
          />
          <MetricCard
            label="Verified projects"
            value={summary.education.verifiedProjectCount.toLocaleString('en-KE')}
            mono
          />
          <MetricCard
            label="Avg project score"
            value={`${summary.education.averageProjectScore.toFixed(2)} / 5`}
            mono
          />
          <MetricCard
            label="Skills issued"
            value={summary.education.skillsIssuedCount.toLocaleString('en-KE')}
            mono
          />
          <MetricCard
            label="Lecturers"
            value={summary.education.lecturerCount.toLocaleString('en-KE')}
            mono
          />
          <MetricCard
            label="Universities"
            value={summary.education.universitiesRepresented.toLocaleString('en-KE')}
            mono
          />
        </div>
      </section>

      {/* Raw data toggle */}
      <details className="bg-surface-elevated border border-white/5 rounded">
        <summary className="px-4 py-3 text-t5 font-mono text-text-secondary cursor-pointer hover:text-text-primary transition-colors duration-150">
          Raw JSON
        </summary>
        <pre className="px-4 pb-4 text-t6 font-mono text-text-disabled overflow-x-auto">
          {JSON.stringify(summary, null, 2)}
        </pre>
      </details>
    </div>
  );
}
