'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@/types';
import { loginUrlWithIntent } from '@/lib/auth/intent';
import {
  EmptyState,
  MetricGrid,
  MetricTile,
  Page,
  PageHeader,
  PageSection,
} from '@/components/app';

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
    <Page>
      <div className="skeleton h-8 w-44 rounded" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-app-card" />
        ))}
      </div>
      <div className="skeleton h-32 rounded-app-card" />
    </Page>
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
      router.push(loginUrlWithIntent());
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
      <Page>
        <PageHeader title="My Portfolio" />
        <EmptyState
          title="We could not load your portfolio"
          description="Your verified projects are stored on UmojaHub and are unaffected — this screen just could not reach them."
          action={{
            label: 'Try again',
            onClick: () => {
              setPageState('loading');
              void fetchPortfolio();
            },
          }}
        />
      </Page>
    );
  }

  const hasVerifiedProjects = (portfolio?.stats.verifiedProjectCount ?? 0) > 0;

  return (
    <Page>
      {/* Header */}
      <PageHeader
        title="My Portfolio"
        description="The public record of work a lecturer has checked and signed off. Employers can open this and see the projects themselves rather than a list of claims."
        meta={
          portfolio ? (
            <>
              <span className="capitalize">
                {portfolio.currentTier.replace(/_/g, ' ').toLowerCase()}
              </span>
              <span className="capitalize">
                {portfolio.portfolioStrength.replace(/_/g, ' ').toLowerCase()} portfolio
              </span>
              {portfolio.lastRecalculatedAt && (
                <span>
                  updated{' '}
                  {new Date(portfolio.lastRecalculatedAt).toLocaleDateString('en-KE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </>
          ) : undefined
        }
      />

      {/* Stat grid */}
      {portfolio && (
        <MetricGrid columns={4}>
          <MetricTile
            label="Verified"
            value={portfolio.stats.verifiedProjectCount}
            emphasis
            caption="Signed off by a lecturer and visible to employers."
          />
          <MetricTile
            label="Total projects"
            value={portfolio.stats.totalProjectCount}
            caption="Everything you have started, verified or not."
          />
          <MetricTile
            label="Average score"
            value={
              portfolio.stats.averageScore > 0 ? portfolio.stats.averageScore.toFixed(1) : '—'
            }
            caption="Across every project a lecturer has scored."
          />
          <MetricTile
            label="Tech stacks"
            value={portfolio.stats.techStacksUsed.length}
            caption="Distinct technologies your verified work covers."
          />
        </MetricGrid>
      )}

      {/* Tech stack tags */}
      {portfolio && portfolio.stats.techStacksUsed.length > 0 && (
        <PageSection
          title="Skills used"
          description="Drawn from the projects themselves, not self-reported."
        >
          <div className="flex flex-wrap gap-2 rounded-app-card border border-app-hairline bg-app-card p-6">
            {portfolio.stats.techStacksUsed.map((tech) => (
              <span
                key={tech}
                className="app-label rounded-app-pill border border-app-hairline bg-app-sunken px-2.5 py-1 text-app-muted"
              >
                {tech}
              </span>
            ))}
          </div>
        </PageSection>
      )}

      {/* Verified projects */}
      <PageSection title="Verified projects">
        {!hasVerifiedProjects ? (
          <EmptyState
            title="Nothing has been verified yet"
            description="A project appears here once a lecturer reviews it and returns a VERIFIED decision. That decision — not the fact you built something — is what an employer is looking at."
            action={{ label: 'Start a project', href: '/dashboard/student/projects/new' }}
            hints={[
              {
                label: 'Ask the AI mentor',
                href: '/dashboard/student/mentor',
                description: 'work through the brief before you submit',
              },
            ]}
          />
        ) : (
          // The count already sits in the metric above, so this card says the
          // thing the number does not: what having them actually does for you.
          <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
            <p className="app-body max-w-app-prose text-app-muted">
              Your verified work is published at your public portfolio link. Employers searching
              UmojaHub can open it without an account, and each project carries the name of the
              lecturer who signed it off.
            </p>
          </div>
        )}
      </PageSection>
    </Page>
  );
}
