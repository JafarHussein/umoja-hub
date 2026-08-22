'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Textarea } from '@/components/app';
import { cn } from '@/lib/cn';
import { SectionRequirement, DOCUMENTATION_CHECKLIST_LABEL } from '@/types';
import type { DocumentationChecklistItem } from '@/types';
import { REPORT_SECTIONS, PART_LABEL } from '@/lib/education/reportStandard';
import { describeDocumentProblem, DOCUMENT_MIME_TYPE, formatBytes } from '@/lib/uploads';

// ---------------------------------------------------------------------------
// Where a student hands in their project report.
//
// They write it in whatever they normally write in — Word, LaTeX, Docs — and
// upload the finished PDF. UmojaHub is not a document editor: a student's
// report has to be printable, submittable to their department and readable
// years later, and none of that survives being locked inside a web form.
//
// What the platform owes them instead is on this screen. The standard they are
// writing against, section by section, so that "System architecture" is not a
// guess. The upload itself. And the history — every version they have handed
// in, and exactly what their lecturer said about each one, because a revision
// nobody can read the reason for is a revision made blind.
// ---------------------------------------------------------------------------

export interface IDocumentationReview {
  outcome: string;
  scores: {
    problemUnderstanding: number;
    solutionQuality: number;
    processQuality: number;
    aiUsage: number;
  };
  summary: string;
  strengths?: string;
  concerns?: string;
  requiredChanges?: string;
  questionsForDemonstration?: string;
  pageNotes: Array<{ page: number; comment: string }>;
  checklist: Array<{ item: string; met: boolean; note?: string }>;
  reviewedAt: string;
}

export interface IDocumentationVersion {
  _id: string;
  versionNumber: number;
  fileName: string;
  bytes: number;
  pageCount?: number;
  submittedAt: string;
  studentNote?: string;
  status: string;
  review?: IDocumentationReview;
}

export interface IDocumentation {
  _id: string;
  engagementId: string;
  stage: string;
  canSubmit: boolean;
  blockedReason?: string;
  versions: IDocumentationVersion[];
}

