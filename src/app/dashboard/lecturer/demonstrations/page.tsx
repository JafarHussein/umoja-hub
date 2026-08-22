'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, EmptyState, Page, PageHeader, Textarea } from '@/components/app';
import { cn } from '@/lib/cn';
import {
  Role,
  DemonstrationStatus,
  DemonstrationOutcome,
  DEMONSTRATION_CRITERIA,
  DEMONSTRATION_CRITERION_LABEL,
  DEMONSTRATION_CRITERION_PROMPT,
  DEMONSTRATION_COMMENT_MIN_WORDS,
  type DemonstrationCriterion,
} from '@/types';
import { loginUrlWithIntent } from '@/lib/auth/intent';
import { formatSlotTime } from '@/components/education/DemonstrationPanel';

// ---------------------------------------------------------------------------
// A lecturer's demonstrations: requests to confirm, sessions coming up, and
// sessions held but not yet written up.
//
// The evaluation form is the point of the screen. Six criteria, each with the
// question it is actually asking, so a lecturer scoring "design justification"
// is reminded that what they are judging is whether the student can defend the
// alternatives they rejected.
// ---------------------------------------------------------------------------

interface IDemo {
  _id: string;
  engagementId: string;
  reportId: string | null;
  studentName: string;
  projectTitle: string;
  units: string[];
  githubRepoUrl?: string;
  scheduledFor: string;
  durationMinutes: number;
  format: string;
  location?: string;
  studentNotes?: string;
  status: string;
  revisionNumber: number;
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function EvaluationForm({
  demo,
  onDone,
}: {
  demo: IDemo;
  onDone: () => void;
}): React.ReactElement {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(DEMONSTRATION_CRITERIA.map((c) => [c, 3]))
  );
  const [comments, setComments] = useState<Record<string, string>>(
    Object.fromEntries(DEMONSTRATION_CRITERIA.map((c) => [c, '']))
  );
  const [questioningNotes, setQuestioningNotes] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allCommented = DEMONSTRATION_CRITERIA.every(
    (c) => countWords(comments[c] ?? '') >= DEMONSTRATION_COMMENT_MIN_WORDS
  );

