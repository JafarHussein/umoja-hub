/**
 * @jest-environment node
 *
 * Tests for GET /api/lecturer/queue
 * Covers: success (verified lecturer), 403 not verified, 403 wrong role, 401 unauthenticated,
 * empty queue.
 */

import { NextRequest } from 'next/server';
import { ProjectStatus } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn((...a: unknown[]) => mockUserFindById(...a)),
  },
}));

const mockEngagementFind = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    find: jest.fn((...a: unknown[]) => mockEngagementFind(...a)),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET } from '../route';

const LECTURER_SESSION = {
  user: { id: 'lecturer-001', role: 'LECTURER', firstName: 'Dr. Wanjiru' },
};
const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT', firstName: 'Amina' } };

const VERIFIED_LECTURER = {
  _id: 'lecturer-001',
  role: 'LECTURER',
  lecturerData: { isVerified: true, universityAffiliation: 'University of Nairobi' },
};
const UNVERIFIED_LECTURER = {
  _id: 'lecturer-001',
  role: 'LECTURER',
  lecturerData: { isVerified: false },
};

const SAMPLE_ENGAGEMENTS = [
  {
    _id: '64a1b2c3d4e5f6a7b8c9d0e1',
    studentId: 'student-001',
    status: ProjectStatus.UNDER_LECTURER_REVIEW,
  },
  {
    _id: '64a1b2c3d4e5f6a7b8c9d0e2',
    studentId: 'student-002',
    status: ProjectStatus.UNDER_LECTURER_REVIEW,
  },
];

function makeRequest() {
  return new NextRequest('http://localhost/api/lecturer/queue', { method: 'GET' });
}

describe('GET /api/lecturer/queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(LECTURER_SESSION);
  });

  it('returns the review queue for a verified lecturer', async () => {
    mockUserFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(VERIFIED_LECTURER) });
    mockEngagementFind.mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(SAMPLE_ENGAGEMENTS) }),
    });

    const res = await GET(makeRequest());
    const body = await res.json() as { data: unknown[] };

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(mockEngagementFind).toHaveBeenCalledWith(
      expect.objectContaining({ status: ProjectStatus.UNDER_LECTURER_REVIEW })
    );
  });

  it('returns an empty array when no engagements are in the queue', async () => {
    mockUserFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(VERIFIED_LECTURER) });
    mockEngagementFind.mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    });

    const res = await GET(makeRequest());
    const body = await res.json() as { data: unknown[] };

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(0);
  });

  it('returns 403 when the lecturer is not yet verified', async () => {
    mockUserFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(UNVERIFIED_LECTURER) });

    const res = await GET(makeRequest());
    const body = await res.json() as { code: string };

    expect(res.status).toBe(403);
    expect(body.code).toBe('LECTURER_NOT_VERIFIED');
  });

  it('returns 403 when a non-LECTURER role calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });
});
