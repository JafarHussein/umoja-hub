/**
 * @jest-environment node
 *
 * Integration tests for POST /api/education/reviews/[engagementId]
 * Spec: PHASE_IMPLEMENTATION_MASTER.md Phase 5 §D
 * Critical: 50-word minimum enforcement, VERIFIED cascade, VerificationAuditLog creation
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const mockEngagementFindOne = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...args: unknown[]) => mockEngagementFindOne(...args)),
    updateOne: jest.fn().mockResolvedValue({}),
  },
}));

const mockReviewCreate = jest.fn();
jest.mock('@/lib/models/LecturerReview.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn((...args: unknown[]) => mockReviewCreate(...args)),
  },
}));

const mockEffectivenessFindOne = jest.fn();
const mockEffectivenessCreate = jest.fn();
const mockEffectivenessUpdateOne = jest.fn();
jest.mock('@/lib/models/LecturerEffectiveness.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...args: unknown[]) => mockEffectivenessFindOne(...args)),
    create: jest.fn((...args: unknown[]) => mockEffectivenessCreate(...args)),
    updateOne: jest.fn((...args: unknown[]) => mockEffectivenessUpdateOne(...args)),
  },
}));

const mockPortfolioFindOne = jest.fn();
jest.mock('@/lib/models/StudentPortfolioStatus.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...args: unknown[]) => mockPortfolioFindOne(...args)),
  },
}));

const mockAuditCreate = jest.fn();
jest.mock('@/lib/models/VerificationAuditLog.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn((...args: unknown[]) => mockAuditCreate(...args)),
  },
}));

const mockUserFindById = jest.fn();
const mockUserUpdateOne = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn((...args: unknown[]) => mockUserFindById(...args)),
    updateOne: jest.fn((...args: unknown[]) => mockUserUpdateOne(...args)),
  },
}));

jest.mock('@/lib/integrations/githubService', () => ({
  getRepoLanguages: jest.fn().mockResolvedValue(['JavaScript']),
}));

jest.mock('@/lib/integrations/smsService', () => ({
  smsService: {
    sendSms: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/lib/trust/portfolioTierer', () => ({
  calculateTier: jest.fn().mockReturnValue('BEGINNER'),
  calculatePortfolioStrength: jest.fn().mockReturnValue('BUILDING'),
  extractSkills: jest.fn().mockReturnValue([{ skillName: 'JavaScript', category: 'Frontend', confirmedViaGithub: true }]),
}));

import { POST } from '../[engagementId]/route';

// Generate a 50-word+ comment (must be >= REVIEW_MIN_WORD_COUNT = 50)
const LONG_COMMENT =
  'This student demonstrated excellent understanding of the problem domain and provided a clear, well-reasoned solution that meets all the requirements specified in the brief. The approach taken is appropriate for their tier level and shows good technical thinking and problem-solving skills throughout the entire project and demonstrates strong analytical skills with clear documentation.';

const SHORT_COMMENT = 'Too short.';

function makeRequest(body: unknown, engagementId = 'eng-123'): NextRequest {
  return new NextRequest(`http://localhost/api/education/reviews/${engagementId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const lecturerSession = {
  user: { id: 'lecturer-789', email: 'lecturer@test.com', role: 'LECTURER' },
};

const studentSession = {
  user: { id: 'student-123', email: 'student@test.com', role: 'STUDENT' },
};

const validReviewBody = {
  decision: 'VERIFIED',
  scores: {
    problemUnderstanding: 4,
    solutionQuality: 4,
    processQuality: 4,
    aiUsage: 4,
  },
  comments: {
    problemUnderstanding: LONG_COMMENT,
    solutionQuality: LONG_COMMENT,
    processQuality: LONG_COMMENT,
    aiUsage: LONG_COMMENT,
    overallFeedback: 'Well done overall.',
  },
};

const mockEngagement = {
  _id: 'eng-123',
  studentId: 'student-456',
  track: 'AI_BRIEF',
  tier: 'BEGINNER',
  status: 'UNDER_LECTURER_REVIEW',
  brief: {
    projectTitle: 'M-Pesa SACCO Tracker',
    suggestedTechStack: ['JavaScript', 'Node.js'],
  },
  githubRepoName: undefined,
  githubSnapshot: {
    commitCount: 0,
    lastCommitHash: 'abc',
    commitTimelineHash: 'def',
  },
  documents: {
    problemBreakdown: { hash: 'hash1' },
    approachPlan: { hash: 'hash2' },
    finalReflection: { hash: 'hash3' },
  },
  peerReviewId: null,
  lecturerReviewId: null,
  save: jest.fn().mockResolvedValue(undefined),
};

describe('POST /api/education/reviews/[engagementId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when role is STUDENT', async () => {
    mockGetServerSession.mockResolvedValue(studentSession);

    const req = makeRequest(validReviewBody);
    const res = await POST(req, { params: Promise.resolve({ engagementId: 'eng-123' }) });

    expect(res.status).toBe(403);
  });

  it('returns 401 when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = makeRequest(validReviewBody);
    const res = await POST(req, { params: Promise.resolve({ engagementId: 'eng-123' }) });

    expect(res.status).toBe(401);
  });

  it('returns 400 VALIDATION_COMMENT_TOO_SHORT when comment has < 50 words', async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);
    mockEngagementFindOne.mockResolvedValue(mockEngagement);

    const body = {
      ...validReviewBody,
      comments: {
        ...validReviewBody.comments,
        problemUnderstanding: SHORT_COMMENT, // < 50 words
      },
    };

    const req = makeRequest(body);
    const res = await POST(req, { params: Promise.resolve({ engagementId: 'eng-123' }) });
    const data = (await res.json()) as { code: string };

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_COMMENT_TOO_SHORT');
  });

  it('returns 400 when Zod validation fails (missing scores)', async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);

    const req = makeRequest({ decision: 'VERIFIED' }); // missing scores and comments
    const res = await POST(req, { params: Promise.resolve({ engagementId: 'eng-123' }) });

    expect(res.status).toBe(400);
  });

  it('returns 404 when engagement not found or not under lecturer review', async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);
    mockEngagementFindOne.mockResolvedValue(null);

    const req = makeRequest(validReviewBody);
    const res = await POST(req, { params: Promise.resolve({ engagementId: 'nonexistent' }) });

    expect(res.status).toBe(404);
  });

  it('returns 201 and creates VerificationAuditLog on VERIFIED decision', async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);
    mockEngagementFindOne.mockResolvedValue(mockEngagement);

    const mockReview = {
      _id: 'review-001',
      createdAt: new Date(),
    };
    mockReviewCreate.mockResolvedValue(mockReview);

    // Portfolio for cascade
    const mockPortfolio = {
      currentTier: 'BEGINNER',
      verifiedProjects: [],
      verifiedSkills: [],
      tierProgressionTimeline: [{ tier: 'BEGINNER', unlockedAt: new Date() }],
      stats: {
        verifiedProjectCount: 0,
        totalProjectCount: 1,
        techStacksUsed: [],
        reviewerInstitutions: [],
      },
      portfolioStrength: 'BUILDING',
      lastRecalculatedAt: null,
      push: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockReturnValue({
        currentTier: 'BEGINNER',
        verifiedProjects: [],
        verifiedSkills: [],
        stats: { verifiedProjectCount: 0 },
      }),
    };
    mockPortfolioFindOne.mockResolvedValue(mockPortfolio);

    mockUserFindById
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            lecturerData: { universityAffiliation: 'University of Nairobi' },
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            phoneNumber: '+254700123456',
            firstName: 'James',
          }),
        }),
      });

    mockUserUpdateOne.mockResolvedValue({});
    mockEffectivenessFindOne.mockResolvedValue(null);
    mockEffectivenessCreate.mockResolvedValue({});
    mockAuditCreate.mockResolvedValue({});

    const req = makeRequest(validReviewBody);
    const res = await POST(req, { params: Promise.resolve({ engagementId: 'eng-123' }) });
    const data = (await res.json()) as {
      data: { decision: string; engagementStatus: string; verificationUrl: string };
    };

    expect(res.status).toBe(201);
    expect(data.data.decision).toBe('VERIFIED');
    expect(data.data.engagementStatus).toBe('VERIFIED');
    expect(data.data.verificationUrl).toBe('/experience/verify/eng-123');

    // VerificationAuditLog must be created
    expect(mockAuditCreate).toHaveBeenCalledTimes(1);
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        engagementId: 'eng-123',
        decision: 'VERIFIED',
        documentHashes: expect.objectContaining({
          problemBreakdown: 'hash1',
        }),
      })
    );
  });

  it('creates VerificationAuditLog for REVISION_REQUIRED decision', async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);
    mockEngagementFindOne.mockResolvedValue(mockEngagement);

    mockReviewCreate.mockResolvedValue({ _id: 'review-002', createdAt: new Date() });
    mockEffectivenessFindOne.mockResolvedValue(null);
    mockEffectivenessCreate.mockResolvedValue({});
    mockAuditCreate.mockResolvedValue({});

    const body = {
      ...validReviewBody,
      decision: 'REVISION_REQUIRED',
    };

    const req = makeRequest(body);
    const res = await POST(req, { params: Promise.resolve({ engagementId: 'eng-123' }) });
    const data = (await res.json()) as { data: { decision: string } };

    expect(res.status).toBe(201);
    expect(data.data.decision).toBe('REVISION_REQUIRED');
    expect(mockAuditCreate).toHaveBeenCalledTimes(1);
  });
});
