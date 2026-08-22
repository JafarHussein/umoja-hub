import { SubmissionStatus, DocumentationOutcome, DOCUMENTATION_CHECKLIST } from '@/types';

// ---------------------------------------------------------------------------
// The rules a submitted report has to obey.
//
// The student writes their report in whatever they normally use and uploads the
// finished PDF. Nothing in this file reads that PDF, and nothing in it judges
// one: the platform cannot assess a document it does not parse, and pretending
// otherwise would put a green tick on work no academic had looked at.
//
// What is left is the part a platform *is* good at — whose turn it is, which
// version is current, and what may happen next — kept here rather than in the
// routes so the student's screen and the API cannot disagree about it.
// ---------------------------------------------------------------------------

export interface SubmissionVersionLike {
  versionNumber: number;
  status: string;
  submittedAt?: Date | string;
  review?: { outcome?: string } | null;
}

/**
 * The version that counts.
 *
 * By version number rather than array position: the history is append-only, but
 * reading order is a property of the caller's query and the answer must not
 * depend on it.
 */
export function latestVersion<T extends SubmissionVersionLike>(versions: T[]): T | null {
  if (versions.length === 0) return null;
  return versions.reduce((best, v) => (v.versionNumber > best.versionNumber ? v : best));
}

export function nextVersionNumber(versions: SubmissionVersionLike[]): number {
  const latest = latestVersion(versions);
  return (latest?.versionNumber ?? 0) + 1;
}

export type SubmissionRejection = 'ALREADY_WITH_LECTURER' | 'ALREADY_ACCEPTED';

/**
 * Why a new version cannot be uploaded, or null when it can.
 *
 * A report already with a lecturer is refused for the same reason an edit used
 * to be: replacing the document while somebody is reading it leaves their
 * feedback pointing at pages that no longer say what they said. A report
 * already accepted is refused because the assessment has moved on to the
 * demonstration, and a version arriving afterwards would change what was
 * accepted after the fact.
 */
export function submissionRejection(
  versions: SubmissionVersionLike[]
): SubmissionRejection | null {
  const latest = latestVersion(versions);
  if (!latest) return null;
  if (latest.status === SubmissionStatus.SUBMITTED) return 'ALREADY_WITH_LECTURER';
  if (latest.status === SubmissionStatus.READY_FOR_DEMONSTRATION) return 'ALREADY_ACCEPTED';
  return null;
}

export const SUBMISSION_REJECTION_MESSAGE: Record<SubmissionRejection, string> = {
  ALREADY_WITH_LECTURER:
    'Your report is with your lecturer. You can upload a new version if they ask for changes.',
  ALREADY_ACCEPTED:
    'Your report has been accepted. The next step is your demonstration, not another version.',
};

/**
 * Whether this upload is answering feedback.
 *
 * A second version with no word about what changed makes a lecturer diff two
 * PDFs by eye to find out. A first version has nothing to answer, so nothing is
 * demanded of it.
 */
export function requiresStudentNote(versions: SubmissionVersionLike[]): boolean {
  return latestVersion(versions) !== null;
}

export type DocumentationStage =
  | 'NOT_SUBMITTED'
  | 'WITH_LECTURER'
  | 'CHANGES_REQUESTED'
  | 'READY_FOR_DEMONSTRATION';

/** Where the report stands, as one value the screens can switch on. */
export function documentationStage(versions: SubmissionVersionLike[]): DocumentationStage {
  const latest = latestVersion(versions);
  if (!latest) return 'NOT_SUBMITTED';
  switch (latest.status) {
    case SubmissionStatus.SUBMITTED:
      return 'WITH_LECTURER';
    case SubmissionStatus.REVISION_REQUESTED:
      return 'CHANGES_REQUESTED';
    case SubmissionStatus.READY_FOR_DEMONSTRATION:
      return 'READY_FOR_DEMONSTRATION';
    default:
      // A superseded latest version cannot happen — superseding is what makes
      // a version not the latest — but the screens must still render if it
      // ever does, and "not submitted" is the safe reading.
      return 'NOT_SUBMITTED';
  }
}

/**
 * The status a version takes when the lecturer's decision lands on it.
 *
 * One place, because the version's status and the engagement's status are set
 * by two different writes and a workflow whose two halves disagree about
 * whether a report was accepted is worse than one that is simply wrong.
 */
export function statusForOutcome(outcome: string): SubmissionStatus {
  return outcome === DocumentationOutcome.READY_FOR_DEMONSTRATION
    ? SubmissionStatus.READY_FOR_DEMONSTRATION
    : SubmissionStatus.REVISION_REQUESTED;
}

/**
 * Whether the lecturer answered every checklist item.
 *
 * Not enforced at submission — a lecturer who has read a report and written a
 * summary has done the work, and refusing their decision over an unticked box
 * would teach them to tick boxes. It is used to tell them what they have left
 * blank, which is a different thing from refusing them.
 */
export function checklistCoverage(entries: Array<{ item: string }>): {
  answered: number;
  total: number;
  missing: string[];
} {
  const answered = new Set(entries.map((e) => e.item));
  const missing = DOCUMENTATION_CHECKLIST.filter((item) => !answered.has(item));
  return {
    answered: DOCUMENTATION_CHECKLIST.length - missing.length,
    total: DOCUMENTATION_CHECKLIST.length,
    missing,
  };
}
