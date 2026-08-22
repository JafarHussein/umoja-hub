'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Role, PeerReviewStatus, ProjectTrack } from '@/types';
import { Button, Alert } from '@/components/app';
import { cn } from '@/lib/cn';
import { loginUrlWithIntent } from '@/lib/auth/intent';

// ── Types ──────────────────────────────────────────────────────────────────

interface IEngagementForReview {
  _id: string;
  brief: Record<string, unknown>;
  track: ProjectTrack;
}

/**
 * The version of the report this peer was asked to read.
 *
 * Metadata only. The document itself is fetched from the file route, which
 * decides at the moment of each read whether this reader is still entitled to
 * it — and which carries nothing about what the lecturer thought of the work.
 */
interface IPeerDocumentation {
  versionId: string;
  versionNumber: number;
  fileName: string;
  pageCount?: number;
  submittedAt: string;
}

interface IPeerReview {
  _id: string;
  engagementId: string;
  status: string;
  scores?: { codeQuality?: number; documentationClarity?: number };
  comments?: { codeQuality?: string; documentationClarity?: string };
  submittedAt?: string;
  engagement: IEngagementForReview | null;
  documentation: IPeerDocumentation | null;
}

type PageState = 'loading' | 'ready' | 'not_found' | 'error';
type SubmitState = 'idle' | 'submitting';


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

