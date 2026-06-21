'use client';

import React, { useState } from 'react';
import { Button, Alert } from '@/components/app';
import { cn } from '@/lib/cn';
import { LecturerDecision, REVIEW_MIN_WORD_COUNT } from '@/types';

// Peer review data revealed by POST /api/lecturer/reviews after the decision
// is recorded — the detail GET withholds it to keep assessments independent.
export interface IPeerReviewReveal {
  scores?: { codeQuality?: number; documentationClarity?: number };
  comments?: { codeQuality?: string; documentationClarity?: string };
  submittedAt?: string;
  status: string;
}

export interface IReviewScoreFormProps {
  engagementId: string;
  onSuccess: (peerReview: IPeerReviewReveal | null) => void;
}

type SubmitState = 'idle' | 'submitting';

const SCORE_DIMS = [
  { key: 'problemUnderstanding', label: 'Problem understanding' },
  { key: 'solutionQuality', label: 'Solution quality' },
  { key: 'processQuality', label: 'Process quality' },
  { key: 'aiUsage', label: 'AI usage' },
] as const;

type ScoreDim = (typeof SCORE_DIMS)[number]['key'];

const DECISIONS = [
  { value: LecturerDecision.VERIFIED, label: 'Verified' },
  { value: LecturerDecision.REVISION_REQUIRED, label: 'Revision required' },
  { value: LecturerDecision.DENIED, label: 'Denied' },
] as const;

// Shared textarea styling — mirrors the app Field shell for a bare textarea.
const FIELD_CLASS =
  'app-body w-full resize-none rounded-app-control border bg-app-card px-3 py-2.5 text-app-ink placeholder:text-app-faint transition-colors duration-150 focus:outline-none focus:ring-2';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

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

function CommentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): React.ReactElement {
  const words = countWords(value);
  const met = words >= REVIEW_MIN_WORD_COUNT;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="app-body text-app-muted">{label}</p>
        <span className={cn('app-meta font-app-mono', met ? 'text-app-brand' : 'text-app-faint')}>
          {words}/{REVIEW_MIN_WORD_COUNT}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={cn(FIELD_CLASS, 'border-app-border-strong focus:border-app-brand focus:ring-app-brand/30')}
        placeholder={`Write at least ${REVIEW_MIN_WORD_COUNT} words...`}
      />
    </div>
  );
}

export function ReviewScoreForm({
  engagementId,
  onSuccess,
}: IReviewScoreFormProps): React.ReactElement {
  const [scores, setScores] = useState<Record<ScoreDim, number>>({
    problemUnderstanding: 0,
    solutionQuality: 0,
    processQuality: 0,
    aiUsage: 0,
  });

  const [comments, setComments] = useState<Record<ScoreDim, string>>({
    problemUnderstanding: '',
    solutionQuality: '',
    processQuality: '',
    aiUsage: '',
  });

  const [overallFeedback, setOverallFeedback] = useState('');
  const [decision, setDecision] = useState<LecturerDecision | ''>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  function allScoresSet(): boolean {
    return Object.values(scores).every((s) => s > 0);
  }

  function allCommentsValid(): boolean {
    return Object.values(comments).every((c) => countWords(c) >= REVIEW_MIN_WORD_COUNT);
  }

  function canSubmit(): boolean {
    if (!allScoresSet() || !allCommentsValid() || !decision) return false;
    if (decision === LecturerDecision.DENIED && !rejectionReason.trim()) return false;
    return true;
  }

  async function handleSubmit(): Promise<void> {
    if (!canSubmit()) return;

    setSubmitState('submitting');
    setSubmitError(null);

    const body: Record<string, unknown> = {
      engagementId,
      decision,
      scores,
      comments: {
        ...comments,
        ...(overallFeedback.trim() ? { overallFeedback: overallFeedback.trim() } : {}),
      },
    };
    if (decision === LecturerDecision.DENIED) {
      body.rejectionReason = rejectionReason.trim();
    }

    try {
      const res = await fetch('/api/lecturer/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setSubmitError(data.error ?? 'Failed to submit review. Please try again.');
        setSubmitState('idle');
        return;
      }

      const data = (await res.json()) as { peerReview?: IPeerReviewReveal | null };
      setSubmitState('idle');
      onSuccess(data.peerReview ?? null);
    } catch {
      setSubmitError('Network error. Try again.');
      setSubmitState('idle');
    }
  }

  // Decision option tint by outcome.
  function decisionClasses(value: LecturerDecision, selected: boolean): string {
    if (!selected) return 'border-app-border-strong hover:border-app-brand';
    if (value === LecturerDecision.VERIFIED) return 'border-app-brand bg-app-brand-surface';
    if (value === LecturerDecision.DENIED) return 'border-app-danger bg-app-danger-surface';
    return 'border-app-warning bg-app-warning-surface';
  }

  function decisionTextClass(value: LecturerDecision, selected: boolean): string {
    if (!selected) return 'text-app-muted';
    if (value === LecturerDecision.VERIFIED) return 'text-app-brand';
    if (value === LecturerDecision.DENIED) return 'text-app-danger';
    return 'text-app-warning';
  }

  return (
    <div className="space-y-6">
      <p className="app-label text-app-muted">Review form</p>

      {/* Scores */}
      <div className="space-y-4">
        {SCORE_DIMS.map(({ key, label }) => (
          <ScoreSelector
            key={key}
            label={label}
            value={scores[key]}
            onChange={(v) => setScores((prev) => ({ ...prev, [key]: v }))}
          />
        ))}
      </div>

      {/* Comments */}
      <div className="space-y-4 border-t border-app-hairline pt-2">
        {SCORE_DIMS.map(({ key, label }) => (
          <CommentField
            key={key}
            label={label}
            value={comments[key]}
            onChange={(v) => setComments((prev) => ({ ...prev, [key]: v }))}
          />
        ))}

        <div className="space-y-1.5">
          <p className="app-body text-app-muted">
            Overall feedback <span className="text-app-faint">(optional)</span>
          </p>
          <textarea
            value={overallFeedback}
            onChange={(e) => setOverallFeedback(e.target.value)}
            rows={3}
            className={cn(FIELD_CLASS, 'border-app-border-strong focus:border-app-brand focus:ring-app-brand/30')}
            placeholder="Any additional comments for the student..."
          />
        </div>
      </div>

      {/* Decision */}
      <div className="space-y-2 border-t border-app-hairline pt-2">
        <p className="app-body text-app-muted">Decision</p>
        <div className="space-y-1.5">
          {DECISIONS.map(({ value, label }) => {
            const selected = decision === value;
            return (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-app-control border px-3 py-2.5 transition-colors duration-150',
                  decisionClasses(value, selected)
                )}
              >
                <input
                  type="radio"
                  name="decision"
                  value={value}
                  checked={selected}
                  onChange={() => setDecision(value)}
                  className="accent-app-brand"
                />
                <span className={cn('app-body', decisionTextClass(value, selected))}>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Rejection reason — only when DENIED */}
      {decision === LecturerDecision.DENIED && (
        <div className="space-y-1.5">
          <p className="app-body text-app-danger">Rejection reason</p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            className={cn(FIELD_CLASS, 'border-app-danger/40 focus:border-app-danger focus:ring-app-danger/30')}
            placeholder="Explain why this project is being denied..."
          />
        </div>
      )}

      {submitError && <Alert tone="danger">{submitError}</Alert>}

      <Button
        className="w-full"
        disabled={!canSubmit()}
        isLoading={submitState === 'submitting'}
        onClick={() => void handleSubmit()}
      >
        Submit review
      </Button>
    </div>
  );
}
