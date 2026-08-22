'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Role, ProjectStatus, ProjectTrack, DemonstrationStatus } from '@/types';
import { Button, Alert } from '@/components/app';
import { cn } from '@/lib/cn';
import { ProjectStatusStepper } from '@/components/education/ProjectStatusStepper';
import {
  ReportWorkspace,
  type IDocumentation,
} from '@/components/education/ReportWorkspace';
import { DemonstrationPanel, type IDemonstration } from '@/components/education/DemonstrationPanel';
import { BlockersTab } from '@/components/education/BlockersTab';
import { AIUsageTab } from '@/components/education/AIUsageTab';
import type { IBlockerEntry } from '@/components/education/BlockersTab';
import type { IAIUsageEntry } from '@/components/education/AIUsageTab';
import { loginUrlWithIntent } from '@/lib/auth/intent';
import { normalizeBrief, type NormalizedBrief } from '@/lib/education/brief';
import { projectProgress, type ProgressInput } from '@/lib/education/projectProgress';
import { LecturerFeedbackCard } from '@/components/education/LecturerFeedbackCard';
import type { ILecturerReview } from '@/components/education/LecturerFeedbackCard';

// ---------------------------------------------------------------------------
// One project, end to end.
//
// The workspace is organised around the workflow rather than around the
// platform's storage: build it, write it up, have it read, show it running.
// The old page was organised around three documents and a hash, which told a
// student what the database wanted rather than what they had to do next.
//
// The card at the top is the one thing a student should have to read. It says
// where they are, what happens next, and gives them the single action that
// moves it — assembled by `projectProgress` from the project, the report and
// the demonstration together, so no two screens can disagree about it.
// ---------------------------------------------------------------------------

interface IEngagementDocuments {
  blockerLog: IBlockerEntry[];
  aiUsageLog: IAIUsageEntry[];
}

interface IActiveEngagement {
  _id: string;
  track: ProjectTrack;
  status: ProjectStatus;
  brief: Record<string, unknown>;
  documents: IEngagementDocuments;
  revisionNumber: number;
  createdAt: string;
}

interface IRawEngagement {
  _id: string;
  track: ProjectTrack;
  status: ProjectStatus;
  brief: Record<string, unknown>;
  documents?: {
    blockerLog?: IBlockerEntry[];
    aiUsageLog?: IAIUsageEntry[];
  };
  revisionNumber?: number;
  createdAt: string;
}

type PageState = 'loading' | 'ready' | 'not_found' | 'error';
type ActionState = 'idle' | 'working';
type WorkspaceTab = 'brief' | 'report' | 'demonstration' | 'blockers' | 'ai-usage';

const TONE_CLASS: Record<string, string> = {
  neutral: 'border-app-hairline bg-app-card',
  action: 'border-app-brand bg-app-brand-surface',
  waiting: 'border-app-hairline bg-app-sunken',
  warning: 'border-app-warning bg-app-warning-surface',
  done: 'border-app-success bg-app-success-surface',
};

function PageSkeleton(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-app-page space-y-10">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-7 w-56 rounded" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="space-y-4 md:col-span-8">
          <div className="skeleton h-64 rounded-app-card" />
        </div>
        <div className="space-y-4 md:col-span-4">
          <div className="skeleton h-48 rounded-app-card" />
        </div>
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }): React.ReactElement {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 text-app-faint" aria-hidden="true">
            –
          </span>
          <span className="app-body text-app-muted">{item}</span>
        </li>
      ))}
    </ul>
  );
}