  async function submit(outcome: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lecturer/demonstrations/${demo._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EVALUATE',
          evaluation: {
            scores,
            comments,
            outcome,
            ...(questioningNotes.trim() ? { questioningNotes: questioningNotes.trim() } : {}),
            ...(failure.trim() ? { failureDuringDemonstration: failure.trim() } : {}),
          },
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? 'Could not record your evaluation.');
        setBusy(false);
        return;
      }
      onDone();
    } catch {
      setError('Network error. Try again.');
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 border-t border-app-hairline pt-5">
      <p className="app-h3 text-app-ink">Evaluate the demonstration</p>

      <div className="mt-4 space-y-5">
        {DEMONSTRATION_CRITERIA.map((criterion: DemonstrationCriterion) => (
          <div key={criterion}>
            <p className="app-label text-app-body">{DEMONSTRATION_CRITERION_LABEL[criterion]}</p>
            <p className="app-meta mt-0.5 text-app-muted">
              {DEMONSTRATION_CRITERION_PROMPT[criterion]}
            </p>
            <div className="mt-2 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={scores[criterion] === n}
                  aria-label={`${DEMONSTRATION_CRITERION_LABEL[criterion]}: ${n} of 5`}
                  onClick={() => setScores((prev) => ({ ...prev, [criterion]: n }))}
                  className={cn(
                    'h-9 w-9 rounded-app-control border transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring',
                    scores[criterion] === n
                      ? 'border-app-brand bg-app-brand-surface app-body-strong text-app-ink'
                      : 'border-app-hairline text-app-muted hover:border-app-border-strong'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <Textarea
              className="mt-2"
              rows={2}
              value={comments[criterion] ?? ''}
              onChange={(e) =>
                setComments((prev) => ({ ...prev, [criterion]: e.target.value }))
              }
              aria-label={`Comment on ${DEMONSTRATION_CRITERION_LABEL[criterion]}`}
            />
          </div>
        ))}
      </div>

      <div className="mt-5">
        <p className="app-label text-app-body">What you asked, and how they answered</p>
        <p className="app-meta mt-0.5 text-app-muted">
          Optional, and the most useful thing a student can read afterwards.
        </p>
        <Textarea
          className="mt-1.5"
          rows={4}
          value={questioningNotes}
          onChange={(e) => setQuestioningNotes(e.target.value)}
          aria-label="Questioning notes"
        />
      </div>

      <div className="mt-4">
        <p className="app-label text-app-body">Did anything fail during the demonstration?</p>
        <p className="app-meta mt-0.5 text-app-muted">
          Optional. A failure is assessed on the response to it, not on the fact of it — recording
          it separately keeps that distinction rather than burying it in a score.
        </p>
        <Textarea
          className="mt-1.5"
          rows={2}
          value={failure}
          onChange={(e) => setFailure(e.target.value)}
          aria-label="What failed, and how they responded"
        />
      </div>

      {error && (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          isLoading={busy}
          disabled={!allCommented}
          onClick={() => void submit(DemonstrationOutcome.APPROVED)}
        >
          Approve — project complete
        </Button>
        <Button
          variant="secondary"
          isLoading={busy}
          disabled={!allCommented}
          onClick={() => void submit(DemonstrationOutcome.REVISION_REQUIRED)}
        >
          Ask for more work
        </Button>
      </div>
      {!allCommented && (
        <p className="app-meta mt-2 text-app-muted">
          Every criterion needs a comment of at least {DEMONSTRATION_COMMENT_MIN_WORDS} words. A score with
          no reasoning behind it tells the student nothing they can act on.
        </p>
      )}
    </div>
  );
}

export default function LecturerDemonstrationsPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [demos, setDemos] = useState<IDemo[]>([]);
  const [pageState, setPageState] = useState<'loading' | 'ready' | 'unverified' | 'error'>(
    'loading'
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/lecturer/demonstrations');
      if (res.status === 403) {
        setPageState('unverified');
        return;
      }
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: IDemo[] };
      setDemos(body.data ?? []);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(loginUrlWithIntent());
      return;
    }
    if (status === 'authenticated') {
      if (session.user.role !== Role.LECTURER) {
        router.push('/auth/unauthorized');
        return;
      }
      void load();
    }
  }, [status, session, router, load]);

  async function act(id: string, body: Record<string, unknown>): Promise<void> {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/lecturer/demonstrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(payload.error ?? 'Could not do that.');
        setBusyId(null);
        return;
      }
      setDecliningId(null);
      setDeclineReason('');
      await load();
      setBusyId(null);
    } catch {
      setError('Network error. Try again.');
      setBusyId(null);
    }
  }

  if (status === 'loading' || pageState === 'loading') {
    return (
      <Page width="focus">
        <div className="skeleton h-8 w-56 rounded" />
        <div className="skeleton h-64 rounded-app-card" />
      </Page>
    );
  }

  if (pageState === 'unverified') {
    return (
      <Page width="focus">
        <PageHeader title="Demonstrations" />
        <Alert tone="warning">
          Your lecturer credentials have not been verified yet.
        </Alert>
      </Page>
    );
  }

  const requested = demos.filter((d) => d.status === DemonstrationStatus.REQUESTED);
  const scheduled = demos.filter((d) => d.status === DemonstrationStatus.SCHEDULED);
  const held = demos.filter((d) => d.status === DemonstrationStatus.COMPLETED);

  function Row({ demo }: { demo: IDemo }): React.ReactElement {
    const due = new Date(demo.scheduledFor).getTime() <= Date.now();
    return (
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="app-body-strong text-app-ink">{demo.projectTitle}</p>
            <p className="app-meta mt-0.5 text-app-muted">
              {demo.studentName} · {formatSlotTime(demo.scheduledFor)} · {demo.durationMinutes}{' '}
              minutes
              {demo.revisionNumber > 0 ? ` · pass ${demo.revisionNumber + 1}` : ''}
            </p>
            {demo.units.length > 0 && (
              <p className="app-meta mt-0.5 text-app-faint">{demo.units.join(', ')}</p>
            )}
          </div>
          {demo.reportId && (
            <Link
              href={`/dashboard/lecturer/reports/${demo.reportId}`}
              className="app-meta text-app-brand"
            >
              Read the report →
            </Link>
          )}
        </div>

        {demo.studentNotes && (
          <div className="mt-3 rounded-app-control bg-app-sunken px-3 py-2">
            <p className="app-label text-app-muted">What they will show</p>
            <p className="app-body mt-0.5 whitespace-pre-line text-app-body">
              {demo.studentNotes}
            </p>
          </div>
        )}

        {demo.githubRepoUrl && (
          <p className="app-meta mt-2 break-all text-app-muted">
            <a
              href={demo.githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-app-brand"
            >
              {demo.githubRepoUrl}
            </a>
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {demo.status === DemonstrationStatus.REQUESTED && decliningId !== demo._id && (
            <>
              <Button
                size="sm"
                isLoading={busyId === demo._id}
                onClick={() => void act(demo._id, { action: 'ACCEPT' })}
              >
                Confirm this time
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setDecliningId(demo._id)}>
                Decline
              </Button>
            </>
          )}

          {demo.status === DemonstrationStatus.SCHEDULED && (
            <>
              <Button
                size="sm"
                isLoading={busyId === demo._id}
                disabled={!due}
                onClick={() => void act(demo._id, { action: 'COMPLETE' })}
              >
                It happened
              </Button>
              {!due && (
                <p className="app-meta self-center text-app-muted">
                  Available once the session has started.
                </p>
              )}
            </>
          )}

          {demo.status === DemonstrationStatus.COMPLETED && evaluatingId !== demo._id && (
            <Button size="sm" onClick={() => setEvaluatingId(demo._id)}>
              Write up your evaluation
            </Button>
          )}
        </div>

        {decliningId === demo._id && (
          <div className="mt-4 rounded-app-control border border-app-hairline p-4">
            <p className="app-body-strong text-app-ink">Why can you not take this time?</p>
            <p className="app-meta mt-0.5 text-app-muted">
              The student reads this, and the time goes back on the board.
            </p>
            <Textarea
              className="mt-2"
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              aria-label="Reason for declining"
            />
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                isLoading={busyId === demo._id}
                disabled={declineReason.trim().length < 10}
                onClick={() => void act(demo._id, { action: 'DECLINE', reason: declineReason })}
              >
                Decline
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setDecliningId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {evaluatingId === demo._id && (
          <EvaluationForm
            demo={demo}
            onDone={() => {
              setEvaluatingId(null);
              void load();
            }}
          />
        )}
      </Card>
    );
  }

  return (
    <Page width="focus">
      <PageHeader
        title="Demonstrations"
        description="Students showing you their systems running. Read their report before the session — the link is on each one."
      />

      {error && <Alert tone="danger">{error}</Alert>}

      {demos.length === 0 ? (
        <EmptyState
          title="Nothing booked"
          description="Students book these once you have accepted their report and offered some times. Nothing is required of you until then."
          action={{ label: 'Offer times', href: '/dashboard/lecturer/availability' }}
        />
      ) : (
        <div className="space-y-8">
          {requested.length > 0 && (
            <section className="space-y-3">
              <p className="app-label text-app-muted">
                Waiting on you ({requested.length})
              </p>
              {requested.map((d) => (
                <Row key={d._id} demo={d} />
              ))}
            </section>
          )}

          {scheduled.length > 0 && (
            <section className="space-y-3">
              <p className="app-label text-app-muted">Coming up ({scheduled.length})</p>
              {scheduled.map((d) => (
                <Row key={d._id} demo={d} />
              ))}
            </section>
          )}

          {held.length > 0 && (
            <section className="space-y-3">
              <p className="app-label text-app-muted">
                Held — not yet written up ({held.length})
              </p>
              {held.map((d) => (
                <Row key={d._id} demo={d} />
              ))}
            </section>
          )}
        </div>
      )}
    </Page>
  );
}
