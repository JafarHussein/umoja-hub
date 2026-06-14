'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
        <p className="text-t5 font-body text-text-secondary">{label}</p>
        <span
          className={[
            'text-t6 font-mono tabular-nums',
            met ? 'text-accent-green' : 'text-text-disabled',
          ].join(' ')}
        >
          {words}/{REVIEW_MIN_WORD_COUNT}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={[
          'w-full bg-surface-secondary border rounded-sm px-3 py-2.5 font-body text-t5',
          'text-text-primary placeholder-text-disabled resize-none',
          'focus:outline-none transition-colors duration-150',
          met ? 'border-zinc-800/50 focus:border-accent-green/50' : 'border-zinc-800/50',
        ].join(' ')}
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

  return (
    <div className="space-y-6">
      <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
        Review form
      </p>

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
      <div className="space-y-4 pt-2 border-t border-zinc-800/50">
        {SCORE_DIMS.map(({ key, label }) => (
          <CommentField
            key={key}
            label={label}
            value={comments[key]}
            onChange={(v) => setComments((prev) => ({ ...prev, [key]: v }))}
          />
        ))}

        <div className="space-y-1.5">
          <p className="text-t5 font-body text-text-secondary">
            Overall feedback{' '}
            <span className="text-text-disabled">(optional)</span>
          </p>
          <textarea
            value={overallFeedback}
            onChange={(e) => setOverallFeedback(e.target.value)}
            rows={3}
            className="w-full bg-surface-secondary border border-zinc-800/50 rounded-sm px-3 py-2.5 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-accent-green/50 transition-colors duration-150"
            placeholder="Any additional comments for the student..."
          />
        </div>
      </div>

      {/* Decision */}
      <div className="space-y-2 pt-2 border-t border-zinc-800/50">
        <p className="text-t5 font-body text-text-secondary">Decision</p>
        <div className="space-y-1.5">
          {DECISIONS.map(({ value, label }) => (
            <label
              key={value}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-sm border cursor-pointer transition-colors duration-150',
                decision === value
                  ? value === LecturerDecision.VERIFIED
                    ? 'border-accent-green bg-accent-green/5'
                    : value === LecturerDecision.DENIED
                      ? 'border-red-800/50 bg-red-950/10'
                      : 'border-amber-800/50 bg-amber-950/10'
                  : 'border-zinc-800/50 hover:border-white/20',
              ].join(' ')}
            >
              <input
                type="radio"
                name="decision"
                value={value}
                checked={decision === value}
                onChange={() => setDecision(value)}
                className="accent-accent-green"
              />
              <span
                className={[
                  'text-t5 font-body',
                  decision === value
                    ? value === LecturerDecision.VERIFIED
                      ? 'text-accent-green'
                      : value === LecturerDecision.DENIED
                        ? 'text-red-400'
                        : 'text-amber-400'
                    : 'text-text-secondary',
                ].join(' ')}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Rejection reason — only when DENIED */}
      {decision === LecturerDecision.DENIED && (
        <div className="space-y-1.5">
          <p className="text-t5 font-body text-red-400">Rejection reason</p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            className="w-full bg-surface-secondary border border-red-900/40 rounded-sm px-3 py-2.5 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-red-700/50 transition-colors duration-150"
            placeholder="Explain why this project is being denied..."
          />
        </div>
      )}

      {submitError && (
        <p className="text-t5 font-body text-red-400 bg-red-950/20 border border-red-900/30 rounded-sm px-3 py-2">
          {submitError}
        </p>
      )}

      <Button
        variant="primary"
        size="md"
        className="w-full"
        disabled={!canSubmit() || submitState === 'submitting'}
        isLoading={submitState === 'submitting'}
        onClick={() => void handleSubmit()}
      >
        Submit review
      </Button>
    </div>
  );
}
