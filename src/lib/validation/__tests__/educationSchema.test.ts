import {
  briefRequestSchema,
  documentSubmissionSchema,
  blockerLogEntrySchema,
  aiUsageLogEntrySchema,
  peerReviewSchema,
  lecturerReviewSchema,
} from '../educationSchema';

// ---------------------------------------------------------------------------
// briefRequestSchema
// ---------------------------------------------------------------------------

describe('briefRequestSchema', () => {
  it('accepts an AI_BRIEF track request', () => {
    expect(
      briefRequestSchema.safeParse({ track: 'AI_BRIEF', tier: 'BEGINNER' }).success
    ).toBe(true);
  });

  it('accepts an OPEN_SOURCE track request with GitHub URL', () => {
    expect(
      briefRequestSchema.safeParse({
        track: 'OPEN_SOURCE',
        tier: 'INTERMEDIATE',
        githubRepoUrl: 'https://github.com/some/repo',
      }).success
    ).toBe(true);
  });

  it('accepts all valid tiers', () => {
    for (const tier of ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const) {
      expect(briefRequestSchema.safeParse({ track: 'AI_BRIEF', tier }).success).toBe(true);
    }
  });

  it('rejects invalid track', () => {
    expect(
      briefRequestSchema.safeParse({ track: 'MANUAL', tier: 'BEGINNER' }).success
    ).toBe(false);
  });

  it('rejects invalid tier', () => {
    expect(
      briefRequestSchema.safeParse({ track: 'AI_BRIEF', tier: 'EXPERT' }).success
    ).toBe(false);
  });

  it('rejects missing track', () => {
    expect(briefRequestSchema.safeParse({ tier: 'BEGINNER' }).success).toBe(false);
  });

  it('rejects invalid GitHub URL', () => {
    expect(
      briefRequestSchema.safeParse({
        track: 'OPEN_SOURCE',
        tier: 'BEGINNER',
        githubRepoUrl: 'not-a-url',
      }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// documentSubmissionSchema
// ---------------------------------------------------------------------------

describe('documentSubmissionSchema', () => {
  it('accepts a valid problemBreakdown submission', () => {
    expect(
      documentSubmissionSchema.safeParse({
        documentType: 'problemBreakdown',
        content: 'This is the problem breakdown content that is well over fifty characters long.',
      }).success
    ).toBe(true);
  });

  it('accepts approachPlan documentType', () => {
    expect(
      documentSubmissionSchema.safeParse({
        documentType: 'approachPlan',
        content: 'The approach plan outlines the methodology used to solve the problem at hand.',
      }).success
    ).toBe(true);
  });

  it('accepts finalReflection documentType', () => {
    expect(
      documentSubmissionSchema.safeParse({
        documentType: 'finalReflection',
        content: 'The final reflection covers learnings from this engagement experience clearly.',
      }).success
    ).toBe(true);
  });

  it('rejects invalid document type', () => {
    expect(
      documentSubmissionSchema.safeParse({
        documentType: 'codeReview',
        content: 'Some content here that meets the minimum length requirement easily.',
      }).success
    ).toBe(false);
  });

  it('rejects content shorter than 50 characters', () => {
    expect(
      documentSubmissionSchema.safeParse({
        documentType: 'problemBreakdown',
        content: 'Too short',
      }).success
    ).toBe(false);
  });

  it('rejects missing content', () => {
    expect(
      documentSubmissionSchema.safeParse({ documentType: 'problemBreakdown' }).success
    ).toBe(false);
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
