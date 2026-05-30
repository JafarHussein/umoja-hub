/**
 * @jest-environment node
 *
 * Tests for GET /api/education/engagements/me
 * Covers: active engagement returned, null when no active engagement, role guard.
 */

import { NextRequest } from 'next/server';
import { ProjectStatus } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockEngagementFindOne = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockEngagementFindOne(...a)),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET } from '../route';

const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT', firstName: 'Amina' } };

function makeRequest() {
  return new NextRequest('http://localhost/api/education/engagements/me', { method: 'GET' });
}

const ACTIVE_ENGAGEMENT = {
  _id: 'eng-001',
  studentId: 'student-001',
  track: 'AI_BRIEF',
  tier: 'BEGINNER',
  status: ProjectStatus.IN_PROGRESS,
  brief: { title: 'Test Project' },
};

describe('GET /api/education/engagements/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
  });

  it('returns the active engagement when one exists', async () => {
    mockEngagementFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(ACTIVE_ENGAGEMENT) }),
    });

    const res = await GET(makeRequest());
    const body = await res.json() as { data: typeof ACTIVE_ENGAGEMENT };

    expect(res.status).toBe(200);
    expect(body.data._id).toBe('eng-001');
    expect(body.data.status).toBe(ProjectStatus.IN_PROGRESS);
  });

  it('returns { data: null } when no active engagement exists', async () => {
    mockEngagementFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });

    const res = await GET(makeRequest());
    const body = await res.json() as { data: null };

    expect(res.status).toBe(200);
    expect(body.data).toBeNull();
  });

  it('queries only active statuses — does not surface VERIFIED or DENIED engagements', async () => {
    mockEngagementFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });

    await GET(makeRequest());

    const callArgs = mockEngagementFindOne.mock.calls[0][0] as {
      studentId: string;
      status: { $in: string[] };
    };
    expect(callArgs.status.$in).not.toContain(ProjectStatus.VERIFIED);
    expect(callArgs.status.$in).not.toContain(ProjectStatus.DENIED);
    expect(callArgs.status.$in).toContain(ProjectStatus.BRIEF_GENERATED);
    expect(callArgs.status.$in).toContain(ProjectStatus.IN_PROGRESS);
    expect(callArgs.status.$in).toContain(ProjectStatus.REVISION_REQUIRED);
  });

  it('returns 403 when a non-STUDENT calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'lecturer-001', role: 'LECTURER', firstName: 'Prof' },
    });

    const res = await GET(makeRequest());

    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
  });
});
