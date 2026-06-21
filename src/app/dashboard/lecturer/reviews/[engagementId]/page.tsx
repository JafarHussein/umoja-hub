'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Role, ProjectTrack, StudentTier } from '@/types';
import { Alert } from '@/components/app';
import { cn } from '@/lib/cn';
import { ReviewScoreForm } from '@/components/education/ReviewScoreForm';

// ── Types ──────────────────────────────────────────────────────────────────

interface IProcessDoc {
  content: string;
  submittedAt: string;
}

interface IBlockerEntry {
  stuckOn: string;
  resolution: string;
  durationHours: number;
  loggedAt?: string;
}

interface IAIUsageEntry {
  toolUsed: string;
  prompt: string;
  outputReceived: string;
  studentAction: string;
  loggedAt?: string;
}

interface IPeerReview {
  scores?: { codeQuality?: number; documentationClarity?: number };
  comments?: { codeQuality?: string; documentationClarity?: string };
  submittedAt?: string;
  status: string;
}

interface IStudentRef {
  firstName?: string;
  lastName?: string;
}

interface IEngagementDetail {
  _id: string;
  track: ProjectTrack;
  tier: StudentTier;
  brief: Record<string, unknown>;
  studentId: IStudentRef | string | null;
  documents: {
    problemBreakdown?: IProcessDoc;
    approachPlan?: IProcessDoc;
    finalReflection?: IProcessDoc;
    blockerLog: IBlockerEntry[];
    aiUsageLog: IAIUsageEntry[];
  };
  // Withheld by the API until the lecturer's decision is recorded — peer
  // scores arrive via the POST /api/lecturer/reviews response instead.
  peerReviewId?: IPeerReview | null;
  createdAt: string;
}

type PageState = 'loading' | 'ready' | 'not_found' | 'unverified' | 'error';
type DocTab = 'problemBreakdown' | 'approachPlan' | 'finalReflection';

