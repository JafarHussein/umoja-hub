/**
 * @jest-environment node
 *
 * Tests for POST /api/education/engagements/[id]/blockers
 * Covers: success, 404, 409 wrong status, 400 invalid ID, 400 validation, 403, 401.
 */

import { NextRequest } from 'next/server';
import { ProjectStatus } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockEngagementFindOne = jest.fn();
const mockEngagementFindByIdAndUpdate = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockEngagementFindOne(...a)),
    findByIdAndUpdate: jest.fn((...a: unknown[]) => mockEngagementFindByIdAndUpdate(...a)),
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

function makeRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/education/engagements/${VALID_ID}/blockers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const IN_PROGRESS = { _id: VALID_ID, studentId: 'student-001', status: ProjectStatus.IN_PROGRESS };

const VALID_BODY = {
  stuckOn: 'Cannot connect to the MongoDB Atlas cluster from localhost.',
  resolution: 'Whitelisted my IP address in the Atlas network access settings.',
  durationHours: 2.5,
};

describe('POST /api/education/engagements/[id]/blockers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
  });

  it('logs a blocker and returns 201 with the entry', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(IN_PROGRESS) });

    const res = await POST(makeRequest(VALID_BODY), { params: makeParams(VALID_ID) });
    const body = await res.json() as { data: { stuckOn: string; source: string; loggedAt: string } };

    expect(res.status).toBe(201);
    expect(body.data.stuckOn).toBe(VALID_BODY.stuckOn);
    expect(body.data.loggedAt).toBeDefined();
    expect(mockEngagementFindByIdAndUpdate).toHaveBeenCalledWith(
      VALID_ID,
      expect.objectContaining({ $push: expect.objectContaining({ 'documents.blockerLog': expect.objectContaining({ stuckOn: VALID_BODY.stuckOn }) }) }),
      null
    );
  });

  it('returns 404 when the engagement does not exist or is not owned by the student', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await POST(makeRequest(VALID_BODY), { params: makeParams(VALID_ID) });
    expect(res.status).toBe(404);
  });

  it('returns 409 when the engagement is not IN_PROGRESS', async () => {
    mockEngagementFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ ...IN_PROGRESS, status: ProjectStatus.BRIEF_GENERATED }),
    });

    const res = await POST(makeRequest(VALID_BODY), { params: makeParams(VALID_ID) });
    const body = await res.json() as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('ORDER_INVALID_STATUS_TRANSITION');
  });

  it('returns 400 when the engagement ID is not a valid ObjectId', async () => {
    const res = await POST(makeRequest(VALID_BODY), { params: makeParams('not-valid') });
    expect(res.status).toBe(400);
  });

  it('returns 400 when stuckOn is too short', async () => {
    const res = await POST(
      makeRequest({ ...VALID_BODY, stuckOn: 'short' }),
      { params: makeParams(VALID_ID) }
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when durationHours is not positive', async () => {
    const res = await POST(
      makeRequest({ ...VALID_BODY, durationHours: -1 }),
      { params: makeParams(VALID_ID) }
    );
    expect(res.status).toBe(400);
  });

  it('returns 403 when a non-STUDENT calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const res = await POST(makeRequest(VALID_BODY), { params: makeParams(VALID_ID) });
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_BODY), { params: makeParams(VALID_ID) });
    expect(res.status).toBe(401);
  });
});
