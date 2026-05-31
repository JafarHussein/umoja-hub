'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Role, ProjectStatus, ProjectTrack, StudentTier } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProjectStatusStepper } from '@/components/education/ProjectStatusStepper';

// ── Brief type definitions ────────────────────────────────────────────────────

interface IAIBrief {
  title: string;
  clientPersona: { businessType: string; county: string; context: string };
  problemStatement: string;
  coreRequirements: string[];
  technicalConstraints: string[];
  kenyanContextConstraints: string[];
  deliverables: string[];
  suggestedTechStack: string[];
  estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface IOpenSourceBrief {
  repoUrl: string;
  repoName: string;
  contributionGoal: string;
  proposedApproach: string;
}

interface IActiveEngagement {
  _id: string;
  track: ProjectTrack;
  tier: StudentTier;
  status: ProjectStatus;
  brief: Record<string, unknown>;
  createdAt: string;
}

type PageState = 'loading' | 'ready' | 'not_found' | 'error';
type ActionState = 'idle' | 'beginning';

type ComplexityVariant = 'success' | 'warning' | 'error';

const COMPLEXITY_VARIANT: Record<'LOW' | 'MEDIUM' | 'HIGH', ComplexityVariant> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error',
};

// ── Loading skeleton ──────────────────────────────────────────────────────────

