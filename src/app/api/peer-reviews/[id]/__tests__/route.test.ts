/**
 * @jest-environment node
 *
 * Tests for GET + POST /api/peer-reviews/[id]
 * Covers: GET success, GET 404, POST success (engagement advanced), POST 404, POST 409 already submitted,
 * 400 invalid ID, 400 validation, 403, 401.
 */

import { NextRequest } from 'next/server';
import { PeerReviewStatus, ProjectStatus } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockPeerReviewFindOne = jest.fn();
const mockPeerReviewFindOneAndUpdate = jest.fn();
jest.mock('@/lib/models/PeerReview.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockPeerReviewFindOne(...a)),
    findOneAndUpdate: jest.fn((...a: unknown[]) => mockPeerReviewFindOneAndUpdate(...a)),
  },
}));

const mockEngagementFindByIdAndUpdate = jest.fn().mockResolvedValue(undefined);
const mockEngagementFindById = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
});
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn((...a: unknown[]) => mockEngagementFindById(...a)),
    findByIdAndUpdate: jest.fn((...a: unknown[]) => mockEngagementFindByIdAndUpdate(...a)),
  },
}));

// A peer reads the report now, not three separate documents.
const mockReportFindOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
jest.mock('@/lib/models/ProjectDocumentation.model', () => ({
  __esModule: true,
  default: { findOne: jest.fn((...a: unknown[]) => mockReportFindOne(...a)) },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET, POST } from '../route';

const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT', firstName: 'Amina' } };
const FARMER_SESSION = { user: { id: 'farmer-001', role: 'FARMER', firstName: 'Kamau' } };
const VALID_ID = '64a1b2c3d4e5f6a7b8c9d0e1';

function makeParams(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

function makeGetRequest() {
  return new NextRequest(`http://localhost/api/peer-reviews/${VALID_ID}`, { method: 'GET' });
}

function makePostRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/peer-reviews/${VALID_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const ASSIGNED_REVIEW = {
  _id: VALID_ID,
  reviewerId: 'student-001',
  engagementId: '64a1b2c3d4e5f6a7b8c9d0e2',
  status: PeerReviewStatus.ASSIGNED,
  scores: {},
  comments: {},
};

const SUBMITTED_REVIEW = {
  ...ASSIGNED_REVIEW,
  status: PeerReviewStatus.SUBMITTED,
  submittedAt: new Date(),
};

const VALID_SCORES_BODY = {
  scores: { codeQuality: 4, documentationClarity: 3 },
  comments: { codeQuality: 'Good structure', documentationClarity: 'Clear enough' },
};

describe('GET /api/peer-reviews/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
  });

  it('returns the peer review assignment for the assigned reviewer', async () => {
    mockPeerReviewFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(ASSIGNED_REVIEW) });

    const res = await GET(makeGetRequest(), { params: makeParams(VALID_ID) });
    const body = await res.json() as { data: { status: string } };

    expect(res.status).toBe(200);
    expect(body.data.status).toBe(PeerReviewStatus.ASSIGNED);
  });

  it('returns 404 when the review does not exist or reviewer does not match', async () => {
    mockPeerReviewFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await GET(makeGetRequest(), { params: makeParams(VALID_ID) });
    expect(res.status).toBe(404);
  });

  it('returns 400 when the ID is not a valid ObjectId', async () => {
    const res = await GET(makeGetRequest(), { params: makeParams('not-valid') });
    expect(res.status).toBe(400);
  });

  it('returns 403 when a non-STUDENT calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const res = await GET(makeGetRequest(), { params: makeParams(VALID_ID) });
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeGetRequest(), { params: makeParams(VALID_ID) });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/peer-reviews/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
  });

  it('submits scores, updates engagement to UNDER_LECTURER_REVIEW, and returns 200', async () => {
    mockPeerReviewFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(ASSIGNED_REVIEW) });
    mockPeerReviewFindOneAndUpdate.mockResolvedValue(SUBMITTED_REVIEW);

    const res = await POST(makePostRequest(VALID_SCORES_BODY), { params: makeParams(VALID_ID) });
    const body = await res.json() as { data: { status: string } };

    expect(res.status).toBe(200);
    expect(body.data.status).toBe(PeerReviewStatus.SUBMITTED);
    expect(mockPeerReviewFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: PeerReviewStatus.ASSIGNED }),
      expect.objectContaining({ $set: expect.objectContaining({ status: PeerReviewStatus.SUBMITTED }) }),
      { new: true }
    );
    expect(mockEngagementFindByIdAndUpdate).toHaveBeenCalledWith(
      ASSIGNED_REVIEW.engagementId,
      { $set: { status: ProjectStatus.UNDER_LECTURER_REVIEW } },
      null
    );
  });

  it('returns 404 when the review does not exist or reviewer does not match', async () => {
    mockPeerReviewFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await POST(makePostRequest(VALID_SCORES_BODY), { params: makeParams(VALID_ID) });
    expect(res.status).toBe(404);
  });

  it('returns 409 when the review has already been submitted', async () => {
    mockPeerReviewFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(SUBMITTED_REVIEW) });

    const res = await POST(makePostRequest(VALID_SCORES_BODY), { params: makeParams(VALID_ID) });
    const body = await res.json() as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('ORDER_INVALID_STATUS_TRANSITION');
  });

  it('returns 400 when the ID is not a valid ObjectId', async () => {
    const res = await POST(makePostRequest(VALID_SCORES_BODY), { params: makeParams('bad-id') });
    expect(res.status).toBe(400);
  });

  it('returns 400 when scores are out of range', async () => {
    const res = await POST(
      makePostRequest({ ...VALID_SCORES_BODY, scores: { codeQuality: 6, documentationClarity: 0 } }),
      { params: makeParams(VALID_ID) }
    );
    expect(res.status).toBe(400);
  });

  it('returns 403 when a non-STUDENT calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const res = await POST(makePostRequest(VALID_SCORES_BODY), { params: makeParams(VALID_ID) });
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(makePostRequest(VALID_SCORES_BODY), { params: makeParams(VALID_ID) });
    expect(res.status).toBe(401);
  });
});