const DOC_TABS: { id: DocTab; label: string }[] = [
  { id: 'problemBreakdown', label: 'Problem Breakdown' },
  { id: 'approachPlan', label: 'Approach Plan' },
  { id: 'finalReflection', label: 'Final Reflection' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function studentFullName(studentId: IStudentRef | string | null | undefined): string {
  if (!studentId) return 'Unknown student';
  if (typeof studentId === 'string') return studentId.slice(-6);
  const { firstName = '', lastName = '' } = studentId;
  return `${firstName} ${lastName}`.trim() || 'Unknown student';
}

function briefTitle(engagement: IEngagementDetail): string {
  if (engagement.track === ProjectTrack.AI_BRIEF) {
    return (engagement.brief as { title?: string }).title ?? 'AI Brief';
  }
  return (engagement.brief as { repoName?: string }).repoName ?? 'Open Source Project';
}

// Track labels with correct acronym casing (CSS capitalize would render
// "AI_BRIEF" as "Ai Brief").
const TRACK_LABEL: Record<ProjectTrack, string> = {
  [ProjectTrack.AI_BRIEF]: 'AI Brief',
  [ProjectTrack.OPEN_SOURCE]: 'Open Source',
};

function MetaPill({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2 py-0.5 capitalize text-app-muted">
      {children}
    </span>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function PageSkeleton(): React.ReactElement {
  return (
    <div className="max-w-6xl space-y-6">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-7 w-56 rounded" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="space-y-4 md:col-span-7">
          <div className="skeleton h-64 rounded-app-card" />
        </div>
        <div className="md:col-span-5">
          <div className="skeleton h-96 rounded-app-card" />
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function LecturerReviewDetailPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ engagementId: string }>();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [engagement, setEngagement] = useState<IEngagementDetail | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [revealedPeerReview, setRevealedPeerReview] = useState<IPeerReview | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<DocTab>('problemBreakdown');

  const fetchEngagement = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/lecturer/reviews/${params.engagementId}`);
      if (res.status === 403) {
        setPageState('unverified');
        return;
      }
      if (res.status === 404) {
        setPageState('not_found');
        return;
      }
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: IEngagementDetail };
      setEngagement(body.data);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, [params.engagementId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      if (session.user.role !== Role.LECTURER) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchEngagement();
    }
  }, [status, session, router, fetchEngagement]);

  function handleReviewSuccess(peerReview: IPeerReview | null): void {
    setSubmitted(true);
    setRevealedPeerReview(peerReview);
  }

  if (status === 'loading' || pageState === 'loading') {
    return <PageSkeleton />;
  }

  if (pageState === 'unverified') {
    return (
      <div className="max-w-6xl">
        <Alert tone="warning">
          <span className="app-body-strong">Account not yet verified.</span> An administrator must
          verify your account before you can submit reviews.
        </Alert>
      </div>
    );
  }

  if (pageState === 'not_found' || !engagement) {
    return (
      <div className="max-w-6xl">
        <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
          <p className="app-body text-app-muted">Engagement not found or already reviewed.</p>
          <Link
            href="/dashboard/lecturer/queue"
            className="app-body mt-4 inline-flex text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
          >
            ← Review queue
          </Link>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="max-w-6xl">
        <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
          <p className="app-body text-app-muted">Failed to load engagement.</p>
          <Link
            href="/dashboard/lecturer/queue"
            className="app-body mt-4 inline-flex text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
          >
            ← Review queue
          </Link>
        </div>
      </div>
    );
  }

  // Pre-decision the API withholds peer scores entirely; they only exist
  // here after submission, delivered by the decision response.
  const peerReview = revealedPeerReview ?? engagement.peerReviewId ?? null;
  const activeDoc = engagement.documents[activeDocTab];

  return (
    <div className="max-w-6xl space-y-6">
      <Link
        href="/dashboard/lecturer/queue"
        className="app-body inline-flex text-app-muted transition-colors duration-150 hover:text-app-ink"
      >
        ← Review queue
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="app-h1 text-app-ink">{briefTitle(engagement)}</h1>
          <p className="app-meta mt-1 text-app-muted">{studentFullName(engagement.studentId)}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <MetaPill>{engagement.tier.replace(/_/g, ' ').toLowerCase()}</MetaPill>
          <MetaPill>{TRACK_LABEL[engagement.track]}</MetaPill>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Left — student work */}
        <div className="space-y-4 md:col-span-7">
          {/* Process documents */}
          <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
            <div className="flex border-b border-app-hairline">
              {DOC_TABS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveDocTab(id)}
                  className={cn(
                    'app-nav border-b-2 px-4 py-2.5 transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-ring',
                    activeDocTab === id
                      ? 'border-app-brand text-app-ink'
                      : 'border-transparent text-app-muted hover:text-app-ink'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="p-4">
              {activeDoc ? (
                <div className="space-y-2">
                  <p className="app-meta text-app-faint">
                    Submitted{' '}
                    {new Date(activeDoc.submittedAt).toLocaleDateString('en-KE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="app-body whitespace-pre-wrap leading-relaxed text-app-ink">
                    {activeDoc.content}
                  </p>
                </div>
              ) : (
                <p className="app-body py-4 text-center text-app-faint">Document not submitted.</p>
              )}
            </div>
          </div>

          {/* Blocker log */}
          {engagement.documents.blockerLog.length > 0 && (
            <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
              <div className="border-b border-app-hairline px-4 py-3">
                <p className="app-label text-app-muted">
                  Blocker log · {engagement.documents.blockerLog.length}
                </p>
              </div>
              {engagement.documents.blockerLog.map((entry, i) => (
                <div
                  key={i}
                  className="space-y-1.5 border-b border-app-hairline px-4 py-3 last:border-0"
                >
                  <p className="app-body text-app-ink">{entry.stuckOn}</p>
                  <p className="app-body text-app-muted">{entry.resolution}</p>
                  <p className="app-meta font-app-mono text-app-faint">{entry.durationHours}h</p>
                </div>
              ))}
            </div>
          )}

          {/* AI usage log */}
          {engagement.documents.aiUsageLog.length > 0 && (
            <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
              <div className="border-b border-app-hairline px-4 py-3">
                <p className="app-label text-app-muted">
                  AI usage log · {engagement.documents.aiUsageLog.length}
                </p>
              </div>
              {engagement.documents.aiUsageLog.map((entry, i) => (
                <div
                  key={i}
                  className="space-y-1.5 border-b border-app-hairline px-4 py-3 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="app-label rounded-app-pill border border-app-hairline bg-app-sunken px-2 py-0.5 text-app-muted">
                      {entry.toolUsed}
                    </span>
                  </div>
                  <p className="app-body line-clamp-2 text-app-muted">{entry.prompt}</p>
                  <p className="app-body text-app-ink">{entry.studentAction}</p>
                </div>
              ))}
            </div>
          )}

          {/* Peer review scores */}
          {peerReview && (
            <div className="space-y-3 rounded-app-card border border-app-hairline bg-app-card p-4">
              <p className="app-label text-app-muted">Peer review scores</p>
              {revealedPeerReview && (
                <p className="app-meta text-app-faint">
                  Revealed after your decision was recorded. Peer scores are withheld during
                  assessment to keep reviews independent.
                </p>
              )}
              <div className="space-y-0">
                <div className="flex items-center justify-between border-b border-app-hairline py-2.5">
                  <span className="app-body text-app-muted">Code quality</span>
                  <span className="app-data-m text-app-ink">
                    {peerReview.scores?.codeQuality ?? '—'}/5
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-app-hairline py-2.5">
                  <span className="app-body text-app-muted">Documentation</span>
                  <span className="app-data-m text-app-ink">
                    {peerReview.scores?.documentationClarity ?? '—'}/5
                  </span>
                </div>
                {peerReview.comments?.codeQuality && (
                  <div className="space-y-0.5 border-b border-app-hairline py-2.5">
                    <p className="app-meta text-app-faint">Code quality comment</p>
                    <p className="app-body text-app-muted">{peerReview.comments.codeQuality}</p>
                  </div>
                )}
                {peerReview.comments?.documentationClarity && (
                  <div className="space-y-0.5 py-2.5">
                    <p className="app-meta text-app-faint">Documentation comment</p>
                    <p className="app-body text-app-muted">
                      {peerReview.comments.documentationClarity}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — review form or success */}
        <div className="md:col-span-5">
          <div className="rounded-app-card border border-app-hairline bg-app-card p-4">
            {submitted ? (
              <div className="space-y-4 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-app-pill bg-app-brand" />
                  <p className="app-h2 text-app-brand">Review submitted</p>
                </div>
                <p className="app-body text-app-muted">
                  The student has been notified and the engagement status has been updated.
                </p>
                <Link
                  href="/dashboard/lecturer/queue"
                  className="app-body inline-flex items-center gap-1 text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
                >
                  ← Back to queue
                </Link>
              </div>
            ) : (
              <ReviewScoreForm engagementId={engagement._id} onSuccess={handleReviewSuccess} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
