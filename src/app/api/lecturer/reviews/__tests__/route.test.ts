/**
 * @jest-environment node
 *
 * Tests for POST /api/lecturer/reviews
 * Covers: VERIFIED decision, REVISION_REQUIRED, DENIED (with rejectionReason),
 * 404 engagement not found, 409 already reviewed (idempotency), 409 race condition,
 * 403 not verified, 403 wrong role, 401 unauthenticated, 400 invalid engagementId,
 * 400 validation failure.
 */

import { NextRequest } from 'next/server';
import { LecturerDecision, ProjectStatus } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn((...a: unknown[]) => mockUserFindById(...a)),
  },
}));

const mockEngagementFindOne = jest.fn();
const mockEngagementFindOneAndUpdate = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockEngagementFindOne(...a)),
    findOneAndUpdate: jest.fn((...a: unknown[]) => mockEngagementFindOneAndUpdate(...a)),
  },
}));

const mockLecturerReviewFindOne = jest.fn();
const mockLecturerReviewCreate = jest.fn();
const mockLecturerReviewFindByIdAndDelete = jest.fn();
jest.mock('@/lib/models/LecturerReview.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockLecturerReviewFindOne(...a)),
    create: jest.fn((...a: unknown[]) => mockLecturerReviewCreate(...a)),
    findByIdAndDelete: jest.fn((...a: unknown[]) => mockLecturerReviewFindByIdAndDelete(...a)),
  },
}));

const mockAuditLogCreate = jest.fn();
jest.mock('@/lib/models/VerificationAuditLog.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn((...a: unknown[]) => mockAuditLogCreate(...a)),
  },
}));

const mockPortfolioFindOneAndUpdate = jest.fn();
jest.mock('@/lib/models/StudentPortfolioStatus.model', () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: jest.fn((...a: unknown[]) => mockPortfolioFindOneAndUpdate(...a)),
  },
}));

const mockEffectivenessFindOneAndUpdate = jest.fn();
jest.mock('@/lib/models/LecturerEffectiveness.model', () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: jest.fn((...a: unknown[]) => mockEffectivenessFindOneAndUpdate(...a)),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

const LECTURER_SESSION = {
  user: { id: 'lecturer-001', role: 'LECTURER', firstName: 'Dr. Wanjiru' },
};
const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT', firstName: 'Amina' } };
const VALID_ENGAGEMENT_ID = '64a1b2c3d4e5f6a7b8c9d0e1';

const VERIFIED_LECTURER = {
  _id: 'lecturer-001',
  lecturerData: { isVerified: true, universityAffiliation: 'University of Nairobi' },
};
const UNVERIFIED_LECTURER = { _id: 'lecturer-001', lecturerData: { isVerified: false } };

const ACTIVE_ENGAGEMENT = {
  _id: VALID_ENGAGEMENT_ID,
  studentId: 'student-001',
  status: ProjectStatus.UNDER_LECTURER_REVIEW,
  tier: 'BEGINNER',
  documents: {
    problemBreakdown: { hash: 'abc123', content: 'text', submittedAt: new Date() },
    approachPlan: { hash: 'def456', content: 'text', submittedAt: new Date() },
    finalReflection: { hash: 'ghi789', content: 'text', submittedAt: new Date() },
    blockerLog: [],
    aiUsageLog: [],
  },
};

const CREATED_REVIEW = {
  _id: '64a1b2c3d4e5f6a7b8c9d0f1',
  engagementId: VALID_ENGAGEMENT_ID,
  lecturerId: 'lecturer-001',
  decision: LecturerDecision.VERIFIED,
  scores: { problemUnderstanding: 4, solutionQuality: 4, processQuality: 3, aiUsage: 5 },
  comments: {
    problemUnderstanding: 'Well broken down with clear understanding of constraints',
    solutionQuality: 'Clean solution that addresses the core problem effectively',
    processQuality: 'Good use of the blocker log throughout the process',
    aiUsage: 'Responsible and transparent use of AI tools throughout',
  },
};

const VALID_SCORES = {
  problemUnderstanding: 4,
  solutionQuality: 4,
  processQuality: 3,
  aiUsage: 5,
};

// Each comment must meet REVIEW_MIN_WORD_COUNT (50 words). 51 words — verified by countWords split.
const FIFTY_WORD_COMMENT =
  'The student demonstrated a thorough and well-structured approach throughout this entire section of the project work. ' +
  'Their submission showed clear analytical thinking, careful attention to important detail, and a solid understanding of ' +
  'the relevant technical constraints and trade-offs involved in building software for the East African and Kenyan technology market context.'

const VALID_COMMENTS = {
  problemUnderstanding: FIFTY_WORD_COMMENT,
  solutionQuality: FIFTY_WORD_COMMENT,
  processQuality: FIFTY_WORD_COMMENT,
  aiUsage: FIFTY_WORD_COMMENT,
};

const VALID_BODY = {
  engagementId: VALID_ENGAGEMENT_ID,
  decision: LecturerDecision.VERIFIED,
  scores: VALID_SCORES,
  comments: VALID_COMMENTS,
};

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/lecturer/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function setupHappyPath() {
  mockUserFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(VERIFIED_LECTURER) });
  mockEngagementFindOne.mockReturnValue({
    lean: jest.fn().mockResolvedValue(ACTIVE_ENGAGEMENT),
  });
  mockLecturerReviewFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
  mockLecturerReviewCreate.mockResolvedValue(CREATED_REVIEW);
  mockEngagementFindOneAndUpdate.mockResolvedValue({
    ...ACTIVE_ENGAGEMENT,
    status: ProjectStatus.VERIFIED,
    lecturerReviewId: CREATED_REVIEW._id,
  });
  mockAuditLogCreate.mockResolvedValue({});
  mockPortfolioFindOneAndUpdate.mockResolvedValue(null);
  mockEffectivenessFindOneAndUpdate.mockResolvedValue(null);
}