// Neutral, capitalized status pill.
function StatusChip({ label }: { label: string }): React.ReactElement {
  const submitted = label === PeerReviewStatus.SUBMITTED;
  return (
    <span
      className={cn(
        'app-label inline-flex items-center rounded-app-pill px-2 py-0.5 capitalize',
        submitted ? 'bg-app-success-surface text-app-success' : 'bg-app-sunken text-app-muted'
      )}
    >
      {submitted && <span aria-hidden className="mr-1">✓</span>}
      {label.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
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
      <p className="app-body text-app-muted">{label}</p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'app-data-m h-9 w-9 rounded-app-control border transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring',
              value === n
                ? 'border-app-brand bg-app-brand-surface text-app-brand'
                : 'border-app-border-strong bg-app-card text-app-muted hover:border-app-brand'
            )}
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
      <legend className="app-body mb-1 text-app-muted">{legend}</legend>
      {options.map((option) => {
        const checked = selected.includes(option);
        return (
          <label key={option} className="flex cursor-pointer select-none items-center gap-2.5 py-1">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(option)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-app-cell border text-[10px] transition-colors duration-150',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-app-ring',
                checked
                  ? 'border-app-brand bg-app-brand-surface text-app-brand'
                  : 'border-app-border-strong text-transparent'
              )}
              aria-hidden="true"
            >
              ✓
            </span>
            <span className={cn('app-body', checked ? 'text-app-ink' : 'text-app-muted')}>
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
    <div className="mx-auto w-full max-w-app-page space-y-10">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-7 w-48 rounded" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="space-y-4 md:col-span-7">
          <div className="skeleton h-48 rounded-app-card" />
        </div>
        <div className="md:col-span-5">
          <div className="skeleton h-64 rounded-app-card" />
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
      router.push(loginUrlWithIntent());
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
        setSubmitError(body.error ?? 'Could not submit your review. Please try again.');
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
      <div className="mx-auto w-full max-w-app-page">
        <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
          <p className="app-body text-app-muted">Review not found.</p>
          <Link
            href="/dashboard/student/peer-review"
            className="app-body mt-4 inline-flex text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
          >
            ← My review
          </Link>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="mx-auto w-full max-w-app-page">
        <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
          <p className="app-body text-app-muted">Could not load this review.</p>
          <Link
            href="/dashboard/student/peer-review"
            className="app-body mt-4 inline-flex text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
          >
            ← My review
          </Link>
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

  const documentation = review.documentation;

  return (
    <div className="mx-auto w-full max-w-app-page space-y-10">
      <Link
        href="/dashboard/student/peer-review"
        className="app-body inline-flex text-app-muted transition-colors duration-150 hover:text-app-ink"
      >
        ← My review
      </Link>

      <div className="flex items-start justify-between gap-4">
        <h1 className="app-h1 text-app-ink">{briefTitle}</h1>
        <StatusChip label={review.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Left — project content (anonymized) */}
        <div className="space-y-4 md:col-span-7">
          {/* Anonymity notice — the author's identity is withheld from reviewers */}
          <div className="rounded-app-control border border-app-hairline bg-app-sunken px-4 py-2.5">
            <p className="app-meta text-app-muted">
              Anonymous submission — the author&apos;s identity is withheld so you can review the
              work on its merits.
            </p>
          </div>

          {/* Brief metadata */}
          {engagement && (
            <div className="space-y-0 rounded-app-card border border-app-hairline bg-app-card p-6">
              <p className="app-label mb-2 text-app-muted">Project info</p>
              <div className="flex items-center justify-between border-b border-app-hairline py-2.5">
                <span className="app-body text-app-muted">Track</span>
                <span className="app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2 py-0.5 capitalize text-app-muted">
                  {engagement.track.replace(/_/g, ' ').toLowerCase()}
                </span>
              </div>

            </div>
          )}

          {/* Their project report. A document they wrote and handed in, opened
              here rather than downloaded — a reader who has just written their
              own report knows what to look for in somebody else's. */}
          <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
            {!documentation ? (
              <p className="app-body text-center text-app-faint">
                This project&apos;s report is not available to read.
              </p>
            ) : (
              <>
                <p className="app-label text-app-muted">Their report</p>
                <object
                  data={`/api/education/engagements/${review.engagementId}/report/file/${documentation.versionId}`}
                  type="application/pdf"
                  className="mt-3 h-[38rem] w-full rounded-app-control border border-app-hairline"
                  aria-label="The project report you are reviewing"
                >
                  <p className="app-body p-4 text-app-muted">
                    Your browser will not display the PDF inline.
                  </p>
                </object>
                <a
                  href={`/api/education/engagements/${review.engagementId}/report/file/${documentation.versionId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="app-meta mt-2 inline-block text-app-brand underline"
                >
                  Open in a new tab
                </a>
                <p className="app-meta mt-1 text-app-faint">
                  Version {documentation.versionNumber}
                  {documentation.pageCount ? ` · ${documentation.pageCount} pages` : ''}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Right — review form */}
        <div className="md:col-span-5">
          {isSubmitted ? (
            <div className="space-y-4 rounded-app-card border border-app-hairline bg-app-card p-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 flex-shrink-0 rounded-app-pill bg-app-brand" />
                <p className="app-body-strong text-app-brand">Review submitted</p>
              </div>

              {review.scores && (
                <div className="space-y-0">
                  <p className="app-label mb-2 text-app-muted">Scores</p>
                  <div className="flex items-center justify-between border-b border-app-hairline py-2.5">
                    <span className="app-body text-app-muted">Code quality</span>
                    <span className="app-data-m text-app-ink">
                      {review.scores.codeQuality ?? '—'}/5
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="app-body text-app-muted">Documentation</span>
                    <span className="app-data-m text-app-ink">
                      {review.scores.documentationClarity ?? '—'}/5
                    </span>
                  </div>
                </div>
              )}

              {review.comments && (
                <div className="space-y-3">
                  <p className="app-label text-app-muted">Comments</p>
                  {review.comments.codeQuality && (
                    <div className="space-y-1">
                      <p className="app-meta text-app-faint">Code quality</p>
                      <p className="app-body text-app-muted">{review.comments.codeQuality}</p>
                    </div>
                  )}
                  {review.comments.documentationClarity && (
                    <div className="space-y-1">
                      <p className="app-meta text-app-faint">Documentation</p>
                      <p className="app-body text-app-muted">
                        {review.comments.documentationClarity}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 rounded-app-card border border-app-hairline bg-app-card p-6">
              <p className="app-label text-app-muted">Review form</p>

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

              {submitError && <Alert tone="danger">{submitError}</Alert>}

              <Button
                className="w-full"
                disabled={!canSubmit || submitState === 'submitting'}
                isLoading={submitState === 'submitting'}
                onClick={() => void handleSubmit()}
              >
                Submit review
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
