/**
 * @jest-environment node
 *
 * Tests for GET /api/education/engagements/[id]/reviews — the student's own
 * view of what their lecturer said. Covers: every review returned oldest
 * revision first, an empty list before any decision, 404 for another student's
 * engagement, 400 validation, 403 wrong role, 401 unauthenticated.
 */

import { NextRequest } from 'next/server';
import { LecturerDecision } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockEngagementFindOne = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: { findOne: jest.fn((...a: unknown[]) => mockEngagementFindOne(...a)) },
}));

const mockReviewFind = jest.fn();
jest.mock('@/lib/models/LecturerReview.model', () => ({
  __esModule: true,
  default: { find: jest.fn((...a: unknown[]) => mockReviewFind(...a)) },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET } from '../route';

const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT', firstName: 'Amina' } };
const VALID_ID = '64a1b2c3d4e5f6a7b8c9d0e1';
const params = Promise.resolve({ id: VALID_ID });

function makeRequest() {
  return new NextRequest(`http://localhost/api/education/engagements/${VALID_ID}/reviews`);
}

function ownsEngagement(): void {
  mockEngagementFindOne.mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: VALID_ID }) }),
  });
}

function returnsReviews(reviews: unknown[]): { sort: jest.Mock } {
  const sort = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(reviews) });
  mockReviewFind.mockReturnValue({ select: jest.fn().mockReturnValue({ sort }) });
  return { sort };
}

describe('GET /api/education/engagements/[id]/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
  });

  it('returns every review the project has been through, oldest revision first', async () => {
    ownsEngagement();
    const { sort } = returnsReviews([
      { _id: 'r0', revisionNumber: 0, decision: LecturerDecision.REVISION_REQUIRED },
      { _id: 'r1', revisionNumber: 1, decision: LecturerDecision.VERIFIED },
    ]);

    const res = await GET(makeRequest(), { params });
    const body = (await res.json()) as { data: { _id: string }[] };

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(sort).toHaveBeenCalledWith({ revisionNumber: 1, createdAt: 1 });
  });

  it('returns an empty list before any lecturer has judged the work', async () => {
    ownsEngagement();
    returnsReviews([]);

    const res = await GET(makeRequest(), { params });
    const body = (await res.json()) as { data: unknown[] };

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it("returns 404 for another student's engagement without reading its reviews", async () => {
    mockEngagementFindOne.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });

    const res = await GET(makeRequest(), { params });

    expect(res.status).toBe(404);
    expect(mockReviewFind).not.toHaveBeenCalled();
  });

  it('rejects a malformed engagement id', async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: 'not-an-id' }) });

    expect(res.status).toBe(400);
  });

  it('refuses a lecturer', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'lecturer-001', role: 'LECTURER' },
    });

    const res = await GET(makeRequest(), { params });

    expect(res.status).toBe(403);
  });

  it('refuses an unauthenticated caller', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await GET(makeRequest(), { params });

    expect(res.status).toBe(401);
  });
});
