/**
 * @jest-environment node
 *
 * Tests for POST /api/education/engagements/[id]/submit
 * Covers: success (peer review created, status → UNDER_PEER_REVIEW), 404, 409 wrong status,
 * 422 missing docs, 503 no reviewer, 409 race condition (cleanup), 400 invalid ID, 403, 401.
 */

import { NextRequest } from 'next/server';
import { ProjectStatus } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockEngagementFindOne = jest.fn();
const mockEngagementFindOneAndUpdate = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockEngagementFindOne(...a)),
    findOneAndUpdate: jest.fn((...a: unknown[]) => mockEngagementFindOneAndUpdate(...a)),
  },
}));

const mockUserFindById = jest.fn();
const mockUserFind = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn((...a: unknown[]) => mockUserFindById(...a)),
    find: jest.fn((...a: unknown[]) => mockUserFind(...a)),
  },
}));

const mockPeerReviewCreate = jest.fn();
const mockPeerReviewFind = jest.fn();
const mockPeerReviewAggregate = jest.fn();
const mockPeerReviewFindByIdAndDelete = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/models/PeerReview.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn((...a: unknown[]) => mockPeerReviewCreate(...a)),
    find: jest.fn((...a: unknown[]) => mockPeerReviewFind(...a)),
    aggregate: jest.fn((...a: unknown[]) => mockPeerReviewAggregate(...a)),
    findByIdAndDelete: jest.fn((...a: unknown[]) => mockPeerReviewFindByIdAndDelete(...a)),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT', firstName: 'Amina' } };
const FARMER_SESSION = { user: { id: 'farmer-001', role: 'FARMER', firstName: 'Kamau' } };
const VALID_ID = '64a1b2c3d4e5f6a7b8c9d0e1';

function makeParams(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

function makeRequest() {
  return new NextRequest(`http://localhost/api/education/engagements/${VALID_ID}/submit`, {
    method: 'POST',
  });
}

const ALL_DOCS = {
  problemBreakdown: { content: 'Breakdown text', hash: 'abc', submittedAt: new Date() },
  approachPlan: { content: 'Plan text', hash: 'def', submittedAt: new Date() },
  finalReflection: { content: 'Reflection text', hash: 'ghi', submittedAt: new Date() },
  blockerLog: [],
  aiUsageLog: [],
};

const IN_PROGRESS_ENGAGEMENT = {
  _id: VALID_ID,
  studentId: 'student-001',
  status: ProjectStatus.IN_PROGRESS,
  documents: ALL_DOCS,
};

const PEER_REVIEWER = { _id: 'reviewer-001', role: 'STUDENT', status: 'ACTIVE' };
const CREATED_REVIEW = { _id: 'peer-review-001', engagementId: VALID_ID, reviewerId: 'reviewer-001', status: 'ASSIGNED' };
const UPDATED_ENGAGEMENT = { ...IN_PROGRESS_ENGAGEMENT, status: ProjectStatus.UNDER_PEER_REVIEW, peerReviewId: 'peer-review-001' };

// The author, their cohort, each candidate's outstanding assignments and who
// has already read this engagement — the four reads the reviewer choice makes.
function cohort(candidates: { _id: string }[]): void {
  mockUserFindById.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ studentData: { institutionId: 'institution-001' } }),
    }),
  });
  mockUserFind.mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(candidates) }),
  });
  mockPeerReviewAggregate.mockResolvedValue([]);
  mockPeerReviewFind.mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
  });
}