describe('POST /api/lecturer/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(LECTURER_SESSION);
  });

  it('creates review, advances engagement to VERIFIED, and increments portfolio stats', async () => {
    setupHappyPath();

    const res = await POST(makeRequest(VALID_BODY));
    const body = await res.json() as { data: { decision: string } };

    expect(res.status).toBe(201);
    expect(body.data.decision).toBe(LecturerDecision.VERIFIED);

    expect(mockEngagementFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ProjectStatus.UNDER_LECTURER_REVIEW }),
      expect.objectContaining({ $set: expect.objectContaining({ status: ProjectStatus.VERIFIED }) }),
      { new: true }
    );

    expect(mockPortfolioFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: ACTIVE_ENGAGEMENT.studentId }),
      expect.objectContaining({ $inc: { 'stats.verifiedProjectCount': 1 } }),
      { upsert: true }
    );

    expect(mockEffectivenessFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ lecturerId: LECTURER_SESSION.user.id }),
      expect.objectContaining({ $inc: expect.objectContaining({ totalReviews: 1, verifiedCount: 1 }) }),
      { upsert: true }
    );

    expect(mockAuditLogCreate).toHaveBeenCalled();
  });

  it('advances engagement to REVISION_REQUIRED and increments revisionCount', async () => {
    setupHappyPath();
    const body = {
      ...VALID_BODY,
      decision: LecturerDecision.REVISION_REQUIRED,
    };
    mockLecturerReviewCreate.mockResolvedValue({ ...CREATED_REVIEW, decision: LecturerDecision.REVISION_REQUIRED });
    mockEngagementFindOneAndUpdate.mockResolvedValue({ status: ProjectStatus.REVISION_REQUIRED });

    const res = await POST(makeRequest(body));
    expect(res.status).toBe(201);

    expect(mockEngagementFindOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({ status: ProjectStatus.REVISION_REQUIRED }),
      }),
      { new: true }
    );

    expect(mockEffectivenessFindOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ $inc: expect.objectContaining({ revisionCount: 1 }) }),
      { upsert: true }
    );

    // Portfolio NOT updated on non-VERIFIED decisions
    expect(mockPortfolioFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('advances engagement to DENIED and increments deniedCount', async () => {
    setupHappyPath();
    const body = {
      ...VALID_BODY,
      decision: LecturerDecision.DENIED,
      rejectionReason: 'Does not meet minimum submission criteria.',
    };
    mockLecturerReviewCreate.mockResolvedValue({ ...CREATED_REVIEW, decision: LecturerDecision.DENIED });
    mockEngagementFindOneAndUpdate.mockResolvedValue({ status: ProjectStatus.DENIED });

    const res = await POST(makeRequest(body));
    expect(res.status).toBe(201);

    expect(mockEffectivenessFindOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ $inc: expect.objectContaining({ deniedCount: 1 }) }),
      { upsert: true }
    );
  });

  it('returns 404 when engagement is not found or not UNDER_LECTURER_REVIEW', async () => {
    mockUserFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(VERIFIED_LECTURER) });
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(404);
  });

  it('returns 409 when a review for this engagement already exists', async () => {
    mockUserFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(VERIFIED_LECTURER) });
    mockEngagementFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(ACTIVE_ENGAGEMENT),
    });
    mockLecturerReviewFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(CREATED_REVIEW),
    });

    const res = await POST(makeRequest(VALID_BODY));
    const body = await res.json() as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('DB_DUPLICATE');
  });

  it('cleans up the created review and returns 409 on concurrent status transition', async () => {
    mockUserFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(VERIFIED_LECTURER) });
    mockEngagementFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(ACTIVE_ENGAGEMENT),
    });
    mockLecturerReviewFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockLecturerReviewCreate.mockResolvedValue(CREATED_REVIEW);
    mockEngagementFindOneAndUpdate.mockResolvedValue(null); // race condition

    const res = await POST(makeRequest(VALID_BODY));
    const body = await res.json() as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('ORDER_INVALID_STATUS_TRANSITION');
    expect(mockLecturerReviewFindByIdAndDelete).toHaveBeenCalledWith(CREATED_REVIEW._id, null);
  });

  it('returns 400 when engagementId is missing', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, engagementId: undefined }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when engagementId is not a valid ObjectId', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, engagementId: 'not-an-objectid' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when scores are out of range', async () => {
    const res = await POST(
      makeRequest({ ...VALID_BODY, scores: { ...VALID_SCORES, problemUnderstanding: 6 } })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when DENIED decision is missing rejectionReason', async () => {
    const res = await POST(
      makeRequest({ ...VALID_BODY, decision: LecturerDecision.DENIED })
    );
    expect(res.status).toBe(400);
  });

  it('returns 403 when the lecturer is not yet verified', async () => {
    mockUserFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(UNVERIFIED_LECTURER) });
    mockEngagementFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(ACTIVE_ENGAGEMENT),
    });
    mockLecturerReviewFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await POST(makeRequest(VALID_BODY));
    const body = await res.json() as { code: string };

    expect(res.status).toBe(403);
    expect(body.code).toBe('LECTURER_NOT_VERIFIED');
  });

  it('returns 403 when a non-LECTURER role calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });
});