const STAGE_LABEL: Record<string, string> = {
  NOT_SUBMITTED: 'Not handed in yet',
  WITH_LECTURER: 'With your lecturer',
  CHANGES_REQUESTED: 'Changes requested',
  READY_FOR_DEMONSTRATION: 'Accepted',
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ReportWorkspace({
  engagementId,
  documentation,
  onChange,
}: {
  engagementId: string;
  documentation: IDocumentation;
  onChange: (next: IDocumentation) => void;
}): React.ReactElement {
  const [file, setFile] = useState<File | null>(null);
  const [studentNote, setStudentNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [standardOpen, setStandardOpen] = useState(documentation.versions.length === 0);
  const fileInput = useRef<HTMLInputElement>(null);

  const isRevision = documentation.versions.length > 0;

  const parts = useMemo(() => {
    const grouped = new Map<string, typeof REPORT_SECTIONS>();
    for (const spec of REPORT_SECTIONS) {
      const existing = grouped.get(spec.part);
      if (existing) existing.push(spec);
      else grouped.set(spec.part, [spec]);
    }
    return [...grouped.entries()];
  }, []);

  function chooseFile(chosen: File | null): void {
    setProblem(chosen ? describeDocumentProblem(chosen) : null);
    setFile(chosen);
  }

  async function upload(): Promise<void> {
    if (!file) {
      setProblem('Choose the PDF of your report.');
      return;
    }
    const localProblem = describeDocumentProblem(file);
    if (localProblem) {
      setProblem(localProblem);
      return;
    }
    if (isRevision && studentNote.trim().length < 10) {
      setProblem('Say what changed in this version — your lecturer is reading it against the last.');
      return;
    }

    setUploading(true);
    setProblem(null);
    try {
      const form = new FormData();
      form.append('file', file);
      if (studentNote.trim()) form.append('studentNote', studentNote.trim());

      const res = await fetch(`/api/education/engagements/${engagementId}/report`, {
        method: 'POST',
        body: form,
      });
      const body = (await res.json()) as { data?: IDocumentation; error?: string };

      if (!res.ok || !body.data) {
        setProblem(body.error ?? 'Your report could not be uploaded. Try again.');
        return;
      }

      onChange(body.data);
      setFile(null);
      setStudentNote('');
      if (fileInput.current) fileInput.current.value = '';
    } catch {
      setProblem('Network error. Your report was not uploaded.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="app-title-sm text-app-ink">Your project report</h2>
          <span className="app-body-sm text-app-muted">
            {STAGE_LABEL[documentation.stage] ?? 'Not handed in yet'}
          </span>
        </div>

        {documentation.canSubmit ? (
          <div className="mt-4 space-y-4">
            <p className="app-body text-app-muted">
              Write your report against the standard below, export it to PDF, and upload it here.
              Your lecturer reads the file exactly as you wrote it.
            </p>

            <div>
              <label
                htmlFor="report-file"
                className="app-body-strong block text-app-ink"
              >
                {isRevision ? 'The new version' : 'Your report'} (PDF)
              </label>
              <input
                ref={fileInput}
                id="report-file"
                type="file"
                accept={DOCUMENT_MIME_TYPE}
                onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
                className="app-body mt-1.5 block w-full text-app-ink file:mr-3 file:rounded-app-control file:border-0 file:bg-app-sunken file:px-3 file:py-1.5 file:text-app-ink"
              />
              {file && !problem && (
                <p className="app-body-sm mt-1.5 text-app-muted">
                  {file.name} — {formatBytes(file.size)}
                </p>
              )}
            </div>

            {isRevision && (
              <div>
                <label htmlFor="report-note" className="app-body-strong block text-app-ink">
                  What changed in this version
                </label>
                <p className="app-body-sm mt-0.5 text-app-muted">
                  Your lecturer is reading this against the version they sent back.
                </p>
                <Textarea
                  id="report-note"
                  rows={3}
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                  placeholder="Rewrote the architecture section around the actual services, added the test results table, replaced the placeholder screenshots."
                  className="mt-1.5"
                />
              </div>
            )}

            {problem && <Alert tone="danger">{problem}</Alert>}

            <Button onClick={() => void upload()} disabled={uploading || !file}>
              {uploading ? 'Uploading…' : isRevision ? 'Upload new version' : 'Submit your report'}
            </Button>
          </div>
        ) : (
          <Alert tone="info" className="mt-4">
            {documentation.blockedReason ?? 'Your report is not open for a new version right now.'}
          </Alert>
        )}
      </Card>

      {/* The standard. Long, so it collapses once they have handed something in. */}
      <Card>
        <button
          type="button"
          onClick={() => setStandardOpen((open) => !open)}
          className="flex w-full items-baseline justify-between gap-3 text-left"
          aria-expanded={standardOpen}
        >
          <span className="app-title-sm text-app-ink">What your report must contain</span>
          <span className="app-body-sm text-app-muted">{standardOpen ? 'Hide' : 'Show'}</span>
        </button>

        {standardOpen && (
          <div className="mt-4 space-y-6">
            <p className="app-body text-app-muted">
              Twenty-five sections. Twenty-one are required; four are needed only when they apply
              to your project. A section that describes a textbook rather than your system does not
              count as written — every claim here is about what you built.
            </p>

            {parts.map(([part, specs]) => (
              <div key={part} className="space-y-3">
                <h3 className="app-body-strong text-app-ink">
                  {PART_LABEL[part as keyof typeof PART_LABEL] ?? part}
                </h3>
                {specs.map((spec) => (
                  <div
                    key={spec.key}
                    className="rounded-app-card border border-app-hairline p-3"
                  >
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="app-body-strong text-app-ink">
                        {spec.number}. {spec.label}
                      </span>
                      {spec.requirement === SectionRequirement.CONDITIONAL && (
                        <span className="app-body-sm text-app-muted">
                          only if {spec.condition}
                        </span>
                      )}
                      <span className="app-body-sm ml-auto text-app-muted">
                        {spec.minWords}–{spec.maxWords} words
                      </span>
                    </div>
                    <p className="app-body-sm mt-1 text-app-muted">{spec.purpose}</p>
                    <ul className="mt-2 space-y-1">
                      {spec.guidance.map((line) => (
                        <li key={line} className="app-body-sm text-app-ink">
                          — {line}
                        </li>
                      ))}
                    </ul>
                    {spec.avoid && spec.avoid.length > 0 && (
                      <p className="app-body-sm mt-2 text-app-muted">
                        Avoid: {spec.avoid.join('; ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>

      {documentation.versions.length > 0 && (
        <Card>
          <h2 className="app-title-sm text-app-ink">What you have handed in</h2>
          <div className="mt-4 space-y-4">
            {documentation.versions.map((version) => (
              <VersionCard
                key={version._id}
                engagementId={engagementId}
                version={version}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function VersionCard({
  engagementId,
  version,
}: {
  engagementId: string;
  version: IDocumentationVersion;
}): React.ReactElement {
  const review = version.review;

  return (
    <div className="rounded-app-card border border-app-hairline p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="app-body-strong text-app-ink">Version {version.versionNumber}</span>
        <span className="app-body-sm text-app-muted">
          {formatDate(version.submittedAt)} · {formatBytes(version.bytes)}
          {version.pageCount ? ` · ${version.pageCount} pages` : ''}
        </span>
      </div>

      <a
        href={`/api/education/engagements/${engagementId}/report/file/${version._id}`}
        target="_blank"
        rel="noreferrer"
        className="app-body-sm mt-1 inline-block text-app-brand underline"
      >
        {version.fileName}
      </a>

      {version.studentNote && (
        <p className="app-body-sm mt-2 text-app-muted">What changed: {version.studentNote}</p>
      )}

      {review ? (
        <div className="mt-3 space-y-3 border-t border-app-hairline pt-3">
          <p className="app-body-strong text-app-ink">{review.summary}</p>

          {review.strengths && (
            <p className="app-body-sm text-app-ink">
              <span className="text-app-muted">What worked: </span>
              {review.strengths}
            </p>
          )}
          {review.concerns && (
            <p className="app-body-sm text-app-ink">
              <span className="text-app-muted">Concerns: </span>
              {review.concerns}
            </p>
          )}
          {review.requiredChanges && (
            <p className="app-body-sm text-app-ink">
              <span className="text-app-muted">What has to change: </span>
              {review.requiredChanges}
            </p>
          )}
          {review.questionsForDemonstration && (
            <p className="app-body-sm text-app-ink">
              <span className="text-app-muted">Be ready to answer: </span>
              {review.questionsForDemonstration}
            </p>
          )}

          {review.pageNotes.length > 0 && (
            <div>
              <p className="app-body-sm text-app-muted">Notes on the document</p>
              <ul className="mt-1 space-y-1">
                {review.pageNotes.map((note) => (
                  <li key={`${note.page}-${note.comment}`} className="app-body-sm text-app-ink">
                    p.{note.page} — {note.comment}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.checklist.length > 0 && (
            <div>
              <p className="app-body-sm text-app-muted">Against the standard</p>
              <ul className="mt-1 space-y-1">
                {review.checklist.map((entry) => (
                  <li
                    key={entry.item}
                    className={cn(
                      'app-body-sm',
                      entry.met ? 'text-app-muted' : 'text-app-ink'
                    )}
                  >
                    {entry.met ? '✓' : '✗'}{' '}
                    {DOCUMENTATION_CHECKLIST_LABEL[entry.item as DocumentationChecklistItem] ??
                      entry.item}
                    {entry.note ? ` — ${entry.note}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="app-body-sm mt-2 text-app-muted">
          Not read yet. Your lecturer will either accept it or tell you what to change.
        </p>
      )}
    </div>
  );
}
