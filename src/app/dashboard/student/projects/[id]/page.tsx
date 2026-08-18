'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Role, ProjectStatus, ProjectTrack, StudentTier } from '@/types';
import { Button, Alert } from '@/components/app';
import { cn } from '@/lib/cn';
import { ProjectStatusStepper } from '@/components/education/ProjectStatusStepper';
import { DocumentsTab } from '@/components/education/DocumentsTab';
import { BlockersTab } from '@/components/education/BlockersTab';
import { AIUsageTab } from '@/components/education/AIUsageTab';
import type { DocumentType, IProcessDocument } from '@/components/education/DocumentsTab';
import type { IBlockerEntry } from '@/components/education/BlockersTab';
import type { IAIUsageEntry } from '@/components/education/AIUsageTab';
import { loginUrlWithIntent } from '@/lib/auth/intent';
import { normalizeBrief, type NormalizedBrief } from '@/lib/education/brief';
import { LecturerFeedbackCard } from '@/components/education/LecturerFeedbackCard';
import type { ILecturerReview } from '@/components/education/LecturerFeedbackCard';

// ── Engagement type ───────────────────────────────────────────────────────────

interface IEngagementDocuments {
  problemBreakdown?: IProcessDocument;
  approachPlan?: IProcessDocument;
  finalReflection?: IProcessDocument;
  blockerLog: IBlockerEntry[];
  aiUsageLog: IAIUsageEntry[];
}

interface IActiveEngagement {
  _id: string;
  track: ProjectTrack;
  tier: StudentTier;
  status: ProjectStatus;
  brief: Record<string, unknown>;
  documents: IEngagementDocuments;
  revisionNumber: number;
  createdAt: string;
}


// Raw shape from API — documents arrays may be missing before normalization
interface IRawEngagement {
  _id: string;
  track: ProjectTrack;
  tier: StudentTier;
  status: ProjectStatus;
  brief: Record<string, unknown>;
  documents?: {
    problemBreakdown?: IProcessDocument;
    approachPlan?: IProcessDocument;
    finalReflection?: IProcessDocument;
    blockerLog?: IBlockerEntry[];
    aiUsageLog?: IAIUsageEntry[];
  };
  revisionNumber?: number;
  createdAt: string;
}

type PageState = 'loading' | 'ready' | 'not_found' | 'error';
type ActionState = 'idle' | 'beginning';
type SubmitState = 'idle' | 'submitting';
type WorkspaceTab = 'overview' | 'documents' | 'blockers' | 'ai-usage';

const COMPLEXITY_PILL: Record<'LOW' | 'MEDIUM' | 'HIGH', string> = {
  LOW: 'bg-app-success-surface text-app-success',
  MEDIUM: 'bg-app-warning-surface text-app-warning',
  HIGH: 'bg-app-danger-surface text-app-danger',
};

const TAB_CONFIG: { id: WorkspaceTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'documents', label: 'Documents' },
  { id: 'blockers', label: 'Blockers' },
  { id: 'ai-usage', label: 'AI Usage' },
];

// The three process documents whose presence gates finalization (each carries
// its own per-document hash — there is no single compiled hash).
const DOC_ITEMS: { type: DocumentType; label: string }[] = [
  { type: 'problemBreakdown', label: 'Problem Breakdown' },
  { type: 'approachPlan', label: 'Approach Plan' },
  { type: 'finalReflection', label: 'Final Reflection' },
];

// ── Loading skeleton ──────────────────────────────────────────────────────────

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

// ── Bullet list ───────────────────────────────────────────────────────────────

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

// ── Brief card ────────────────────────────────────────────────────────────────

