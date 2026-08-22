import {
  briefRequestSchema,
  documentationSubmissionSchema,
  documentationReviewSchema,
  demonstrationSlotSchema,
  demonstrationRequestSchema,
  demonstrationEvaluationSchema,
  blockerLogEntrySchema,
  aiUsageLogEntrySchema,
  peerReviewSchema,
  lecturerReviewSchema,
} from '../educationSchema';
import { DemonstrationFormat, DemonstrationOutcome, DocumentationOutcome } from '@/types';

// ---------------------------------------------------------------------------
// briefRequestSchema
// ---------------------------------------------------------------------------

describe('briefRequestSchema', () => {
  it('accepts an AI_BRIEF track request', () => {
    expect(briefRequestSchema.safeParse({ track: 'AI_BRIEF' }).success).toBe(true);
  });

  it('accepts an OPEN_SOURCE track request with GitHub URL', () => {
    expect(
      briefRequestSchema.safeParse({
        track: 'OPEN_SOURCE',
        githubRepoUrl: 'https://github.com/some/repo',
      }).success
    ).toBe(true);
  });

  it('accepts an optional engineering interest', () => {
    expect(
      briefRequestSchema.safeParse({ track: 'AI_BRIEF', interest: 'Information security' }).success
    ).toBe(true);
  });

  // The difficulty tier was the one project origin the Hub's premise forbids —
  // a student choosing for themselves how hard their work should be. A request
  // that still carries one is accepted and the field simply ignored, rather
  // than an old client being broken; nothing reads it.
  it('no longer has a difficulty tier to reject', () => {
    const parsed = briefRequestSchema.safeParse({ track: 'AI_BRIEF', tier: 'EXPERT' });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect('tier' in parsed.data).toBe(false);
  });

  it('rejects an interest too short to mean anything', () => {
    expect(briefRequestSchema.safeParse({ track: 'AI_BRIEF', interest: 'x' }).success).toBe(false);
  });

  it('rejects invalid track', () => {
    expect(briefRequestSchema.safeParse({ track: 'MANUAL' }).success).toBe(false);
  });

  it('rejects missing track', () => {
    expect(briefRequestSchema.safeParse({ interest: 'Backend systems' }).success).toBe(false);
  });

  it('rejects invalid GitHub URL', () => {
    expect(
      briefRequestSchema.safeParse({
        track: 'OPEN_SOURCE',
        githubRepoUrl: 'not-a-url',
      }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// The project report
// ---------------------------------------------------------------------------

describe('documentationSubmissionSchema', () => {
  it('accepts a first submission with no note', () => {
    expect(documentationSubmissionSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a note about what changed', () => {
    expect(
      documentationSubmissionSchema.safeParse({
        studentNote: 'Rewrote the architecture section around the services I actually built.',
      }).success
    ).toBe(true);
  });

  // Whether a note is *required* is the route's call, not the schema's: only
  // the route knows whether there is a previous version to answer.
  it('does not demand a note, because the schema cannot know if one is owed', () => {
    expect(documentationSubmissionSchema.safeParse({ studentNote: '' }).success).toBe(true);
  });
});

describe('documentationReviewSchema', () => {
  const scores = {
    problemUnderstanding: 4,
    solutionQuality: 4,
    processQuality: 3,
    aiUsage: 4,
  };
  // Fifty words, because that is what the schema asks of a lecturer sending a
  // student away with a decision.
  const summary =
    'The report holds together and the architecture section does the work it needs to do, particularly where you set out the alternative you rejected and what it would have cost you. The testing section is thinner than the rest and the results would carry more weight with the actual output beside them. Bring the synchronisation flow to your demonstration, and be ready to explain what happens when two devices disagree about the same record, because that is where I will push you hardest.';

  it('accepts an acceptance with nothing else named', () => {
    expect(
      documentationReviewSchema.safeParse({
        outcome: DocumentationOutcome.READY_FOR_DEMONSTRATION,
        scores,
        summary,
      }).success
    ).toBe(true);
  });

  // A student sent back with nothing named cannot tell where to start, so the
  // schema refuses it rather than leaving that to the interface.
  it('rejects a rejection that names nothing', () => {
    expect(
      documentationReviewSchema.safeParse({
        outcome: DocumentationOutcome.REVISION_REQUESTED,
        scores,
        summary,
      }).success
    ).toBe(false);
  });

  it('accepts a rejection that says what has to change', () => {
    expect(
      documentationReviewSchema.safeParse({
        outcome: DocumentationOutcome.REVISION_REQUESTED,
        scores,
        summary,
        requiredChanges: 'Rewrite the architecture section around what you actually built.',
      }).success
    ).toBe(true);
  });

  // A page note is the other way to name something. A lecturer reading a PDF
  // points at a page, which is what they would say out loud anyway.
  it('accepts a rejection that only leaves a page note', () => {
    expect(
      documentationReviewSchema.safeParse({
        outcome: DocumentationOutcome.REVISION_REQUESTED,
        scores,
        summary,
        pageNotes: [{ page: 14, comment: 'A test plan, not test results. What actually ran?' }],
      }).success
    ).toBe(true);
  });

  it('rejects a page note with no page', () => {
    expect(
      documentationReviewSchema.safeParse({
        outcome: DocumentationOutcome.REVISION_REQUESTED,
        scores,
        summary,
        pageNotes: [{ page: 0, comment: 'This is the textbook definition.' }],
      }).success
    ).toBe(false);
  });

  it('rejects a summary too short to act on', () => {
    expect(
      documentationReviewSchema.safeParse({
        outcome: DocumentationOutcome.READY_FOR_DEMONSTRATION,
        scores,
        summary: 'Good.',
      }).success
    ).toBe(false);
  });

  it('rejects a score outside the rubric', () => {
    expect(
      documentationReviewSchema.safeParse({
        outcome: DocumentationOutcome.READY_FOR_DEMONSTRATION,
        scores: { ...scores, solutionQuality: 9 },
        summary,
      }).success
    ).toBe(false);
  });

  it('rejects a checklist item the standard does not have', () => {
    expect(
      documentationReviewSchema.safeParse({
        outcome: DocumentationOutcome.READY_FOR_DEMONSTRATION,
        scores,
        summary,
        checklist: [{ item: 'wellFormatted', met: true }],
      }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Demonstrations
// ---------------------------------------------------------------------------

describe('demonstrationSlotSchema', () => {
  it('accepts a slot a lecturer would actually offer', () => {
    expect(
      demonstrationSlotSchema.safeParse({
        startsAt: '2026-09-14T10:00:00.000Z',
        durationMinutes: 45,
        format: DemonstrationFormat.VIDEO_CALL,
        location: 'https://meet.example.com/abc',
      }).success
    ).toBe(true);
  });

  // A demonstration is not a lecture and is not a two-minute look.
  it('rejects a slot shorter than the minimum', () => {
    expect(
      demonstrationSlotSchema.safeParse({
        startsAt: '2026-09-14T10:00:00.000Z',
        durationMinutes: 5,
        format: DemonstrationFormat.VIDEO_CALL,
      }).success
    ).toBe(false);
  });

  it('rejects a slot longer than the maximum', () => {
    expect(
      demonstrationSlotSchema.safeParse({
        startsAt: '2026-09-14T10:00:00.000Z',
        durationMinutes: 480,
        format: DemonstrationFormat.IN_PERSON,
      }).success
    ).toBe(false);
  });
});

describe('demonstrationRequestSchema', () => {
  const ids = {
    engagementId: '64a1b2c3d4e5f6a7b8c9d0e1',
    slotId: '64a1b2c3d4e5f6a7b8c9d0e2',
  };

  it('accepts a request that says what will be shown', () => {
    expect(
      demonstrationRequestSchema.safeParse({
        ...ids,
        studentNotes:
          'I will show offline capture, the reconnect draining the queue, and the reconciliation. The export is unfinished.',
      }).success
    ).toBe(true);
  });

  it('rejects a request that says nothing about what will be shown', () => {
    expect(demonstrationRequestSchema.safeParse({ ...ids, studentNotes: 'ready' }).success).toBe(
      false
    );
  });
});

describe('demonstrationEvaluationSchema', () => {
  const comment =
    'They walked through the ordering guarantee in their own code without hesitating, and named the case it does not cover.';
  const full = {
    scores: {
      problemUnderstanding: 4,
      systemFunctionality: 5,
      technicalDepth: 4,
      designJustification: 4,
      responseToQuestioning: 3,
      engineeringPractice: 4,
    },
    comments: {
      problemUnderstanding: comment,
      systemFunctionality: comment,
      technicalDepth: comment,
      designJustification: comment,
      responseToQuestioning: comment,
      engineeringPractice: comment,
    },
    outcome: DemonstrationOutcome.APPROVED,
  };

  it('accepts a complete evaluation', () => {
    expect(demonstrationEvaluationSchema.safeParse(full).success).toBe(true);
  });

  // A score with no reasoning behind it tells the student nothing they can act
  // on, which is the whole point of the demonstration.
  it('rejects an evaluation with a criterion left uncommented', () => {
    expect(
      demonstrationEvaluationSchema.safeParse({
        ...full,
        comments: { ...full.comments, technicalDepth: 'Fine' },
      }).success
    ).toBe(false);
  });

  it('rejects an evaluation missing a criterion entirely', () => {
    const { technicalDepth: _omitted, ...rest } = full.scores;
    expect(demonstrationEvaluationSchema.safeParse({ ...full, scores: rest }).success).toBe(false);
  });

  it('records a failure during the demonstration when there was one', () => {
    expect(
      demonstrationEvaluationSchema.safeParse({
        ...full,
        failureDuringDemonstration:
          'The deployed instance cold-started and the first request timed out; they diagnosed it and carried on.',
      }).success
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// blockerLogEntrySchema
// ---------------------------------------------------------------------------

describe('blockerLogEntrySchema', () => {
  const valid = {
    stuckOn: 'Cannot figure out how to authenticate the M-Pesa API request',
    resolution: 'Reviewed Daraja documentation and found the OAuth endpoint details',
    durationHours: 2.5,
  };

  it('accepts a valid blocker log entry', () => {
    expect(blockerLogEntrySchema.safeParse(valid).success).toBe(true);
  });

  it('rejects stuckOn shorter than 10 characters', () => {
    expect(
      blockerLogEntrySchema.safeParse({ ...valid, stuckOn: 'Bug' }).success
    ).toBe(false);
  });

  it('rejects resolution shorter than 10 characters', () => {
    expect(
      blockerLogEntrySchema.safeParse({ ...valid, resolution: 'Fixed it' }).success
    ).toBe(false);
  });

  it('rejects zero durationHours', () => {
    expect(
      blockerLogEntrySchema.safeParse({ ...valid, durationHours: 0 }).success
    ).toBe(false);
  });

  it('rejects negative durationHours', () => {
    expect(
      blockerLogEntrySchema.safeParse({ ...valid, durationHours: -1 }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// aiUsageLogEntrySchema
// ---------------------------------------------------------------------------

describe('aiUsageLogEntrySchema', () => {
  const valid = {
    toolUsed: 'AI Mentor',
    prompt: 'How should I approach designing the database schema for this project?',
    outputReceived: 'The AI Mentor suggested thinking about the entities and their relationships first.',
    studentAction: 'I drew an ER diagram based on the guidance and revised my approach plan.',
  };

  it('accepts a valid AI usage log entry', () => {
    expect(aiUsageLogEntrySchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty toolUsed', () => {
    expect(
      aiUsageLogEntrySchema.safeParse({ ...valid, toolUsed: '' }).success
    ).toBe(false);
  });

  it('rejects prompt shorter than 10 characters', () => {
    expect(
      aiUsageLogEntrySchema.safeParse({ ...valid, prompt: 'Help me' }).success
    ).toBe(false);
  });

  it('rejects outputReceived shorter than 10 characters', () => {
    expect(
      aiUsageLogEntrySchema.safeParse({ ...valid, outputReceived: 'Ok' }).success
    ).toBe(false);
  });

  it('rejects studentAction shorter than 10 characters', () => {
    expect(
      aiUsageLogEntrySchema.safeParse({ ...valid, studentAction: 'I did it' }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// peerReviewSchema
// ---------------------------------------------------------------------------

describe('peerReviewSchema', () => {
  const valid = {
    scores: {
      codeQuality: 4,
      documentationClarity: 3,
    },
    comments: {
      codeQuality: 'The code was well-structured and followed good practices.',
      documentationClarity: 'The documentation was clear but could use more examples.',
    },
  };

  it('accepts a valid peer review', () => {
    expect(peerReviewSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts min score of 1', () => {
    expect(
      peerReviewSchema.safeParse({
        ...valid,
        scores: { codeQuality: 1, documentationClarity: 1 },
      }).success
    ).toBe(true);
  });

  it('accepts max score of 5', () => {
    expect(
      peerReviewSchema.safeParse({
        ...valid,
        scores: { codeQuality: 5, documentationClarity: 5 },
      }).success
    ).toBe(true);
  });

  it('rejects score below 1', () => {
    expect(
      peerReviewSchema.safeParse({
        ...valid,
        scores: { codeQuality: 0, documentationClarity: 3 },
      }).success
    ).toBe(false);
  });

  it('rejects score above 5', () => {
    expect(
      peerReviewSchema.safeParse({
        ...valid,
        scores: { codeQuality: 6, documentationClarity: 3 },
      }).success
    ).toBe(false);
  });

  it('rejects non-integer score', () => {
    expect(
      peerReviewSchema.safeParse({
        ...valid,
        scores: { codeQuality: 3.5, documentationClarity: 3 },
      }).success
    ).toBe(false);
  });

  it('rejects empty code quality comment', () => {
    expect(
      peerReviewSchema.safeParse({
        ...valid,
        comments: { ...valid.comments, codeQuality: '' },
      }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// lecturerReviewSchema — 50-word minimum comment enforcement
// ---------------------------------------------------------------------------

describe('lecturerReviewSchema', () => {
  // Build a string of exactly N words
  const makeWords = (n: number): string =>
    Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

  const validComments = {
    problemUnderstanding: makeWords(50),
    solutionQuality: makeWords(50),
    processQuality: makeWords(50),
    aiUsage: makeWords(50),
  };

  const validScores = {
    problemUnderstanding: 4,
    solutionQuality: 3,
    processQuality: 4,
    aiUsage: 3,
  };

  it('accepts valid VERIFIED review with exactly 50-word comments', () => {
    const result = lecturerReviewSchema.safeParse({
      decision: 'VERIFIED',
      scores: validScores,
      comments: validComments,
    });
    expect(result.success).toBe(true);
  });

  it('accepts REVISION_REQUIRED decision', () => {
    expect(
      lecturerReviewSchema.safeParse({
        decision: 'REVISION_REQUIRED',
        scores: validScores,
        comments: validComments,
      }).success
    ).toBe(true);
  });

  it('accepts DENIED decision with rejectionReason', () => {
    expect(
      lecturerReviewSchema.safeParse({
        decision: 'DENIED',
        scores: validScores,
        comments: validComments,
        rejectionReason: 'Insufficient evidence of independent work.',
      }).success
    ).toBe(true);
  });

  it('rejects DENIED decision without rejectionReason', () => {
    expect(
      lecturerReviewSchema.safeParse({
        decision: 'DENIED',
        scores: validScores,
        comments: validComments,
      }).success
    ).toBe(false);
  });

  it('rejects comment with 49 words (below minimum)', () => {
    const result = lecturerReviewSchema.safeParse({
      decision: 'VERIFIED',
      scores: validScores,
      comments: { ...validComments, problemUnderstanding: makeWords(49) },
    });
    expect(result.success).toBe(false);
  });

  it('accepts comment with exactly 50 words', () => {
    const result = lecturerReviewSchema.safeParse({
      decision: 'VERIFIED',
      scores: validScores,
      comments: { ...validComments, problemUnderstanding: makeWords(50) },
    });
    expect(result.success).toBe(true);
  });

  it('accepts comment with 51 words', () => {
    const result = lecturerReviewSchema.safeParse({
      decision: 'VERIFIED',
      scores: validScores,
      comments: { ...validComments, problemUnderstanding: makeWords(51) },
    });
    expect(result.success).toBe(true);
  });

  it('rejects score below 1', () => {
    expect(
      lecturerReviewSchema.safeParse({
        decision: 'VERIFIED',
        scores: { ...validScores, problemUnderstanding: 0 },
        comments: validComments,
      }).success
    ).toBe(false);
  });

  it('rejects score above 5', () => {
    expect(
      lecturerReviewSchema.safeParse({
        decision: 'VERIFIED',
        scores: { ...validScores, solutionQuality: 6 },
        comments: validComments,
      }).success
    ).toBe(false);
  });

  it('rejects invalid decision value', () => {
    expect(
      lecturerReviewSchema.safeParse({
        decision: 'PASSED',
        scores: validScores,
        comments: validComments,
      }).success
    ).toBe(false);
  });

  it('rejects missing decision', () => {
    expect(
      lecturerReviewSchema.safeParse({
        scores: validScores,
        comments: validComments,
      }).success
    ).toBe(false);
  });
});
