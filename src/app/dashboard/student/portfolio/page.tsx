'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@/types';
import { Button } from '@/components/app';

interface IPortfolioStats {
  verifiedProjectCount: number;
  totalProjectCount: number;
  averageScore: number;
  techStacksUsed: string[];
  reviewerInstitutions: string[];
}

interface IPortfolio {
  currentTier: string;
  portfolioStrength: string;
  stats: IPortfolioStats;
  verifiedProjects: unknown[];
  verifiedSkills: unknown[];
  lastRecalculatedAt: string | null;
}

type PageState = 'loading' | 'ready' | 'error';

function PageSkeleton(): React.ReactElement {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="skeleton h-7 w-36 rounded" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-app-card" />
        ))}
      </div>
      <div className="skeleton h-24 rounded-app-card" />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div className="rounded-app-card border border-app-hairline bg-app-card p-3">
      <p className="app-label mb-1 text-app-muted">{label}</p>
      <p className="app-data-l text-app-ink">{value}</p>
    </div>
  );
}

export default function PortfolioPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [portfolio, setPortfolio] = useState<IPortfolio | null>(null);

  const fetchPortfolio = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/students/me/portfolio');
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: IPortfolio };
      setPortfolio(body.data);
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
      if (session.user.role !== Role.STUDENT) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchPortfolio();
    }
  }, [status, session, router, fetchPortfolio]);

  if (status === 'loading' || pageState === 'loading') {
    return <PageSkeleton />;
  }

  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Failed to load portfolio</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button
          variant="secondary"
          onClick={() => {
            setPageState('loading');
            void fetchPortfolio();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const hasVerifiedProjects = (portfolio?.stats.verifiedProjectCount ?? 0) > 0;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="app-h1 text-app-ink">My Portfolio</h1>
        {portfolio && (
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="app-label inline-flex items-center rounded-app-pill bg-app-brand-surface px-2 py-0.5 capitalize text-app-brand">
              {portfolio.currentTier.replace(/_/g, ' ').toLowerCase()}
            </span>
            <span className="app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2 py-0.5 capitalize text-app-muted">
              {portfolio.portfolioStrength.replace(/_/g, ' ').toLowerCase()}
            </span>
          </div>
        )}
      </div>

      {/* Stat grid */}
      {portfolio && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Verified" value={portfolio.stats.verifiedProjectCount} />
          <StatCard label="Total" value={portfolio.stats.totalProjectCount} />
          <StatCard
            label="Avg score"
            value={
              portfolio.stats.averageScore > 0 ? portfolio.stats.averageScore.toFixed(1) : '—'
            }
          />
          <StatCard label="Tech stacks" value={portfolio.stats.techStacksUsed.length} />
        </div>
      )}

      {/* Tech stack tags */}
      {portfolio && portfolio.stats.techStacksUsed.length > 0 && (
        <div className="space-y-3 rounded-app-card border border-app-hairline bg-app-card p-4">
          <p className="app-label text-app-muted">Skills used</p>
          <div className="flex flex-wrap gap-1.5">
            {portfolio.stats.techStacksUsed.map((tech) => (
              <span
                key={tech}
                className="app-label rounded-app-pill border border-app-hairline bg-app-sunken px-2 py-0.5 text-app-muted"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Verified projects */}
      {!hasVerifiedProjects ? (
        <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
          <p className="app-body text-app-muted">No verified projects yet</p>
          <p className="app-meta mt-1 text-app-faint">
            Complete a project and receive a VERIFIED decision from a lecturer to build your
            portfolio.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
          <div className="border-b border-app-hairline px-4 py-3">
            <p className="app-label text-app-muted">Verified projects</p>
          </div>
          <div className="px-4 py-3">
            <p className="app-body text-app-muted">
              {portfolio!.stats.verifiedProjectCount} project
              {portfolio!.stats.verifiedProjectCount !== 1 ? 's' : ''} verified
            </p>
          </div>
        </div>
      )}

      {/* Last recalculated timestamp */}
      {portfolio?.lastRecalculatedAt && (
        <p className="app-meta text-app-faint">
          Last updated{' '}
          {new Date(portfolio.lastRecalculatedAt).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      )}
    </div>
  );
}