describe('POST /api/education/engagements/[id]/submit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
  });

  it('creates a peer review and transitions engagement to UNDER_PEER_REVIEW, returning 201', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(IN_PROGRESS_ENGAGEMENT) });
    cohort([PEER_REVIEWER]);
    mockPeerReviewCreate.mockResolvedValue(CREATED_REVIEW);
    mockEngagementFindOneAndUpdate.mockResolvedValue(UPDATED_ENGAGEMENT);

    const res = await POST(makeRequest(), { params: makeParams(VALID_ID) });
    const body = await res.json() as { data: { status: string; peerReviewId: string } };

    expect(res.status).toBe(201);
    expect(body.data.status).toBe(ProjectStatus.UNDER_PEER_REVIEW);
    expect(mockPeerReviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({ reviewerId: PEER_REVIEWER._id, status: 'ASSIGNED' })
    );
    expect(mockEngagementFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ProjectStatus.IN_PROGRESS }),
      expect.objectContaining({ $set: expect.objectContaining({ status: ProjectStatus.UNDER_PEER_REVIEW }) }),
      { new: true }
    );
  });

  // The assignment used to be an unsorted findOne, so one student received
  // effectively every peer review on the platform.
  it('gives the work to the student carrying the least of it', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(IN_PROGRESS_ENGAGEMENT) });
    cohort([{ _id: 'reviewer-busy' }, { _id: 'reviewer-free' }]);
    mockPeerReviewAggregate.mockResolvedValue([{ _id: 'reviewer-busy', n: 3 }]);
    mockPeerReviewCreate.mockResolvedValue(CREATED_REVIEW);
    mockEngagementFindOneAndUpdate.mockResolvedValue(UPDATED_ENGAGEMENT);

    await POST(makeRequest(), { params: makeParams(VALID_ID) });

    expect(mockPeerReviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({ reviewerId: 'reviewer-free' })
    );
  });

  it('gives a resubmitted project a reader who has not already judged it', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(IN_PROGRESS_ENGAGEMENT) });
    cohort([{ _id: 'reviewer-first-pass' }, { _id: 'reviewer-fresh' }]);
    mockPeerReviewFind.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ reviewerId: 'reviewer-first-pass' }]),
      }),
    });
    mockPeerReviewCreate.mockResolvedValue(CREATED_REVIEW);
    mockEngagementFindOneAndUpdate.mockResolvedValue(UPDATED_ENGAGEMENT);

    await POST(makeRequest(), { params: makeParams(VALID_ID) });

    expect(mockPeerReviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({ reviewerId: 'reviewer-fresh' })
    );
  });

  it('returns 404 when the engagement is not found or not owned by the student', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await POST(makeRequest(), { params: makeParams(VALID_ID) });
    expect(res.status).toBe(404);
  });

  it('returns 409 when the engagement is not IN_PROGRESS', async () => {
    mockEngagementFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ ...IN_PROGRESS_ENGAGEMENT, status: ProjectStatus.SUBMITTED }),
    });

    const res = await POST(makeRequest(), { params: makeParams(VALID_ID) });
    const body = await res.json() as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('ORDER_INVALID_STATUS_TRANSITION');
  });

  it('returns 422 when problemBreakdown is missing', async () => {
    const { problemBreakdown: _pb, ...docsWithout } = ALL_DOCS;
    mockEngagementFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ ...IN_PROGRESS_ENGAGEMENT, documents: docsWithout }),
    });

    const res = await POST(makeRequest(), { params: makeParams(VALID_ID) });
    const body = await res.json() as { code: string };

    expect(res.status).toBe(422);
    expect(body.code).toBe('DOCUMENTS_INCOMPLETE');
  });

  it('returns 422 when approachPlan is missing', async () => {
    const { approachPlan: _ap, ...docsWithout } = ALL_DOCS;
    mockEngagementFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ ...IN_PROGRESS_ENGAGEMENT, documents: docsWithout }),
    });

    const res = await POST(makeRequest(), { params: makeParams(VALID_ID) });
    expect(res.status).toBe(422);
  });

  it('returns 422 when finalReflection is missing', async () => {
    const { finalReflection: _fr, ...docsWithout } = ALL_DOCS;
    mockEngagementFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ ...IN_PROGRESS_ENGAGEMENT, documents: docsWithout }),
    });

    const res = await POST(makeRequest(), { params: makeParams(VALID_ID) });
    expect(res.status).toBe(422);
  });

  it('returns 503 when no peer reviewer is available', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(IN_PROGRESS_ENGAGEMENT) });
    cohort([]);

    const res = await POST(makeRequest(), { params: makeParams(VALID_ID) });
    const body = await res.json() as { code: string };

    expect(res.status).toBe(503);
    expect(body.code).toBe('NO_REVIEWER_AVAILABLE');
  });

  it('returns 409 and cleans up the peer review when a race condition is detected', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(IN_PROGRESS_ENGAGEMENT) });
    cohort([PEER_REVIEWER]);
    mockPeerReviewCreate.mockResolvedValue(CREATED_REVIEW);
    mockEngagementFindOneAndUpdate.mockResolvedValue(null);

    const res = await POST(makeRequest(), { params: makeParams(VALID_ID) });

    expect(res.status).toBe(409);
    expect(mockPeerReviewFindByIdAndDelete).toHaveBeenCalledWith(CREATED_REVIEW._id, null);
  });

  it('returns 400 when the engagement ID is not a valid ObjectId', async () => {
    const res = await POST(makeRequest(), { params: makeParams('not-valid') });
    expect(res.status).toBe(400);
  });

  it('returns 403 when a non-STUDENT calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const res = await POST(makeRequest(), { params: makeParams(VALID_ID) });
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest(), { params: makeParams(VALID_ID) });
    expect(res.status).toBe(401);
  });
});
