'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Role, PeerReviewStatus, ProjectTrack } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';

// ── Types ──────────────────────────────────────────────────────────────────

interface IProcessDoc {
  content: string;
  submittedAt: string;
}

interface IEngagementForReview {
  _id: string;
  brief: Record<string, unknown>;
  tier: string;
  track: ProjectTrack;
  documents: {
    problemBreakdown?: IProcessDoc;
    approachPlan?: IProcessDoc;
    finalReflection?: IProcessDoc;
  };
}

interface IPeerReview {
  _id: string;
  engagementId: string;
  status: string;
  scores?: { codeQuality?: number; documentationClarity?: number };
  comments?: { codeQuality?: string; documentationClarity?: string };
  submittedAt?: string;
  engagement: IEngagementForReview | null;
}

type PageState = 'loading' | 'ready' | 'not_found' | 'error';
type SubmitState = 'idle' | 'submitting';
type DocTab = 'problemBreakdown' | 'approachPlan' | 'finalReflection';

const DOC_TAB_LABELS: Record<DocTab, string> = {
  problemBreakdown: 'Problem Breakdown',
  approachPlan: 'Approach Plan',
  finalReflection: 'Final Reflection',
};

const DOC_TABS: DocTab[] = ['problemBreakdown', 'approachPlan', 'finalReflection'];

// Preset rubric criteria. Selected boxes serialize (in this fixed order) into a
// canonical comment string per dimension — no free-text, so reviews stay
// structured and comparable while still satisfying peerReviewSchema (non-empty).
const CODE_QUALITY_CRITERIA = [
  'Readable structure and naming',
  'Handles errors and edge cases',
  'Avoids unnecessary complexity',
  'Includes tests or verification',
  'Consistent, idiomatic style',
];

const DOC_CLARITY_CRITERIA = [
  'Problem clearly explained',
  'Approach is well justified',
  'Reflection shows genuine learning',
  'Steps are reproducible',
  'Concise and well organized',
];

// Canonical serialization: filter the preset list in declared order so the
// stored comment is deterministic regardless of click order.
function serializeCriteria(preset: string[], selected: string[]): string {
  return preset.filter((c) => selected.includes(c)).join('; ');
}

// ── Score selector ─────────────────────────────────────────────────────────

function ScoreSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}): React.ReactElement {
  return (
    <div className="space-y-1.5">
      <p className="text-t5 font-body text-text-secondary">{label}</p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={[
              'w-9 h-9 rounded-sm font-mono text-t5 border transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-green',
              value === n
                ? 'bg-accent-green/10 border-accent-green text-accent-green'
                : 'bg-surface-secondary border-zinc-800/50 text-text-secondary hover:border-white/20',
            ].join(' ')}
            aria-pressed={value === n}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Criteria checklist ──────────────────────────────────────────────────────

function CriteriaGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}): React.ReactElement {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-t5 font-body text-text-secondary mb-1">{legend}</legend>
      {options.map((option) => {
        const checked = selected.includes(option);
        return (
          <label
            key={option}
            className="flex items-center gap-2.5 cursor-pointer select-none py-1"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(option)}
              className="peer sr-only"
            />
            <span
              className={[
                'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[3px] border text-[10px] transition-colors duration-150',
                'peer-focus-visible:ring-1 peer-focus-visible:ring-accent-green',
                checked
                  ? 'border-accent-green bg-accent-green/15 text-accent-green'
                  : 'border-zinc-700 text-transparent',
              ].join(' ')}
              aria-hidden="true"
            >
              ✓
            </span>
            <span
              className={[
                'text-t5 font-body',
                checked ? 'text-text-primary' : 'text-text-secondary',
              ].join(' ')}
            >
              {option}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function PageSkeleton(): React.ReactElement {
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="h-4 w-24 bg-surface-secondary rounded-sm animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-3 w-32 bg-surface-secondary rounded-sm animate-pulse" />
          <div className="h-7 w-48 bg-surface-secondary rounded-sm animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-4">
            <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 bg-surface-secondary rounded-sm animate-pulse" style={{ width: `${70 + i * 5}%` }} />
              ))}
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
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

export default function PeerReviewDetailPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [review, setReview] = useState<IPeerReview | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<DocTab>('problemBreakdown');

  const [codeQualityScore, setCodeQualityScore] = useState(0);
  const [docClarityScore, setDocClarityScore] = useState(0);
  const [codeCriteria, setCodeCriteria] = useState<string[]>([]);
  const [docCriteria, setDocCriteria] = useState<string[]>([]);

  function toggleCriterion(
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    option: string
  ): void {
    setList((prev) =>
      prev.includes(option) ? prev.filter((c) => c !== option) : [...prev, option]
    );
  }

  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchReview = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/peer-reviews/${params.id}`);
      if (res.status === 404) {
        setPageState('not_found');
        return;
      }
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: IPeerReview };
      setReview(body.data);
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
      void fetchReview();
    }
  }, [status, session, router, fetchReview]);

  async function handleSubmit(): Promise<void> {
    if (!review) return;
    if (codeQualityScore === 0 || docClarityScore === 0) {
      setSubmitError('Please select a score for both dimensions.');
      return;
    }
    const codeComment = serializeCriteria(CODE_QUALITY_CRITERIA, codeCriteria);
    const docComment = serializeCriteria(DOC_CLARITY_CRITERIA, docCriteria);
    if (!codeComment || !docComment) {
      setSubmitError('Select at least one criterion for both dimensions.');
      return;
    }

    setSubmitState('submitting');
    setSubmitError(null);

    try {
      const res = await fetch(`/api/peer-reviews/${review._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores: { codeQuality: codeQualityScore, documentationClarity: docClarityScore },
          comments: { codeQuality: codeComment, documentationClarity: docComment },
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setSubmitError(body.error ?? 'Failed to submit review. Please try again.');
        setSubmitState('idle');
        return;
      }

      setReview((prev) =>
        prev
          ? {
              ...prev,
              status: PeerReviewStatus.SUBMITTED,
              scores: { codeQuality: codeQualityScore, documentationClarity: docClarityScore },
              comments: { codeQuality: codeComment, documentationClarity: docComment },
            }
          : null
      );
      setSubmitState('idle');
    } catch {
      setSubmitError('Network error. Try again.');
      setSubmitState('idle');
    }
  }

  if (status === 'loading' || pageState === 'loading') {
    return <PageSkeleton />;
  }

  if (pageState === 'not_found' || !review) {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-text-secondary">Review not found.</p>
            <Link
              href="/dashboard/student/peer-review"
              className="inline-flex mt-4 text-t5 font-body text-accent-green hover:text-accent-green/80 transition-colors duration-150"
            >
              ← My review
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-8 text-center">
            <p className="text-t4 font-body text-text-secondary">Failed to load review.</p>
            <Link
              href="/dashboard/student/peer-review"
              className="inline-flex mt-4 text-t5 font-body text-accent-green hover:text-accent-green/80 transition-colors duration-150"
            >
              ← My review
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const engagement = review.engagement;
  const isSubmitted = review.status === PeerReviewStatus.SUBMITTED;
  const canSubmit =
    codeQualityScore > 0 &&
    docClarityScore > 0 &&
    codeCriteria.length > 0 &&
    docCriteria.length > 0;

  const briefTitle = engagement
    ? engagement.track === ProjectTrack.AI_BRIEF
      ? ((engagement.brief as { title?: string }).title ?? 'AI Brief')
      : ((engagement.brief as { repoName?: string }).repoName ?? 'Open Source Project')
    : 'Unknown project';

  const activeDoc = engagement?.documents?.[activeDocTab];

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <Link
          href="/dashboard/student/peer-review"
          className="inline-flex text-t5 font-body text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          ← My review
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
              Student · Peer Review
            </p>
            <h1 className="text-t2 font-heading font-semibold text-text-primary tracking-tight">
              {briefTitle}
            </h1>
          </div>
          <Badge label={review.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left — project content (anonymized) */}
          <div className="md:col-span-7 space-y-4">

            {/* Anonymity notice — the author's identity is withheld from reviewers */}
            <div className="bg-surface-secondary border border-zinc-800/50 rounded-[4px] px-4 py-2.5">
              <p className="text-t6 font-body text-text-secondary">
                Anonymous submission — the author&apos;s identity is withheld so you can review the
                work on its merits.
              </p>
            </div>

            {/* Brief metadata */}
            {engagement && (
              <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-0">
                <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-2">
                  Project info
                </p>
                <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
                  <span className="text-t5 font-body text-text-secondary">Track</span>
                  <Badge variant="neutral" label={engagement.track} />
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-t5 font-body text-text-secondary">Tier</span>
                  <Badge variant="neutral" label={engagement.tier} />
                </div>
              </div>
            )}

            {/* Process documents */}
            <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] overflow-hidden">
              <div className="flex border-b border-zinc-800/50">
                {DOC_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveDocTab(tab)}
                    className={[
                      'px-4 py-2.5 text-t5 font-body border-b-2 transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-green focus-visible:ring-inset',
                      activeDocTab === tab
                        ? 'border-accent-green text-text-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary',
                    ].join(' ')}
                  >
                    {DOC_TAB_LABELS[tab]}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activeDoc ? (
                  <div className="space-y-2">
                    <p className="text-t6 font-mono text-text-disabled">
                      Submitted{' '}
                      {new Date(activeDoc.submittedAt).toLocaleDateString('en-KE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
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
          </div>

          {/* Right — review form */}
          <div className="md:col-span-5">

            {isSubmitted ? (
              <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-green flex-shrink-0" />
                  <p className="text-t4 font-body text-accent-green">Review submitted</p>
                </div>

                {review.scores && (
                  <div className="space-y-0">
                    <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-2">
                      Scores
                    </p>
                    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
                      <span className="text-t5 font-body text-text-secondary">Code quality</span>
                      <span className="text-t4 font-mono font-semibold text-text-primary tabular-nums">
                        {review.scores.codeQuality ?? '—'}/5
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-t5 font-body text-text-secondary">Documentation</span>
                      <span className="text-t4 font-mono font-semibold text-text-primary tabular-nums">
                        {review.scores.documentationClarity ?? '—'}/5
                      </span>
                    </div>
                  </div>
                )}

                {review.comments && (
                  <div className="space-y-3">
                    <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                      Comments
                    </p>
                    {review.comments.codeQuality && (
                      <div className="space-y-1">
                        <p className="text-t6 font-body text-text-disabled">Code quality</p>
                        <p className="text-t5 font-body text-text-secondary">
                          {review.comments.codeQuality}
                        </p>
                      </div>
                    )}
                    {review.comments.documentationClarity && (
                      <div className="space-y-1">
                        <p className="text-t6 font-body text-text-disabled">Documentation</p>
                        <p className="text-t5 font-body text-text-secondary">
                          {review.comments.documentationClarity}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-4">
                <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                  Review form
                </p>

                <div className="space-y-2.5">
                  <ScoreSelector
                    label="Code quality"
                    value={codeQualityScore}
                    onChange={setCodeQualityScore}
                  />
                  <CriteriaGroup
                    legend="Code quality criteria"
                    options={CODE_QUALITY_CRITERIA}
                    selected={codeCriteria}
                    onToggle={(o) => toggleCriterion(setCodeCriteria, o)}
                  />
                </div>

                <div className="space-y-2.5">
                  <ScoreSelector
                    label="Documentation clarity"
                    value={docClarityScore}
                    onChange={setDocClarityScore}
                  />
                  <CriteriaGroup
                    legend="Documentation clarity criteria"
                    options={DOC_CLARITY_CRITERIA}
                    selected={docCriteria}
                    onToggle={(o) => toggleCriterion(setDocCriteria, o)}
                  />
                </div>

                {submitError && (
                  <p className="text-t5 font-body text-red-400 bg-red-950/20 border border-red-900/30 rounded-sm px-3 py-2">
                    {submitError}
                  </p>
                )}

                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  disabled={!canSubmit || submitState === 'submitting'}
                  onClick={() => void handleSubmit()}
                >
                  {submitState === 'submitting' ? 'Submitting...' : 'Submit review'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
