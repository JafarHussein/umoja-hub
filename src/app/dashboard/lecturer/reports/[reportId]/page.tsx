'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Alert, Button, Card, Page, Select, Input, Textarea } from '@/components/app';
import { cn } from '@/lib/cn';
import {
  Role,
  REVIEW_MIN_WORD_COUNT,
  DOCUMENTATION_CHECKLIST,
  DOCUMENTATION_CHECKLIST_LABEL,
  DocumentationOutcome,
} from '@/types';
import type { DocumentationChecklistItem } from '@/types';
import { loginUrlWithIntent } from '@/lib/auth/intent';
import type { IDocumentation } from '@/components/education/ReportWorkspace';

// ---------------------------------------------------------------------------
// Reading one student's report, and deciding on it.
//
// The submitted PDF on the left, exactly as the student wrote it, and the
// review beside it. Reading and judging happen on one screen because a lecturer
// who has to switch away to record what they noticed records less of it.
//
// Two instruments, and they ask different questions. The **checklist** asks
// whether the report contains what the standard asks for — the structural
// question the platform used to answer for itself, and cannot answer about a
// document it does not read. The **scores** ask how good what is there is.
//
// A lecturer sending a report back must say what has to change, or leave a note
// on the page it is on. "Needs work" is not something a student can act on, and
// the API refuses it as well as this screen.
// ---------------------------------------------------------------------------

interface IBlocker {
  stuckOn: string;
  resolution: string;
  durationHours: number;
  loggedAt: string;
}

interface IAiUsage {
  toolUsed: string;
  prompt: string;
  outputReceived: string;
  studentAction: string;
  loggedAt: string;
}

interface IReportData {
  documentation: IDocumentation;
  engagement: {
    _id: string;
    brief?: { title?: string; academicAnchor?: { year?: number; units?: string[] } };
    track?: string;
    status?: string;
    revisionNumber?: number;
    githubRepoUrl?: string;
    githubRepoName?: string;
    interest?: string;
    industryName?: string;
    blockerLog: IBlocker[];
    aiUsageLog: IAiUsage[];
  } | null;
  student: { name: string; email: string } | null;
}

type PageState = 'loading' | 'ready' | 'error' | 'unverified';

const SCORE_DIMENSIONS = [
  { key: 'problemUnderstanding', label: 'Problem understanding' },
  { key: 'solutionQuality', label: 'Solution quality' },
  { key: 'processQuality', label: 'Process quality' },
  { key: 'aiUsage', label: 'AI use' },
] as const;

