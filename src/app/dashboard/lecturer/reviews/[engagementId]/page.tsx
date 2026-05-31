'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Role, ProjectTrack, StudentTier } from '@/types';
import { Badge } from '@/components/ui/Badge';
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
  studentId: IStudentRef | string;
  documents: {
    problemBreakdown?: IProcessDoc;
    approachPlan?: IProcessDoc;
    finalReflection?: IProcessDoc;
    blockerLog: IBlockerEntry[];
    aiUsageLog: IAIUsageEntry[];
  };
  peerReviewId: IPeerReview | null;
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

function studentFullName(studentId: IStudentRef | string): string {
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

// ── Skeleton ───────────────────────────────────────────────────────────────

function PageSkeleton(): React.ReactElement {
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="h-4 w-24 bg-surface-secondary rounded-sm animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-3 w-32 bg-surface-secondary rounded-sm animate-pulse" />
          <div className="h-7 w-56 bg-surface-secondary rounded-sm animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
                <div className="h-4 w-32 bg-surface-secondary rounded-sm animate-pulse" />
                <div className="h-4 w-full bg-surface-secondary rounded-sm animate-pulse" />
                <div className="h-4 w-3/4 bg-surface-secondary rounded-sm animate-pulse" />
              </div>
            ))}
          </div>
          <div className="md:col-span-5">
            <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-surface-secondary rounded-sm animate-pulse" />
              ))}
            </div>
          </div>
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

  function handleReviewSuccess(): void {
    setSubmitted(true);
  }

  if (status === 'loading' || pageState === 'loading') {
    return <PageSkeleton />;
  }

  if (pageState === 'unverified') {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface-elevated border border-amber-900/30 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-amber-400">Account not yet verified</p>
            <p className="text-t5 font-body text-text-disabled mt-1">
              An administrator must verify your account before you can submit reviews.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'not_found' || !engagement) {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-text-secondary">Engagement not found or already reviewed.</p>
            <Link
              href="/dashboard/lecturer/queue"
              className="inline-flex mt-4 text-t5 font-body text-accent-green hover:text-accent-green/80 transition-colors duration-150"
            >
              ← Review queue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-text-secondary">Failed to load engagement.</p>
            <Link
              href="/dashboard/lecturer/queue"
              className="inline-flex mt-4 text-t5 font-body text-accent-green hover:text-accent-green/80 transition-colors duration-150"
            >
              ← Review queue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const peerReview = engagement.peerReviewId;
  const activeDoc = engagement.documents[activeDocTab];

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <Link
          href="/dashboard/lecturer/queue"
          className="inline-flex text-t5 font-body text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          ← Review queue
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
              Lecturer · Review
            </p>
            <h1 className="text-t2 font-heading font-semibold text-text-primary tracking-tight">
              {briefTitle(engagement)}
            </h1>
            <p className="text-t5 font-body text-text-secondary mt-1">
              {studentFullName(engagement.studentId)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="neutral" label={engagement.tier} />
            <Badge variant="neutral" label={engagement.track} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left — student work */}
          <div className="md:col-span-7 space-y-4">

            {/* Process documents */}
            <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] overflow-hidden">
              <div className="flex border-b border-zinc-800/50">
                {DOC_TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveDocTab(id)}
                    className={[
                      'px-4 py-2.5 text-t5 font-body border-b-2 transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-green focus-visible:ring-inset',
                      activeDocTab === id
                        ? 'border-accent-green text-text-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="p-4">
                {activeDoc ? (
                  <div className="space-y-2">
                    <p className="text-t6 font-mono text-text-disabled">
                      Submitted{' '}
                      {new Date(activeDoc.submittedAt).toLocaleDateString('en-KE', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </p>
                    <p className="text-t5 font-body text-text-primary leading-relaxed whitespace-pre-wrap">
                      {activeDoc.content}
                    </p>
                  </div>
                ) : (
                  <p className="text-t5 font-body text-text-disabled py-4 text-center">
                    Document not submitted.
                  </p>
                )}
              </div>
            </div>

            {/* Blocker log */}
            {engagement.documents.blockerLog.length > 0 && (
              <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800/50">
                  <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                    Blocker log · {engagement.documents.blockerLog.length}
                  </p>
                </div>
                {engagement.documents.blockerLog.map((entry, i) => (
                  <div key={i} className="px-4 py-3 border-b border-zinc-800/50 last:border-0 space-y-1.5">
                    <p className="text-t5 font-body text-text-primary">{entry.stuckOn}</p>
                    <p className="text-t5 font-body text-text-secondary">{entry.resolution}</p>
                    <p className="text-t6 font-mono text-text-disabled tabular-nums">
                      {entry.durationHours}h
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* AI usage log */}
            {engagement.documents.aiUsageLog.length > 0 && (
              <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800/50">
                  <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                    AI usage log · {engagement.documents.aiUsageLog.length}
                  </p>
                </div>
                {engagement.documents.aiUsageLog.map((entry, i) => (
                  <div key={i} className="px-4 py-3 border-b border-zinc-800/50 last:border-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-t6 font-mono text-text-disabled bg-surface-secondary border border-zinc-800/50 rounded-[2px] px-2 py-0.5">
                        {entry.toolUsed}
                      </span>
                    </div>
                    <p className="text-t5 font-body text-text-secondary line-clamp-2">{entry.prompt}</p>
                    <p className="text-t5 font-body text-text-primary">{entry.studentAction}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Peer review scores */}
            {peerReview && (
              <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
                <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                  Peer review scores
                </p>
                <div className="space-y-0">
                  <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
                    <span className="text-t5 font-body text-text-secondary">Code quality</span>
                    <span className="text-t4 font-mono font-semibold text-text-primary tabular-nums">
                      {peerReview.scores?.codeQuality ?? '—'}/5
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
                    <span className="text-t5 font-body text-text-secondary">Documentation</span>
                    <span className="text-t4 font-mono font-semibold text-text-primary tabular-nums">
                      {peerReview.scores?.documentationClarity ?? '—'}/5
                    </span>
                  </div>
                  {peerReview.comments?.codeQuality && (
                    <div className="py-2.5 border-b border-zinc-800/50 space-y-0.5">
                      <p className="text-t6 font-body text-text-disabled">Code quality comment</p>
                      <p className="text-t5 font-body text-text-secondary">{peerReview.comments.codeQuality}</p>
                    </div>
                  )}
                  {peerReview.comments?.documentationClarity && (
                    <div className="py-2.5 space-y-0.5">
                      <p className="text-t6 font-body text-text-disabled">Documentation comment</p>
                      <p className="text-t5 font-body text-text-secondary">{peerReview.comments.documentationClarity}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right — review form or success */}
          <div className="md:col-span-5">
            <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4">
              {submitted ? (
                <div className="space-y-4 text-center py-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent-green flex-shrink-0" />
                    <p className="text-t3 font-heading font-semibold text-accent-green">
                      Review submitted
                    </p>
                  </div>
                  <p className="text-t5 font-body text-text-secondary">
                    The student has been notified and the engagement status has been updated.
                  </p>
                  <Link
                    href="/dashboard/lecturer/queue"
                    className="inline-flex items-center gap-1 text-t5 font-body text-accent-green hover:text-accent-green/80 transition-colors duration-150"
                  >
                    ← Back to queue
                  </Link>
                </div>
              ) : (
                <ReviewScoreForm
                  engagementId={engagement._id}
                  onSuccess={handleReviewSuccess}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