// One card for every track and every vintage of stored brief. It renders a
// normalized view rather than the raw Mixed column: two shapes of brief already
// exist in the database, and reading the raw object is exactly what made this
// page crash for every seeded student.
function BriefCard({ brief }: { brief: NormalizedBrief }): React.ReactElement {
  return (
    <div className="space-y-4 rounded-app-card border border-app-hairline bg-app-card p-6">
      {brief.summary && (
        <div>
          <p className="app-label mb-1.5 text-app-muted">The problem</p>
          <p className="app-body leading-relaxed text-app-muted">{brief.summary}</p>
        </div>
      )}

      {brief.sections.map((s) => (
        <div key={s.heading}>
          <p className="app-label mb-1.5 text-app-muted">{s.heading}</p>
          {s.items.length === 1 ? (
            <p className="app-body leading-relaxed text-app-muted">{s.items[0]}</p>
          ) : (
            <BulletList items={s.items} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ProjectWorkspacePage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [engagement, setEngagement] = useState<IActiveEngagement | null>(null);
  const [documentation, setDocumentation] = useState<IDocumentation | null>(null);
  const [demonstrations, setDemonstrations] = useState<IDemonstration[]>([]);
  const [reviews, setReviews] = useState<ILecturerReview[]>([]);
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('brief');

  const loadReport = useCallback(async (engagementId: string): Promise<void> => {
    try {
      const res = await fetch(`/api/education/engagements/${engagementId}/report`);
      if (res.ok) {
        const body = (await res.json()) as { data: IDocumentation };
        setDocumentation(body.data);
      }
    } catch {
      // The rest of the workspace is usable without it.
    }
  }, []);

  const loadDemonstrations = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/education/demonstrations');
      if (res.ok) {
        const body = (await res.json()) as { data: IDemonstration[] };
        setDemonstrations(body.data ?? []);
      }
    } catch {
      // Same.
    }
  }, []);

  const fetchEngagement = useCallback(async (): Promise<void> => {
    try {
      // By id, not "my current project".
      //
      // This screen used to resolve through /engagements/me, which returns only
      // *active* work — so the moment a lecturer approved a project it stopped
      // matching, and the student's finished work reported itself as not found.
      // The outcome they had been waiting for was the one thing they could not
      // open. Ownership is enforced by the route.
      const res = await fetch(`/api/education/engagements/${params.id}`);
      if (res.status === 404) {
        setPageState('not_found');
        return;
      }
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: IRawEngagement | null };
      if (!body.data) {
        setPageState('not_found');
        return;
      }
      const raw = body.data;
      setEngagement({
        ...raw,
        revisionNumber: raw.revisionNumber ?? 0,
        documents: {
          blockerLog: raw.documents?.blockerLog ?? [],
          aiUsageLog: raw.documents?.aiUsageLog ?? [],
        },
      });
      setPageState('ready');

      await Promise.all([loadReport(raw._id), loadDemonstrations()]);

      // Feedback is fetched whatever the status: a student revising is back in
      // IN_PROGRESS and still needs to read what they were asked to fix.
      try {
        const reviewRes = await fetch(`/api/education/engagements/${raw._id}/reviews`);
        if (reviewRes.ok) {
          const reviewBody = (await reviewRes.json()) as { data: ILecturerReview[] };
          setReviews(reviewBody.data ?? []);
        }
      } catch {
        // The workspace is usable without the feedback panel; leave it empty.
      }
    } catch {
      setPageState('error');
    }
  }, [params.id, loadReport, loadDemonstrations]);

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
      void fetchEngagement();
    }
  }, [status, session, router, fetchEngagement]);

  function handleBlockerAdded(entry: IBlockerEntry): void {
    setEngagement((prev) =>
      prev
        ? {
            ...prev,
            documents: { ...prev.documents, blockerLog: [entry, ...prev.documents.blockerLog] },
          }
        : null
    );
  }

  function handleAIUsageAdded(entry: IAIUsageEntry): void {
    setEngagement((prev) =>
      prev
        ? {
            ...prev,
            documents: { ...prev.documents, aiUsageLog: [entry, ...prev.documents.aiUsageLog] },
          }
        : null
    );
  }

  async function handleResume(): Promise<void> {
    if (!engagement) return;
    setActionState('working');
    setActionError(null);
    try {
      const res = await fetch(`/api/education/engagements/${engagement._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setActionError(body.error ?? 'Could not start the project. Please try again.');
        setActionState('idle');
        return;
      }
      await fetchEngagement();
      setActionState('idle');
    } catch {
      setActionError('Network error. Try again.');
      setActionState('idle');
    }
  }


  if (status === 'loading' || pageState === 'loading') return <PageSkeleton />;

  if (pageState === 'error') {
    return (
      <div className="mx-auto w-full max-w-app-page">
        <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
          <p className="app-body text-app-muted">Could not load this project.</p>
          <Link
            href="/dashboard/student"
            className="app-body mt-4 inline-flex text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
          >
            ← My projects
          </Link>
        </div>
      </div>
    );
  }

  if (pageState === 'not_found' || !engagement) {
    return (
      <div className="mx-auto w-full max-w-app-page">
        <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
          <p className="app-body text-app-muted">Project not found.</p>
          <Link
            href="/dashboard/student"
            className="app-body mt-4 inline-flex text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
          >
            ← My projects
          </Link>
        </div>
      </div>
    );
  }

  const brief = normalizeBrief(engagement.track, engagement.brief);
  const currentDemonstration =
    demonstrations.find((d) => d.engagementId === engagement._id) ?? null;

  const progress = projectProgress({
    projectStatus: engagement.status,
    ...(documentation
      ? { documentationStage: documentation.stage as NonNullable<ProgressInput['documentationStage']> }
      : {}),
    demonstration: currentDemonstration
      ? { status: currentDemonstration.status, scheduledFor: currentDemonstration.scheduledFor }
      : null,
  });

  const started = engagement.status !== ProjectStatus.BRIEF_GENERATED;

  const TABS: { id: WorkspaceTab; label: string; show: boolean }[] = [
    { id: 'brief', label: 'The brief', show: true },
    { id: 'report', label: 'Project report', show: started },
    {
      id: 'demonstration',
      label: 'Demonstration',
      show:
        engagement.status === ProjectStatus.READY_FOR_DEMONSTRATION ||
        engagement.status === ProjectStatus.DEMONSTRATION_SCHEDULED ||
        Boolean(currentDemonstration),
    },
    { id: 'blockers', label: 'Blockers', show: started },
    { id: 'ai-usage', label: 'AI usage', show: started },
  ];
  const visibleTabs = TABS.filter((t) => t.show);

  function runAction(): void {
    if (!progress.action) return;
    switch (progress.action.kind) {
      case 'START':
      case 'RESUME':
        void handleResume();
        break;
      case 'SUBMIT':
      case 'REPORT':
        setActiveTab('report');
        break;
      case 'BOOK':
        setActiveTab('demonstration');
        break;
    }
  }

  return (
    <div className="mx-auto w-full max-w-app-page space-y-8">
      <div>
        <Link
          href="/dashboard/student"
          className="app-meta text-app-muted transition-colors duration-150 hover:text-app-ink"
        >
          ← My projects
        </Link>
        <h1 className="app-h1 mt-2 text-app-ink">{brief.title}</h1>
      </div>

      {/* ---- Where you are, and what happens next ---- */}
      <div className={cn('rounded-app-card border p-6', TONE_CLASS[progress.tone])}>
        <p className="app-label text-app-muted">{progress.stage}</p>
        <p className="app-body-strong mt-1.5 text-app-ink">{progress.nextStep}</p>
        {progress.action && (
          <Button
            className="mt-4"
            isLoading={actionState === 'working'}
            onClick={runAction}
          >
            {progress.action.label}
          </Button>
        )}
        {actionError && (
          <Alert tone="danger" className="mt-3">
            {actionError}
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="space-y-4 md:col-span-8">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Project workspace">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'rounded-app-control px-3 py-1.5 transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring',
                  activeTab === tab.id
                    ? 'bg-app-brand-surface app-body-strong text-app-ink'
                    : 'app-body text-app-muted hover:bg-app-sunken'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'brief' && <BriefCard brief={brief} />}

          {activeTab === 'report' &&
            (documentation ? (
              <ReportWorkspace
                engagementId={engagement._id}
                documentation={documentation}
                onChange={setDocumentation}
              />
            ) : (
              <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
                <p className="app-body text-app-muted">Loading your report…</p>
              </div>
            ))}

          {activeTab === 'demonstration' && (
            <DemonstrationPanel
              engagementId={engagement._id}
              projectStatus={engagement.status}
              demonstration={currentDemonstration}
              onChange={() => void fetchEngagement()}
            />
          )}

          {activeTab === 'blockers' && (
            <BlockersTab
              engagementId={engagement._id}
              initialBlockers={engagement.documents.blockerLog}
              onBlockerAdded={handleBlockerAdded}
            />
          )}

          {activeTab === 'ai-usage' && (
            <AIUsageTab
              engagementId={engagement._id}
              initialEntries={engagement.documents.aiUsageLog}
              onEntryAdded={handleAIUsageAdded}
            />
          )}

          {reviews.length > 0 && <LecturerFeedbackCard reviews={reviews} />}
        </div>

        <div className="space-y-4 md:col-span-4">
          <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
            <p className="app-label mb-3 text-app-muted">Progress</p>
            <ProjectStatusStepper status={engagement.status} />
          </div>

          {currentDemonstration &&
            currentDemonstration.status === DemonstrationStatus.EVALUATED &&
            currentDemonstration.evaluation && (
              <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
                <p className="app-label mb-2 text-app-muted">Your demonstration</p>
                <p className="app-body text-app-body">
                  {currentDemonstration.evaluation.outcome === 'APPROVED'
                    ? 'Approved by your lecturer.'
                    : 'Your lecturer asked for more work.'}
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
