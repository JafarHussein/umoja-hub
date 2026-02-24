'use client';

import { useState } from 'react';

interface IPeerReviewFormProps {
  engagementId: string;
  onSuccess?: () => void;
}

interface IScores {
  codeQuality: number;
  documentationClarity: number;
}

interface IComments {
  codeQuality: string;
  documentationClarity: string;
}

function ScoreSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="font-body text-t5 text-text-secondary mb-2">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
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
    </div>
  );
}

export default function PeerReviewForm({ engagementId, onSuccess }: IPeerReviewFormProps) {
  const [scores, setScores] = useState<IScores>({ codeQuality: 0, documentationClarity: 0 });
  const [comments, setComments] = useState<IComments>({ codeQuality: '', documentationClarity: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    scores.codeQuality > 0 &&
    scores.documentationClarity > 0 &&
    comments.codeQuality.trim().length >= 20 &&
    comments.documentationClarity.trim().length >= 20 &&
    !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/education/peer-review/${engagementId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores, comments }),
      });

      const data = (await res.json()) as { error?: string; data?: unknown };

      if (!res.ok) {
        setError(data.error ?? 'Submission failed. Please try again.');
        return;
      }

      setSubmitted(true);
      onSuccess?.();
    } catch {
      setError('Connection failed. Please check your internet and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-surface-elevated border border-accent-green/20 rounded p-8 text-center">
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
        <h3 className="font-heading text-t3 text-text-primary mb-2">Peer Review Submitted</h3>
        <p className="font-body text-t5 text-text-secondary">
          Your review has been recorded. The project will now advance to lecturer review.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <div className="bg-surface-elevated border border-white/5 rounded p-6">
        <h3 className="font-heading text-t3 text-text-primary mb-1">Peer Review</h3>
        <p className="font-body text-t5 text-text-secondary mb-6">
          Review this project honestly. Your feedback directly informs the lecturer review.
        </p>

        {/* Code Quality */}
        <div className="space-y-3 mb-6">
          <ScoreSelector
            label="Code Quality (1–5)"
            value={scores.codeQuality}
            onChange={(v) => setScores((s) => ({ ...s, codeQuality: v }))}
          />
          <textarea
            value={comments.codeQuality}
            onChange={(e) => setComments((c) => ({ ...c, codeQuality: e.target.value }))}
            placeholder="Describe the code quality: structure, readability, naming, error handling..."
            rows={4}
            className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-accent-green/50 transition-all duration-150"
          />
        </div>

        {/* Documentation Clarity */}
        <div className="space-y-3">
          <ScoreSelector
            label="Documentation Clarity (1–5)"
            value={scores.documentationClarity}
            onChange={(v) => setScores((s) => ({ ...s, documentationClarity: v }))}
          />
          <textarea
            value={comments.documentationClarity}
            onChange={(e) => setComments((c) => ({ ...c, documentationClarity: e.target.value }))}
            placeholder="Describe the documentation: README quality, process documents, clarity of explanations..."
            rows={4}
            className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-accent-green/50 transition-all duration-150"
          />
        </div>
      </div>

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
        {isSubmitting ? 'Submitting...' : 'Submit Peer Review'}
      </button>
    </form>
  );
}