type ScoreKey = (typeof SCORE_DIMENSIONS)[number]['key'];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function LecturerReportReviewPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ reportId: string }>();

  const [data, setData] = useState<IReportData | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');

  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    problemUnderstanding: 3,
    solutionQuality: 3,
    processQuality: 3,
    aiUsage: 3,
  });
  const [summary, setSummary] = useState('');
  const [strengths, setStrengths] = useState('');
  const [concerns, setConcerns] = useState('');
  const [requiredChanges, setRequiredChanges] = useState('');
  const [questions, setQuestions] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [pageNotes, setPageNotes] = useState<Array<{ page: string; comment: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/lecturer/reports/${params.reportId}`);
      if (res.status === 403) {
        setPageState('unverified');
        return;
      }
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: IReportData };
      setData(body.data);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, [params.reportId]);

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

  const current = useMemo(() => {
    const versions = data?.documentation.versions ?? [];
    return versions.length > 0 ? versions[0] : null;
  }, [data]);

  const summaryWords = countWords(summary);
  const summaryReady = summaryWords >= REVIEW_MIN_WORD_COUNT;
  const namedSomething =
    requiredChanges.trim().length > 0 ||
    pageNotes.some((n) => n.page.trim() !== '' && n.comment.trim().length >= 5);

  async function decide(outcome: DocumentationOutcome): Promise<void> {
    if (!data || !current) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/lecturer/reports/${params.reportId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome,
          scores,
          summary: summary.trim(),
          ...(strengths.trim() ? { strengths: strengths.trim() } : {}),
          ...(concerns.trim() ? { concerns: concerns.trim() } : {}),
          ...(requiredChanges.trim() ? { requiredChanges: requiredChanges.trim() } : {}),
          ...(questions.trim() ? { questionsForDemonstration: questions.trim() } : {}),
          pageNotes: pageNotes
            .filter((n) => n.page.trim() !== '' && n.comment.trim().length >= 5)
            .map((n) => ({ page: Number(n.page), comment: n.comment.trim() })),
          checklist: DOCUMENTATION_CHECKLIST.filter((item) => item in checklist).map((item) => ({
            item,
            met: checklist[item] === true,
          })),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSubmitError(body.error ?? 'Your decision was not recorded.');
        return;
      }
      router.push('/dashboard/lecturer/reports');
    } catch {
      setSubmitError('Network error. Your decision was not recorded.');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading' || pageState === 'loading') {
    return (
      <Page width="wide">
        <div className="skeleton h-8 w-72 rounded" />
        <div className="skeleton h-[32rem] rounded-app-card" />
      </Page>
    );
  }

  if (pageState === 'unverified') {
    return (
      <Page width="focus">
        <Alert tone="warning">
          Your lecturer credentials have not been verified yet, so you cannot read student reports.
        </Alert>
      </Page>
    );
  }

  if (pageState === 'error' || !data || !current) {
    return (
      <Page width="focus">
        <Alert tone="danger">Could not load this report. It may have been withdrawn.</Alert>
        <Link href="/dashboard/lecturer/reports" className="app-body text-app-brand underline">
          Back to your queue
        </Link>
      </Page>
    );
  }

  const title = data.engagement?.brief?.title ?? 'Untitled project';
  const fileUrl = `/api/education/engagements/${data.documentation.engagementId}/report/file/${current._id}`;

  return (
    <Page width="wide">
      <div>
        <Link
          href="/dashboard/lecturer/reports"
          className="app-meta text-app-muted hover:text-app-ink"
        >
          ← Reports to review
        </Link>
        <h1 className="app-title mt-1 text-app-ink">{title}</h1>
        <p className="app-meta mt-0.5 text-app-muted">
          {data.student?.name ?? 'A student'}
          {data.engagement?.brief?.academicAnchor?.year
            ? ` · Year ${data.engagement.brief.academicAnchor.year}`
            : ''}
          {' · '}Version {current.versionNumber}
          {current.pageCount ? ` · ${current.pageCount} pages` : ''}
        </p>
      </div>

      {current.studentNote && (
        <Alert tone="info">What the student says changed: {current.studentNote}</Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* The report itself. */}
        <div className="space-y-3 lg:col-span-7">
          <object
            data={fileUrl}
            type="application/pdf"
            className="h-[46rem] w-full rounded-app-card border border-app-hairline"
            aria-label={`${title} — submitted report`}
          >
            <div className="p-6">
              <p className="app-body text-app-muted">
                Your browser will not display the PDF inline.
              </p>
              <a href={fileUrl} className="app-body text-app-brand underline">
                Open {current.fileName}
              </a>
            </div>
          </object>
          <a href={fileUrl} target="_blank" rel="noreferrer" className="app-meta text-app-brand underline">
            Open {current.fileName} in a new tab
          </a>

          {data.engagement && data.engagement.blockerLog.length > 0 && (
            <Card>
              <p className="app-body-strong text-app-ink">What they got stuck on</p>
              <ul className="mt-2 space-y-2">
                {data.engagement.blockerLog.map((b, i) => (
                  <li key={i} className="app-body-sm text-app-ink">
                    <span className="text-app-muted">{b.durationHours}h — </span>
                    {b.stuckOn} → {b.resolution}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {data.engagement && data.engagement.aiUsageLog.length > 0 && (
            <Card>
              <p className="app-body-strong text-app-ink">How they used AI</p>
              <ul className="mt-2 space-y-2">
                {data.engagement.aiUsageLog.map((a, i) => (
                  <li key={i} className="app-body-sm text-app-ink">
                    <span className="text-app-muted">{a.toolUsed} — </span>
                    {a.prompt}
                    <span className="text-app-muted"> → {a.studentAction}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* The review. */}
        <div className="space-y-4 lg:col-span-5">
          <Card>
            <p className="app-body-strong text-app-ink">Against the standard</p>
            <p className="app-body-sm mt-0.5 text-app-muted">
              Does the report contain what the student was told to write? Leave anything you did
              not check unticked — this is a record, not a form to complete.
            </p>
            <ul className="mt-3 space-y-1.5">
              {DOCUMENTATION_CHECKLIST.map((item) => (
                <li key={item}>
                  <label className="app-body-sm flex items-start gap-2 text-app-ink">
                    <input
                      type="checkbox"
                      checked={checklist[item] === true}
                      onChange={(e) =>
                        setChecklist((prev) => ({ ...prev, [item]: e.target.checked }))
                      }
                      className="mt-1"
                    />
                    {DOCUMENTATION_CHECKLIST_LABEL[item as DocumentationChecklistItem]}
                  </label>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <p className="app-body-strong text-app-ink">How good is it</p>
            <div className="mt-3 space-y-3">
              {SCORE_DIMENSIONS.map((dim) => (
                <div key={dim.key} className="flex items-center justify-between gap-3">
                  <label htmlFor={`score-${dim.key}`} className="app-body-sm text-app-ink">
                    {dim.label}
                  </label>
                  <Select
                    id={`score-${dim.key}`}
                    value={String(scores[dim.key])}
                    onChange={(e) =>
                      setScores((prev) => ({ ...prev, [dim.key]: Number(e.target.value) }))
                    }
                    className="w-20"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <label htmlFor="summary" className="app-body-strong block text-app-ink">
              What the student should take away
            </label>
            <Textarea
              id="summary"
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="mt-1.5"
            />
            <p
              className={cn(
                'app-meta mt-1',
                summaryReady ? 'text-app-muted' : 'text-app-warning'
              )}
            >
              {summaryWords}/{REVIEW_MIN_WORD_COUNT} words
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="strengths" className="app-body-sm block text-app-muted">
                  What worked (optional)
                </label>
                <Textarea
                  id="strengths"
                  rows={2}
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="concerns" className="app-body-sm block text-app-muted">
                  Concerns (optional)
                </label>
                <Textarea
                  id="concerns"
                  rows={2}
                  value={concerns}
                  onChange={(e) => setConcerns(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="required" className="app-body-sm block text-app-muted">
                  What has to change — required if you send it back
                </label>
                <Textarea
                  id="required"
                  rows={3}
                  value={requiredChanges}
                  onChange={(e) => setRequiredChanges(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="questions" className="app-body-sm block text-app-muted">
                  What you will ask at the demonstration (optional)
                </label>
                <Textarea
                  id="questions"
                  rows={2}
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-baseline justify-between gap-2">
              <p className="app-body-strong text-app-ink">Notes on the document</p>
              <Button
                variant="ghost"
                onClick={() => setPageNotes((prev) => [...prev, { page: '', comment: '' }])}
              >
                Add a note
              </Button>
            </div>
            <p className="app-body-sm mt-0.5 text-app-muted">
              A page number and what is on it — &ldquo;page 17, why MongoDB and not Postgres&rdquo;.
            </p>
            <div className="mt-3 space-y-2">
              {pageNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={note.page}
                    aria-label={`Page for note ${i + 1}`}
                    onChange={(e) =>
                      setPageNotes((prev) =>
                        prev.map((n, j) => (j === i ? { ...n, page: e.target.value } : n))
                      )
                    }
                    className="w-20"
                  />
                  <Textarea
                    rows={2}
                    value={note.comment}
                    aria-label={`Comment for note ${i + 1}`}
                    onChange={(e) =>
                      setPageNotes((prev) =>
                        prev.map((n, j) => (j === i ? { ...n, comment: e.target.value } : n))
                      )
                    }
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </Card>

          {submitError && <Alert tone="danger">{submitError}</Alert>}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => void decide(DocumentationOutcome.READY_FOR_DEMONSTRATION)}
              disabled={submitting || !summaryReady}
            >
              Accept — open their demonstration
            </Button>
            <Button
              variant="secondary"
              onClick={() => void decide(DocumentationOutcome.REVISION_REQUESTED)}
              disabled={submitting || !summaryReady || !namedSomething}
            >
              Send back for changes
            </Button>
          </div>
          {!namedSomething && summaryReady && (
            <p className="app-meta text-app-muted">
              To send it back, say what has to change or leave a note on a page. A student sent back
              with nothing named cannot tell where to start.
            </p>
          )}
        </div>
      </div>
    </Page>
  );
}
