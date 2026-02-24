'use client';

import { useState } from 'react';
import { REVIEW_MIN_WORD_COUNT } from '@/types';

const DIMENSIONS = [
  {
    key: 'problemUnderstanding',
    label: 'Problem Understanding',
    description: 'How well does the student demonstrate they understood the client problem and constraints?',
  },
  {
    key: 'solutionQuality',
    label: 'Solution Quality',
    description: 'Is the solution technically sound and appropriate for the tier level?',
  },
  {
    key: 'processQuality',
    label: 'Process Quality',
    description: 'Are the process documents (problem breakdown, approach plan, reflection) thorough and honest?',
  },
  {
    key: 'aiUsage',
    label: 'AI Usage Transparency',
    description: 'Does the AI usage log show responsible, transparent use of AI tools?',
  },
] as const;

interface IScores {
  problemUnderstanding: number;
  solutionQuality: number;
  processQuality: number;
  aiUsage: number;
}

interface IComments {
  problemUnderstanding: string;
  solutionQuality: string;
  processQuality: string;
  aiUsage: string;
  overallFeedback: string;
}

interface ILecturerRubricProps {
  engagementId: string;
  onSuccess?: (decision: string) => void;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function ScoreButtons({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const scoreLabels = ['', 'Inadequate', 'Below standard', 'Meets standard', 'Above standard', 'Exceptional'];

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          title={scoreLabels[n]}
          className={`w-10 h-10 rounded-sm border font-mono text-t5 transition-all duration-150 ${
            value === n
              ? 'bg-accent-green border-accent-green text-white'
              : 'bg-surface-secondary border-white/10 text-text-secondary hover:border-white/30'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function WordCount({ text, min }: { text: string; min: number }) {
  const count = countWords(text);
  const met = count >= min;
  return (
    <span
      className={`font-mono text-t6 transition-all duration-150 ${met ? 'text-accent-green' : 'text-text-disabled'}`}
    >
      {count}/{min} words
    </span>
  );
}

export default function LecturerRubric({ engagementId, onSuccess }: ILecturerRubricProps) {
  const [scores, setScores] = useState<IScores>({
    problemUnderstanding: 0,
    solutionQuality: 0,
    processQuality: 0,
    aiUsage: 0,
  });
  const [comments, setComments] = useState<IComments>({
    problemUnderstanding: '',
    solutionQuality: '',
    processQuality: '',
    aiUsage: '',
    overallFeedback: '',
  });
  const [decision, setDecision] = useState<'VERIFIED' | 'REVISION_REQUIRED' | 'DENIED' | ''>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const allScoresFilled = Object.values(scores).every((s) => s > 0);
  const allCommentsMet = DIMENSIONS.every(
    (d) => countWords(comments[d.key]) >= REVIEW_MIN_WORD_COUNT
  );
  const decisionSelected = decision !== '';
  const rejectionReasonOk = decision !== 'DENIED' || rejectionReason.trim().length > 0;

  const canSubmit =
    allScoresFilled &&
    allCommentsMet &&
    decisionSelected &&
    rejectionReasonOk &&
    !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !decision) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/education/reviews/${engagementId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          scores,
          comments: {
            problemUnderstanding: comments.problemUnderstanding,
            solutionQuality: comments.solutionQuality,
            processQuality: comments.processQuality,
            aiUsage: comments.aiUsage,
            overallFeedback: comments.overallFeedback || undefined,
          },
          rejectionReason: decision === 'DENIED' ? rejectionReason : undefined,
        }),
      });

      const data = (await res.json()) as { error?: string; data?: { decision: string } };

      if (!res.ok) {
        setError(data.error ?? 'Submission failed. Please try again.');
        return;
      }

      setSubmitted(true);
      onSuccess?.(decision);
    } catch {
      setError('Connection failed. Please check your internet and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    const decisionLabels: Record<string, string> = {
      VERIFIED: 'Verified',
      REVISION_REQUIRED: 'Revision Required',
      DENIED: 'Denied',
    };

    return (
      <div className="bg-surface-elevated border border-white/5 rounded p-8 text-center">
        <div className="flex justify-center mb-4">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path
              d="M8 20L16 28L32 12"
              stroke="#007F4E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="font-heading text-t3 text-text-primary mb-2">
          Review Submitted — {decisionLabels[decision] ?? decision}
        </h3>
        <p className="font-body text-t5 text-text-secondary">
          The student has been notified. This review is now part of the immutable audit log.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      {/* Dimensions */}
      {DIMENSIONS.map((dim) => {
        const wordCount = countWords(comments[dim.key]);
        const met = wordCount >= REVIEW_MIN_WORD_COUNT;

        return (
          <div key={dim.key} className="bg-surface-elevated border border-white/5 rounded p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="font-heading text-t3 text-text-primary">{dim.label}</h3>
                <p className="font-body text-t6 text-text-secondary mt-1">{dim.description}</p>
              </div>
              <ScoreButtons
                value={scores[dim.key]}
                onChange={(v) => setScores((s) => ({ ...s, [dim.key]: v }))}
              />
            </div>

            <div className="relative">
              <textarea
                value={comments[dim.key]}
                onChange={(e) =>
                  setComments((c) => ({ ...c, [dim.key]: e.target.value }))
                }
                placeholder={`Write at least ${REVIEW_MIN_WORD_COUNT} words about this dimension...`}
                rows={5}
                className={`w-full bg-surface-secondary border rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none transition-all duration-150 ${
                  met ? 'border-accent-green/30 focus:border-accent-green/50' : 'border-white/5 focus:border-white/20'
                }`}
              />
              <div className="flex justify-end mt-1">
                <WordCount text={comments[dim.key]} min={REVIEW_MIN_WORD_COUNT} />
              </div>
            </div>
          </div>
        );
      })}

      {/* Overall Feedback (optional) */}
      <div className="bg-surface-elevated border border-white/5 rounded p-6">
        <h3 className="font-heading text-t3 text-text-primary mb-1">Overall Feedback</h3>
        <p className="font-body text-t6 text-text-secondary mb-3">
          Optional — additional context for the student.
        </p>
        <textarea
          value={comments.overallFeedback}
          onChange={(e) => setComments((c) => ({ ...c, overallFeedback: e.target.value }))}
          placeholder="Any additional feedback, suggestions, or observations for the student..."
          rows={4}
          className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-white/20 transition-all duration-150"
        />
      </div>

      {/* Decision */}
      <div className="bg-surface-elevated border border-white/5 rounded p-6">
        <h3 className="font-heading text-t3 text-text-primary mb-4">Decision</h3>
        <div className="flex gap-3 flex-wrap">
          {(['VERIFIED', 'REVISION_REQUIRED', 'DENIED'] as const).map((d) => {
            const labels: Record<string, string> = {
              VERIFIED: 'Verified',
              REVISION_REQUIRED: 'Revision Required',
              DENIED: 'Denied',
            };
            const activeColors: Record<string, string> = {
              VERIFIED: 'bg-accent-green border-accent-green text-white',
              REVISION_REQUIRED: 'bg-amber-600/90 border-amber-600 text-white',
              DENIED: 'bg-red-700/90 border-red-700 text-white',
            };

            return (
              <button
                key={d}
                type="button"
                onClick={() => setDecision(d)}
                className={`px-4 py-2 rounded-sm border font-body text-t5 transition-all duration-150 min-h-[44px] ${
                  decision === d
                    ? (activeColors[d] ?? '')
                    : 'bg-surface-secondary border-white/10 text-text-secondary hover:border-white/30'
                }`}
              >
                {labels[d]}
              </button>
            );
          })}
        </div>

        {decision === 'DENIED' && (
          <div className="mt-4">
            <label className="font-body text-t5 text-text-secondary block mb-2">
              Rejection reason (required for DENIED)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this project is being denied..."
              rows={3}
              className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-red-500/30 transition-all duration-150"
            />
          </div>
        )}
      </div>

      {/* Validation summary */}
      {!allCommentsMet && (
        <div className="px-4 py-3 bg-surface-secondary border border-white/5 rounded">
          <p className="font-body text-t6 text-text-disabled">
            All 4 comment fields require at least {REVIEW_MIN_WORD_COUNT} words before submission.
          </p>
        </div>
      )}

      {error && (
        <p className="font-body text-t5 text-red-400 bg-red-950/20 border border-red-900/30 rounded px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3 bg-accent-green text-white font-body text-t4 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-150 min-h-[44px]"
      >
        {isSubmitting ? 'Submitting review...' : 'Submit Lecturer Review'}
      </button>
    </form>
  );
}