// One card for every track and every vintage of stored brief. It renders a
// normalized view rather than the raw Mixed column: two shapes of brief already
// exist in the database, and reading the raw object is exactly what made this
// page crash for every seeded student.
function BriefCard({ brief }: { brief: NormalizedBrief }): React.ReactElement {
  return (
    <div className="space-y-4 rounded-app-card border border-app-hairline bg-app-card p-6">
      <div>
        <p className="app-label mb-1 text-app-muted">
          {brief.kind === 'open-source' ? 'Open-source brief' : 'Brief'}
        </p>
        <h2 className="app-h2 text-app-ink">{brief.title}</h2>
      </div>

      {brief.degraded && (
        <Alert tone="warning">
          Part of this brief was written before the current format and could not be read. Everything
          the record does hold is shown below.
        </Alert>
      )}

      {(brief.facts.length > 0 || brief.complexity !== null) && (
        <div className="space-y-0">
          {brief.facts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-start justify-between border-b border-app-hairline py-2.5"
            >
              <span className="app-body mr-4 flex-shrink-0 text-app-muted">{fact.label}</span>
              <span className="app-body text-right text-app-ink">{fact.value}</span>
            </div>
          ))}
          {brief.complexity !== null && (
            <div className="flex items-start justify-between border-b border-app-hairline py-2.5">
              <span className="app-body mr-4 flex-shrink-0 text-app-muted">Complexity</span>
              <span
                className={cn(
                  'app-label inline-flex items-center rounded-app-pill px-2 py-0.5 capitalize',
                  COMPLEXITY_PILL[brief.complexity]
                )}
              >
                {brief.complexity.toLowerCase()}
              </span>
            </div>
          )}
        </div>
      )}

      {brief.summary && (
        <div>
          <p className="app-label mb-1.5 text-app-muted">
            {brief.kind === 'open-source' ? 'Contribution goal' : 'Problem statement'}
          </p>
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

// ── Overview tab content ──────────────────────────────────────────────────────

function OverviewContent({ status }: { status: ProjectStatus }): React.ReactElement {
  if (status === ProjectStatus.BRIEF_GENERATED) {
    return (
      <div className="p-6 text-center">
        <p className="app-body text-app-muted">Workspace locked</p>
        <p className="app-meta mt-1 text-app-faint">
          Click &quot;Begin project&quot; to start working on your brief.
        </p>
      </div>
    );
  }
  return (
    <div className="p-6 text-center">
      <p className="app-body text-app-muted">Project is active</p>
      <p className="app-meta mt-1 text-app-faint">
        Use the Documents, Blockers, and AI Usage tabs to track your work.
      </p>
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
  const [reviews, setReviews] = useState<ILecturerReview[]>([]);
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [finalized, setFinalized] = useState(false);

  const fetchEngagement = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/education/engagements/me');
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: IRawEngagement | null };
      if (!body.data || String(body.data._id) !== params.id) {
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
          ...(raw.documents?.problemBreakdown && {
            problemBreakdown: raw.documents.problemBreakdown,
          }),
          ...(raw.documents?.approachPlan && {
            approachPlan: raw.documents.approachPlan,
          }),
          ...(raw.documents?.finalReflection && {
            finalReflection: raw.documents.finalReflection,
          }),
        },
      });
      setPageState('ready');

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
  }, [params.id]);

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

  // ── Callbacks ───────────────────────────────────────────────────────────────

  function handleDocumentSaved(type: DocumentType, saved: IProcessDocument): void {
    setEngagement((prev) =>
      prev ? { ...prev, documents: { ...prev.documents, [type]: saved } } : null
    );
  }

  function handleBlockerAdded(entry: IBlockerEntry): void {
    setEngagement((prev) =>
      prev
        ? {
            ...prev,
            documents: {
              ...prev.documents,
              blockerLog: [entry, ...prev.documents.blockerLog],
            },
          }
        : null
    );
  }

  function handleAIUsageAdded(entry: IAIUsageEntry): void {
    setEngagement((prev) =>
      prev
        ? {
            ...prev,
            documents: {
              ...prev.documents,
              aiUsageLog: [entry, ...prev.documents.aiUsageLog],
            },
          }
        : null
    );
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

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
        setActionError(body.error ?? 'Could not start the project. Please try again.');
        setActionState('idle');
        return;
      }

      const body = (await res.json()) as { data?: { revisionNumber?: number } };
      setEngagement({
        ...engagement,
        status: ProjectStatus.IN_PROGRESS,
        revisionNumber: body.data?.revisionNumber ?? engagement.revisionNumber,
      });
      setActionState('idle');
    } catch {
      setActionError('Network error. Try again.');
      setActionState('idle');
    }
  }

  async function handleSubmitProject(): Promise<void> {
    if (!engagement) return;
    setSubmitState('submitting');
    setSubmitError(null);

    try {
      const res = await fetch(`/api/education/engagements/${engagement._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setSubmitError(body.error ?? 'Could not submit. Please try again.');
        setSubmitState('idle');
        return;
      }

      setEngagement({ ...engagement, status: ProjectStatus.UNDER_PEER_REVIEW });
      setSubmitState('idle');
    } catch {
      setSubmitError('Network error. Try again.');
      setSubmitState('idle');
    }
  }

  // ── Render guards ────────────────────────────────────────────────────────────

  if (status === 'loading' || pageState === 'loading') {
    return <PageSkeleton />;
  }

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
  const briefTitle = brief.title;

  const tabsUnlocked = engagement.status !== ProjectStatus.BRIEF_GENERATED;

  const completedCount = DOC_ITEMS.filter((d) => engagement.documents[d.type]).length;
  const allDocsPresent = completedCount === DOC_ITEMS.length;

  return (
    <div className="mx-auto w-full max-w-app-page space-y-10">
      {/* Back link */}
      <Link
        href="/dashboard/student"
        className="app-body inline-flex text-app-muted transition-colors duration-150 hover:text-app-ink"
      >
        ← My projects
      </Link>

      {/* Page header */}
      <div>
        <p className="app-data-m text-app-faint">{engagement._id}</p>
        <h1 className="app-h1 text-app-ink">{briefTitle}</h1>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Left — brief + workspace tabs */}
        <div className="space-y-6 md:col-span-8">
          {/* Brief card */}
          <BriefCard brief={brief} />

          {/* Lecturer feedback — renders nothing until there is a decision */}
          <LecturerFeedbackCard reviews={reviews} />

          {/* Workspace tabs */}
          <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
            {/* Tab bar */}
            <div className="flex border-b border-app-hairline">
              {TAB_CONFIG.map(({ id, label }) => {
                const isActive = activeTab === id;
                const isLocked = id !== 'overview' && !tabsUnlocked;

                return (
                  <button
                    key={id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => !isLocked && setActiveTab(id)}
                    className={cn(
                      'app-nav border-b-2 px-4 py-2.5 transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-ring',
                      isActive
                        ? 'border-app-brand text-app-ink'
                        : isLocked
                          ? 'cursor-not-allowed border-transparent text-app-faint'
                          : 'cursor-pointer border-transparent text-app-muted hover:text-app-ink'
                    )}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && <OverviewContent status={engagement.status} />}
            {activeTab === 'documents' && tabsUnlocked && (
              <DocumentsTab
                engagementId={engagement._id}
                documents={engagement.documents}
                onDocumentSaved={handleDocumentSaved}
              />
            )}
            {activeTab === 'blockers' && tabsUnlocked && (
              <BlockersTab
                engagementId={engagement._id}
                initialBlockers={engagement.documents.blockerLog}
                onBlockerAdded={handleBlockerAdded}
              />
            )}
            {activeTab === 'ai-usage' && tabsUnlocked && (
              <AIUsageTab
                engagementId={engagement._id}
                initialEntries={engagement.documents.aiUsageLog}
                onEntryAdded={handleAIUsageAdded}
              />
            )}
          </div>
        </div>

        {/* Right — stepper + actions */}
        <div className="space-y-4 md:col-span-4">
          {/* Status stepper */}
          <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
            <p className="app-label mb-3 text-app-muted">Progress</p>
            <ProjectStatusStepper status={engagement.status} />
          </div>

          {/* Action zone */}
          <div className="space-y-3 rounded-app-card border border-app-hairline bg-app-card p-6">
            <p className="app-label text-app-muted">Actions</p>

            {/* BRIEF_GENERATED */}
            {engagement.status === ProjectStatus.BRIEF_GENERATED && (
              <>
                <Button
                  className="w-full"
                  isLoading={actionState === 'beginning'}
                  onClick={() => void handleBeginProject()}
                >
                  Begin project
                </Button>
                {actionError && <Alert tone="danger">{actionError}</Alert>}
              </>
            )}

            {/* IN_PROGRESS — 3/3 checklist, then Finalize & Hash → Submit */}
            {engagement.status === ProjectStatus.IN_PROGRESS && (
              <div className="space-y-4">
                {/* Submission checklist */}
                <div className="space-y-2">
                  <p className="app-label text-app-muted">Submission checklist</p>
                  <ul className="space-y-1.5">
                    {DOC_ITEMS.map((item) => {
                      const done = Boolean(engagement.documents[item.type]);
                      return (
                        <li key={item.type} className="flex items-center gap-2">
                          <span
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-app-pill border text-[10px]',
                              done
                                ? 'border-app-brand bg-app-brand-surface text-app-brand'
                                : 'border-app-border-strong text-app-faint'
                            )}
                            aria-hidden="true"
                          >
                            {done ? '✓' : ''}
                          </span>
                          <span className={cn('app-body', done ? 'text-app-ink' : 'text-app-muted')}>
                            {item.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="app-meta text-app-muted">
                    {completedCount} of {DOC_ITEMS.length} documents
                  </p>
                </div>

                {!finalized ? (
                  <>
                    <Button
                      className="w-full"
                      disabled={!allDocsPresent}
                      onClick={() => setFinalized(true)}
                    >
                      Finalize &amp; Hash for Review
                    </Button>
                    {!allDocsPresent && (
                      <p className="app-meta text-app-faint">
                        Complete all 3 documents to finalize.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    {/* Three per-document hash strings (no compiled hash) */}
                    <p className="app-label text-app-muted">Document hashes</p>
                    <div className="space-y-2.5">
                      {DOC_ITEMS.map((item) => (
                        <div key={item.type}>
                          <p className="app-meta text-app-muted">{item.label}</p>
                          <p className="app-data-m break-all text-app-faint">
                            {engagement.documents[item.type]?.hash ?? '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full"
                      isLoading={submitState === 'submitting'}
                      onClick={() => void handleSubmitProject()}
                    >
                      Submit for Review
                    </Button>
                    <button
                      type="button"
                      onClick={() => setFinalized(false)}
                      className="app-meta text-app-muted transition-colors duration-150 hover:text-app-ink"
                    >
                      ← Back to editing
                    </button>
                    {submitError && <Alert tone="danger">{submitError}</Alert>}
                  </div>
                )}
              </div>
            )}

            {/* Review statuses */}
            {(engagement.status === ProjectStatus.SUBMITTED ||
              engagement.status === ProjectStatus.UNDER_PEER_REVIEW ||
              engagement.status === ProjectStatus.UNDER_LECTURER_REVIEW) && (
              <p className="app-body text-app-muted">Awaiting review</p>
            )}

            {/* REVISION_REQUIRED — the loop continues rather than ending here */}
            {engagement.status === ProjectStatus.REVISION_REQUIRED && (
              <>
                <Alert tone="warning">
                  Your lecturer asked for revisions. Their feedback is on this page — take it back
                  into the workspace, then submit again.
                </Alert>
                <Button
                  className="w-full"
                  isLoading={actionState === 'beginning'}
                  onClick={() => void handleBeginProject()}
                >
                  Resume work
                </Button>
                {actionError && <Alert tone="danger">{actionError}</Alert>}
              </>
            )}

            {/* VERIFIED */}
            {engagement.status === ProjectStatus.VERIFIED && (
              <Alert tone="success">Project verified.</Alert>
            )}

            {/* DENIED */}
            {engagement.status === ProjectStatus.DENIED && <Alert tone="danger">Project denied.</Alert>}
          </div>
        </div>
      </div>
    </div>
  );
}
