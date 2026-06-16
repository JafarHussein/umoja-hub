'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@/types';
import { Badge } from '@/components/ui/Badge';

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
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-1.5">
          <div className="h-3 w-20 bg-surface-raised rounded-sm animate-pulse" />
          <div className="h-7 w-36 bg-surface-raised rounded-sm animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-zinc-800/50 rounded-[4px] p-3 space-y-2">
              <div className="h-3 w-16 bg-surface-raised rounded-sm animate-pulse" />
              <div className="h-6 w-12 bg-surface-raised rounded-sm animate-pulse" />
            </div>
          ))}
        </div>
        <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
          <div className="h-3 w-24 bg-surface-raised rounded-sm animate-pulse" />
          <div className="h-4 w-48 bg-surface-raised rounded-sm animate-pulse" />
        </div>
      </div>
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
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-fg-muted">Failed to load portfolio.</p>
            <button
              onClick={() => { setPageState('loading'); void fetchPortfolio(); }}
              className="inline-flex mt-4 text-t5 font-body text-brand hover:text-brand/80 transition-colors duration-150"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasVerifiedProjects = (portfolio?.stats.verifiedProjectCount ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest mb-1">
              Student · Portfolio
            </p>
            <h1 className="text-t2 font-heading font-semibold text-fg tracking-tight">
              My Portfolio
            </h1>
          </div>
          {portfolio && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge label={portfolio.currentTier} />
              <Badge variant="neutral" label={portfolio.portfolioStrength} />
            </div>
          )}
        </div>

        {/* Stat grid */}
        {portfolio && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-3">
              <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest mb-1">
                Verified
              </p>
              <p className="text-t2 font-heading font-semibold text-fg tabular-nums">
                {portfolio.stats.verifiedProjectCount}
              </p>
            </div>
            <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-3">
              <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest mb-1">
                Total
              </p>
              <p className="text-t2 font-heading font-semibold text-fg tabular-nums">
                {portfolio.stats.totalProjectCount}
              </p>
            </div>
            <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-3">
              <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest mb-1">
                Avg score
              </p>
              <p className="text-t2 font-heading font-semibold text-fg tabular-nums">
                {portfolio.stats.averageScore > 0
                  ? portfolio.stats.averageScore.toFixed(1)
                  : '—'}
              </p>
            </div>
            <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-3">
              <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest mb-1">
                Tech stacks
              </p>
              <p className="text-t2 font-heading font-semibold text-fg tabular-nums">
                {portfolio.stats.techStacksUsed.length}
              </p>
            </div>
          </div>
        )}

        {/* Tech stack tags */}
        {portfolio && portfolio.stats.techStacksUsed.length > 0 && (
          <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
            <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest">
              Skills used
            </p>
            <div className="flex flex-wrap gap-1.5">
              {portfolio.stats.techStacksUsed.map((tech) => (
                <span
                  key={tech}
                  className="text-t6 font-mono text-fg-muted bg-surface-raised border border-zinc-800/50 rounded-[2px] px-2 py-0.5"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Verified projects */}
        {!hasVerifiedProjects ? (
          <div className="bg-surface border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-fg-muted">No verified projects yet</p>
            <p className="text-t5 font-body text-fg-disabled mt-1">
              Complete a project and receive a VERIFIED decision from a lecturer to build your portfolio.
            </p>
          </div>
        ) : (
          <div className="bg-surface border border-zinc-800/50 rounded-[4px] overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800/50">
              <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest">
                Verified projects
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-t5 font-body text-fg-muted">
                {portfolio!.stats.verifiedProjectCount} project
                {portfolio!.stats.verifiedProjectCount !== 1 ? 's' : ''} verified
              </p>
            </div>
          </div>
        )}

        {/* Last recalculated timestamp */}
        {portfolio?.lastRecalculatedAt && (
          <p className="font-mono text-t6 text-fg-disabled">
            Last updated{' '}
            {new Date(portfolio.lastRecalculatedAt).toLocaleDateString('en-KE', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
