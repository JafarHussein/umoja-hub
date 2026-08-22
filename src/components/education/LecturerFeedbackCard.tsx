'use client';

import React from 'react';
import { cn } from '@/lib/cn';
import { LecturerDecision } from '@/types';
import { SCORE_DIMS, type ScoreDim } from './ReviewScoreForm';

// The student's side of the lecturer's assessment. Every review the project has
// been through is kept — a revision request is a step in a cycle, and the
// feedback that prompted it has to stay readable while the student works
// through it.

export interface ILecturerReview {
  _id: string;
  revisionNumber: number;
  decision: LecturerDecision;
  scores: Record<ScoreDim, number>;
  comments: Record<ScoreDim, string> & { overallFeedback?: string };
  rejectionReason?: string;
  createdAt: string;
}

const DECISION_PILL: Record<LecturerDecision, string> = {
  [LecturerDecision.VERIFIED]: 'bg-app-success-surface text-app-success',
  [LecturerDecision.REVISION_REQUIRED]: 'bg-app-warning-surface text-app-warning',
  [LecturerDecision.DENIED]: 'bg-app-danger-surface text-app-danger',
};

const DECISION_LABEL: Record<LecturerDecision, string> = {
  [LecturerDecision.VERIFIED]: 'Verified',
  [LecturerDecision.REVISION_REQUIRED]: 'Revision required',
  [LecturerDecision.DENIED]: 'Not verified',
};

function passLabel(revisionNumber: number): string {
  return revisionNumber === 0 ? 'First submission' : `Revision ${revisionNumber}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ReviewBlock({ review }: { review: ILecturerReview }): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="app-body text-app-ink">{passLabel(review.revisionNumber)}</p>
          <p className="app-meta text-app-faint">Reviewed {formatDate(review.createdAt)}</p>
        </div>
        <span
          className={cn(
            'app-label inline-flex items-center rounded-app-pill px-2 py-0.5',
            DECISION_PILL[review.decision]
          )}
        >
          {DECISION_LABEL[review.decision]}
        </span>
      </div>

      {review.comments.overallFeedback && (
        <p className="app-body leading-relaxed text-app-muted">
          {review.comments.overallFeedback}
        </p>
      )}

      <div className="space-y-3">
        {SCORE_DIMS.map((dim) => (
          <div key={dim.key}>
            <div className="flex items-baseline justify-between gap-4">
              <p className="app-label text-app-muted">{dim.label}</p>
              <p className="app-data-m text-app-ink">{review.scores[dim.key]}/5</p>
            </div>
            <p className="app-body leading-relaxed text-app-muted">{review.comments[dim.key]}</p>
          </div>
        ))}
      </div>

      {review.rejectionReason && (
        <div>
          <p className="app-label mb-1.5 text-app-muted">Reason</p>
          <p className="app-body leading-relaxed text-app-muted">{review.rejectionReason}</p>
        </div>
      )}
    </div>
  );
}

export function LecturerFeedbackCard({
  reviews,
}: {
  reviews: ILecturerReview[];
}): React.ReactElement | null {
  if (reviews.length === 0) return null;

  // Most recent first — the assessment the student has to act on.
  const ordered = [...reviews].sort((a, b) => b.revisionNumber - a.revisionNumber);
  const [latest, ...earlier] = ordered as [ILecturerReview, ...ILecturerReview[]];

  return (
    <div className="space-y-5 rounded-app-card border border-app-hairline bg-app-card p-6">
      <div>
        <p className="app-label mb-1 text-app-muted">Lecturer feedback</p>
        <h2 className="app-h2 text-app-ink">What your lecturer said</h2>
      </div>

      <ReviewBlock review={latest} />

      {earlier.length > 0 && (
        <details className="border-t border-app-hairline pt-4">
          <summary className="app-meta cursor-pointer text-app-muted transition-colors duration-150 hover:text-app-ink">
            Earlier reviews ({earlier.length})
          </summary>
          <div className="mt-4 space-y-6">
            {earlier.map((review) => (
              <ReviewBlock key={review._id} review={review} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