function PageSkeleton(): React.ReactElement {
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="h-4 w-24 bg-surface-secondary rounded-sm animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-3 w-32 bg-surface-secondary rounded-sm animate-pulse" />
          <div className="h-7 w-56 bg-surface-secondary rounded-sm animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-4">
            <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
              <div className="h-5 w-48 bg-surface-secondary rounded-sm animate-pulse" />
              <div className="h-4 w-full bg-surface-secondary rounded-sm animate-pulse" />
              <div className="h-4 w-3/4 bg-surface-secondary rounded-sm animate-pulse" />
              <div className="h-4 w-5/6 bg-surface-secondary rounded-sm animate-pulse" />
              <div className="h-4 w-2/3 bg-surface-secondary rounded-sm animate-pulse" />
            </div>
          </div>
          <div className="md:col-span-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-surface-secondary animate-pulse flex-shrink-0" />
                  <div className="h-4 w-28 bg-surface-secondary rounded-sm animate-pulse" />
                </div>
                {i < 4 && <div className="ml-[4px] w-px h-4 bg-zinc-800/50" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI Brief card ─────────────────────────────────────────────────────────────

function AIBriefCard({ brief }: { brief: IAIBrief }): React.ReactElement {
  return (
    <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-4">
      <div>
        <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
          Brief
        </p>
        <h2 className="text-t3 font-heading font-semibold text-text-primary tracking-tight">
          {brief.title}
        </h2>
      </div>

      <div className="space-y-0">
        <div className="flex items-start justify-between py-2.5 border-b border-zinc-800/50">
          <span className="text-t5 font-body text-text-secondary flex-shrink-0 mr-4">
            Client
          </span>
          <span className="text-t5 font-body text-text-primary text-right">
            {brief.clientPersona.businessType} · {brief.clientPersona.county}
          </span>
        </div>
        <div className="flex items-start justify-between py-2.5 border-b border-zinc-800/50">
          <span className="text-t5 font-body text-text-secondary flex-shrink-0 mr-4">
            Complexity
          </span>
          <Badge
            variant={COMPLEXITY_VARIANT[brief.estimatedComplexity]}
            label={brief.estimatedComplexity}
          />
        </div>
      </div>

      <div>
        <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1.5">
          Problem statement
        </p>
        <p className="text-t5 font-body text-text-secondary leading-relaxed">
          {brief.problemStatement}
        </p>
      </div>

      {brief.coreRequirements.length > 0 && (
        <div>
          <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1.5">
            Core requirements
          </p>
          <ul className="space-y-1">
            {brief.coreRequirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-text-disabled mt-1 flex-shrink-0" aria-hidden="true">
                  –
                </span>
                <span className="text-t5 font-body text-text-secondary">{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {brief.deliverables.length > 0 && (
        <div>
          <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1.5">
            Deliverables
          </p>
          <ul className="space-y-1">
            {brief.deliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-text-disabled mt-1 flex-shrink-0" aria-hidden="true">
                  –
                </span>
                <span className="text-t5 font-body text-text-secondary">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {brief.suggestedTechStack.length > 0 && (
        <div>
          <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1.5">
            Suggested stack
          </p>
          <div className="flex flex-wrap gap-1.5">
            {brief.suggestedTechStack.map((tech) => (
              <span
                key={tech}
                className="text-t6 font-mono text-text-secondary bg-surface-secondary border border-zinc-800/50 rounded-[2px] px-2 py-0.5"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Open Source Brief card ────────────────────────────────────────────────────

function OpenSourceBriefCard({ brief }: { brief: IOpenSourceBrief }): React.ReactElement {
  return (
    <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-4">
      <div>
        <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
          Open Source Brief
        </p>
        <h2 className="text-t3 font-heading font-semibold text-text-primary tracking-tight">
          {brief.repoName}
        </h2>
      </div>

      <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
        <span className="text-t5 font-body text-text-secondary">Repository</span>
        <a
          href={brief.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-t5 font-mono text-accent-green hover:text-accent-green/80 transition-colors duration-150"
        >
          {brief.repoUrl.replace('https://github.com/', '')}
        </a>
      </div>

      <div>
        <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1.5">
          Contribution goal
        </p>
        <p className="text-t5 font-body text-text-secondary leading-relaxed">
          {brief.contributionGoal}
        </p>
      </div>

      <div>
        <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1.5">
          Proposed approach
        </p>
        <p className="text-t5 font-body text-text-secondary leading-relaxed">
          {brief.proposedApproach}
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProjectWorkspacePage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [engagement, setEngagement] = useState<IActiveEngagement | null>(null);
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchEngagement = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/education/engagements/me');
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: IActiveEngagement | null };
      if (!body.data || String(body.data._id) !== params.id) {
        setPageState('not_found');
        return;
      }
      setEngagement(body.data);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, [params.id]);

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
      void fetchEngagement();
    }
  }, [status, session, router, fetchEngagement]);

  async function handleBeginProject(): Promise<void> {
    if (!engagement) return;
    setActionState('beginning');
    setActionError(null);

    try {
      const res = await fetch(`/api/education/engagements/${engagement._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setActionError(body.error ?? 'Failed to start project. Please try again.');
        setActionState('idle');
        return;
      }

      setEngagement({ ...engagement, status: ProjectStatus.IN_PROGRESS });
      setActionState('idle');
    } catch {
      setActionError('Network error. Try again.');
      setActionState('idle');
    }
  }

  if (status === 'loading' || pageState === 'loading') {
    return <PageSkeleton />;
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-text-secondary">Failed to load project.</p>
            <Link
              href="/dashboard/student"
              className="inline-flex mt-4 text-t5 font-body text-accent-green hover:text-accent-green/80 transition-colors duration-150"
            >
              ← My projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'not_found' || !engagement) {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-text-secondary">Project not found.</p>
            <Link
              href="/dashboard/student"
              className="inline-flex mt-4 text-t5 font-body text-accent-green hover:text-accent-green/80 transition-colors duration-150"
            >
              ← My projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAIBrief = engagement.track === ProjectTrack.AI_BRIEF;
  const brief = engagement.brief;

  const briefTitle = isAIBrief
    ? ((brief as Partial<IAIBrief>).title ?? engagement.track)
    : ((brief as Partial<IOpenSourceBrief>).repoName ?? engagement.track);

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Back link */}
        <Link
          href="/dashboard/student"
          className="inline-flex text-t5 font-body text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          ← My projects
        </Link>

        {/* Page header */}
        <div>
          <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
            {engagement._id}
          </p>
          <h1 className="text-t2 font-heading font-semibold text-text-primary tracking-tight">
            {briefTitle}
          </h1>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left — brief + workspace */}
          <div className="md:col-span-8 space-y-6">

            {/* Brief card */}
            {isAIBrief ? (
              <AIBriefCard brief={brief as unknown as IAIBrief} />
            ) : (
              <OpenSourceBriefCard brief={brief as unknown as IOpenSourceBrief} />
            )}

            {/* Workspace tabs shell */}
            <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-zinc-800/50">
                {(['Overview', 'Documents', 'Blockers', 'AI Usage'] as const).map(
                  (tab, i) => (
                    <div
                      key={tab}
                      className={[
                        'px-4 py-2.5 text-t5 font-body border-b-2 transition-colors duration-150',
                        i === 0
                          ? 'border-accent-green text-text-primary'
                          : 'border-transparent text-text-disabled cursor-not-allowed',
                      ].join(' ')}
                      aria-current={i === 0 ? 'true' : undefined}
                    >
                      {tab}
                    </div>
                  )
                )}
              </div>

              {/* Tab content */}
              <div className="p-6 text-center">
                {engagement.status === ProjectStatus.BRIEF_GENERATED ? (
                  <>
                    <p className="text-t4 font-body text-text-secondary">
                      Workspace locked
                    </p>
                    <p className="text-t5 font-body text-text-disabled mt-1">
                      Click &quot;Begin project&quot; to start working on your brief.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-t4 font-body text-text-secondary">
                      Project is active
                    </p>
                    <p className="text-t5 font-body text-text-disabled mt-1">
                      Document submission and activity logs coming in the next release.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right — stepper + actions */}
          <div className="md:col-span-4 space-y-4">

            {/* Status stepper */}
            <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4">
              <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-3">
                Progress
              </p>
              <ProjectStatusStepper status={engagement.status} />
            </div>

            {/* Action zone */}
            <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
              <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                Actions
              </p>

              {engagement.status === ProjectStatus.BRIEF_GENERATED && (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    disabled={actionState === 'beginning'}
                    onClick={() => void handleBeginProject()}
                  >
                    {actionState === 'beginning' ? 'Starting...' : 'Begin project'}
                  </Button>
                  {actionError && (
                    <p className="text-t6 font-body text-red-400">{actionError}</p>
                  )}
                </>
              )}

              {engagement.status === ProjectStatus.IN_PROGRESS && (
                <p className="text-t5 font-body text-accent-green">Project is active</p>
              )}

              {(engagement.status === ProjectStatus.SUBMITTED ||
                engagement.status === ProjectStatus.UNDER_PEER_REVIEW ||
                engagement.status === ProjectStatus.UNDER_LECTURER_REVIEW) && (
                <p className="text-t5 font-body text-text-secondary">Awaiting review</p>
              )}

              {engagement.status === ProjectStatus.REVISION_REQUIRED && (
                <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-[4px]">
                  <p className="text-t5 font-body text-amber-400">
                    Revision required — check lecturer feedback.
                  </p>
                </div>
              )}

              {engagement.status === ProjectStatus.VERIFIED && (
                <p className="text-t5 font-body text-accent-green">Project verified</p>
              )}

              {engagement.status === ProjectStatus.DENIED && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-[4px]">
                  <p className="text-t5 font-body text-red-400">Project denied.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
