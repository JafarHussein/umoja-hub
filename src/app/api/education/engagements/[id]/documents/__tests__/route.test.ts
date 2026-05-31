/**
 * @jest-environment node
 *
 * Tests for PATCH /api/education/engagements/[id]/documents
 * Covers: success with hash, 404 not found, 409 wrong status, 400 invalid ID, 400 validation, 403 role guard, 401 unauthed.
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
import { PATCH } from '../route';

const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT', firstName: 'Amina' } };
const FARMER_SESSION = { user: { id: 'farmer-001', role: 'FARMER', firstName: 'Kamau' } };

const VALID_ID = '64a1b2c3d4e5f6a7b8c9d0e1';

function makeParams(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

function makeRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/education/engagements/${VALID_ID}/documents`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const IN_PROGRESS_ENGAGEMENT = {
  _id: VALID_ID,
  studentId: 'student-001',
  status: ProjectStatus.IN_PROGRESS,
};

const VALID_BODY = {
  documentType: 'problemBreakdown',
  content: 'This is a detailed problem breakdown that meets the minimum character count requirement for submission.',
};

describe('PATCH /api/education/engagements/[id]/documents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
  });

  it('submits a document and returns 200 with a SHA-256 hash', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(IN_PROGRESS_ENGAGEMENT) });

    const res = await PATCH(makeRequest(VALID_BODY), { params: makeParams(VALID_ID) });
    const body = await res.json() as { data: { documentType: string; hash: string; submittedAt: string } };

    expect(res.status).toBe(200);
    expect(body.data.documentType).toBe('problemBreakdown');
    expect(body.data.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(body.data.submittedAt).toBeDefined();
    expect(mockEngagementFindByIdAndUpdate).toHaveBeenCalledWith(
      VALID_ID,
      expect.objectContaining({
        $set: expect.objectContaining({
          'documents.problemBreakdown': expect.objectContaining({ hash: body.data.hash }),
        }),
      }),
      null
    );
  });

  it('returns 404 when the engagement does not exist or is not owned by student', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await PATCH(makeRequest(VALID_BODY), { params: makeParams(VALID_ID) });

    expect(res.status).toBe(404);
  });

  it('returns 409 when engagement status is not IN_PROGRESS', async () => {
    mockEngagementFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        ...IN_PROGRESS_ENGAGEMENT,
        status: ProjectStatus.BRIEF_GENERATED,
      }),
    });

    const res = await PATCH(makeRequest(VALID_BODY), { params: makeParams(VALID_ID) });
    const body = await res.json() as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('ORDER_INVALID_STATUS_TRANSITION');
  });

  it('returns 400 when engagement ID is not a valid ObjectId', async () => {
    const res = await PATCH(makeRequest(VALID_BODY), { params: makeParams('not-an-object-id') });

    expect(res.status).toBe(400);
  });

  it('returns 400 when content is too short', async () => {
    const res = await PATCH(
      makeRequest({ documentType: 'problemBreakdown', content: 'too short' }),
      { params: makeParams(VALID_ID) }
    );

    expect(res.status).toBe(400);
  });

  it('returns 400 when documentType is invalid', async () => {
    const res = await PATCH(
      makeRequest({ documentType: 'blockerLog', content: VALID_BODY.content }),
      { params: makeParams(VALID_ID) }
    );

    expect(res.status).toBe(400);
  });

  it('returns 403 when a non-STUDENT calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);

    const res = await PATCH(makeRequest(VALID_BODY), { params: makeParams(VALID_ID) });

    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(makeRequest(VALID_BODY), { params: makeParams(VALID_ID) });

    expect(res.status).toBe(401);
  });
});
