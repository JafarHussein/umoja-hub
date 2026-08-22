import {
  latestVersion,
  nextVersionNumber,
  submissionRejection,
  requiresStudentNote,
  documentationStage,
  statusForOutcome,
  checklistCoverage,
} from '../report';
import type { SubmissionVersionLike } from '../report';
import { REPORT_SECTIONS, REPORT_SECTION_BY_KEY } from '../reportStandard';
import {
  SubmissionStatus,
  DocumentationOutcome,
  SectionRequirement,
  DOCUMENTATION_CHECKLIST,
  DOCUMENTATION_CHECKLIST_LABEL,
  DOCUMENTATION_CHECKLIST_SECTION,
} from '@/types';

// ---------------------------------------------------------------------------
// The rules a submitted report obeys, and the standard it is written against.
//
// Nothing here judges a report — the platform receives a PDF it does not read,
// and the assessment is the lecturer's. What is tested is whose turn it is,
// which version counts, and that the standard the student writes against is the
// same one the lecturer's checklist is built from.
// ---------------------------------------------------------------------------

function version(overrides: Partial<SubmissionVersionLike> = {}): SubmissionVersionLike {
  return {
    versionNumber: 1,
    status: SubmissionStatus.SUBMITTED,
    submittedAt: new Date('2026-09-01T09:00:00Z'),
    ...overrides,
  };
}

describe('latestVersion', () => {
  it('has no answer before anything is handed in', () => {
    expect(latestVersion([])).toBeNull();
  });

  // By version number, not array position: the history is append-only, but
  // reading order belongs to the caller's query and the answer must not depend
  // on it.
  it('finds the newest version whatever order they arrive in', () => {
    const versions = [
      version({ versionNumber: 2 }),
      version({ versionNumber: 3 }),
      version({ versionNumber: 1 }),
    ];
    expect(latestVersion(versions)?.versionNumber).toBe(3);
  });

  it('numbers the next version after the newest', () => {
    expect(nextVersionNumber([])).toBe(1);
    expect(nextVersionNumber([version({ versionNumber: 1 }), version({ versionNumber: 2 })])).toBe(
      3
    );
  });
});

describe('submissionRejection', () => {
  it('lets a student hand in for the first time', () => {
    expect(submissionRejection([])).toBeNull();
  });

  // Replacing the document while a lecturer is reading it leaves their feedback
  // pointing at pages that no longer say what they said.
  it('refuses a new version while the lecturer is reading', () => {
    expect(submissionRejection([version({ status: SubmissionStatus.SUBMITTED })])).toBe(
      'ALREADY_WITH_LECTURER'
    );
  });

  it('lets a student answer a report that was sent back', () => {
    expect(
      submissionRejection([version({ status: SubmissionStatus.REVISION_REQUESTED })])
    ).toBeNull();
  });

  // The assessment has moved on to the demonstration. A version arriving now
  // would change what was accepted after the fact.
  it('refuses a new version once the report is accepted', () => {
    expect(
      submissionRejection([version({ status: SubmissionStatus.READY_FOR_DEMONSTRATION })])
    ).toBe('ALREADY_ACCEPTED');
  });

  // The rule is about the newest version only. An older one is history.
  it('reads the newest version, not the first', () => {
    expect(
      submissionRejection([
        version({ versionNumber: 1, status: SubmissionStatus.SUPERSEDED }),
        version({ versionNumber: 2, status: SubmissionStatus.REVISION_REQUESTED }),
      ])
    ).toBeNull();
  });
});

describe('requiresStudentNote', () => {
  it('asks nothing of a first submission', () => {
    expect(requiresStudentNote([])).toBe(false);
  });

  // A second version with no word about what changed makes a lecturer diff two
  // PDFs by eye.
  it('asks what changed on every version after the first', () => {
    expect(requiresStudentNote([version({ status: SubmissionStatus.REVISION_REQUESTED })])).toBe(
      true
    );
  });
});

describe('documentationStage', () => {
  it('reports nothing handed in', () => {
    expect(documentationStage([])).toBe('NOT_SUBMITTED');
  });

  it('reports the report as being with the lecturer', () => {
    expect(documentationStage([version({ status: SubmissionStatus.SUBMITTED })])).toBe(
      'WITH_LECTURER'
    );
  });

  it('reports a report that was sent back', () => {
    expect(documentationStage([version({ status: SubmissionStatus.REVISION_REQUESTED })])).toBe(
      'CHANGES_REQUESTED'
    );
  });

  it('reports an accepted report', () => {
    expect(
      documentationStage([version({ status: SubmissionStatus.READY_FOR_DEMONSTRATION })])
    ).toBe('READY_FOR_DEMONSTRATION');
  });
});

describe('statusForOutcome', () => {
  it('accepts a report for demonstration', () => {
    expect(statusForOutcome(DocumentationOutcome.READY_FOR_DEMONSTRATION)).toBe(
      SubmissionStatus.READY_FOR_DEMONSTRATION
    );
  });

  it('sends a report back', () => {
    expect(statusForOutcome(DocumentationOutcome.REVISION_REQUESTED)).toBe(
      SubmissionStatus.REVISION_REQUESTED
    );
  });
});

describe('checklistCoverage', () => {
  it('reports everything outstanding when nothing was answered', () => {
    const coverage = checklistCoverage([]);
    expect(coverage.answered).toBe(0);
    expect(coverage.total).toBe(DOCUMENTATION_CHECKLIST.length);
    expect(coverage.missing).toHaveLength(DOCUMENTATION_CHECKLIST.length);
  });

  it('counts what the lecturer answered', () => {
    const coverage = checklistCoverage([
      { item: 'problemDefined' },
      { item: 'objectivesPresent' },
    ]);
    expect(coverage.answered).toBe(2);
    expect(coverage.missing).not.toContain('problemDefined');
  });
});

describe('the standard itself', () => {
  it('numbers every section once, in order', () => {
    const numbers = REPORT_SECTIONS.map((s) => s.number);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  // "Conditional" is not "optional if busy" — it is required whenever its
  // stated condition holds, and a lecturer deciding needs to be told which.
  it('gives every conditional section the condition that makes it required', () => {
    const conditional = REPORT_SECTIONS.filter(
      (s) => s.requirement === SectionRequirement.CONDITIONAL
    );
    expect(conditional.length).toBeGreaterThan(0);
    for (const spec of conditional) {
      expect(spec.condition && spec.condition.length > 0).toBe(true);
    }
  });

  it('gives every section guidance to write against', () => {
    for (const spec of REPORT_SECTIONS) {
      expect(spec.guidance.length).toBeGreaterThan(0);
      expect(spec.purpose.length).toBeGreaterThan(0);
    }
  });

  // The lecturer's checklist is taken from the standard rather than invented
  // beside it, so what a lecturer is asked to look for is exactly what the
  // student was told to write.
  it('points every checklist item at a section of the standard', () => {
    for (const item of DOCUMENTATION_CHECKLIST) {
      expect(DOCUMENTATION_CHECKLIST_LABEL[item]).toBeTruthy();
      const sectionKey = DOCUMENTATION_CHECKLIST_SECTION[item];
      expect(REPORT_SECTION_BY_KEY[sectionKey]).toBeDefined();
    }
  });
});
