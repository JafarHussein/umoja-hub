/**
 * @jest-environment node
 *
 * Tests for PATCH /api/education/engagements/[id]/status
 * Covers: BRIEF_GENERATED → IN_PROGRESS, REVISION_REQUIRED → IN_PROGRESS (the
 * revision cycle, which advances the revision number), refusal from a status
 * that is neither, 409 on a concurrent transition, 404 for another student's
 * engagement, 400 validation, 403 wrong role, 401 unauthenticated.
 */

import { NextRequest } from 'next/server';
import { ProjectStatus } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockFindOne = jest.fn();
const mockFindOneAndUpdate = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockFindOne(...a)),
    findOneAndUpdate: jest.fn((...a: unknown[]) => mockFindOneAndUpdate(...a)),
  },
}));


jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { PATCH } from '../route';

const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT', firstName: 'Amina' } };
const LECTURER_SESSION = { user: { id: 'lecturer-001', role: 'LECTURER' } };
const VALID_ID = '64a1b2c3d4e5f6a7b8c9d0e1';

function makeRequest(body: unknown = { status: 'IN_PROGRESS' }) {
  return new NextRequest(`http://localhost/api/education/engagements/${VALID_ID}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: VALID_ID });

function engagementAt(status: ProjectStatus, revisionNumber = 0) {
  return { _id: VALID_ID, studentId: 'student-001', status, revisionNumber };
}

describe('PATCH /api/education/engagements/[id]/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
  });

  it('starts a project from its brief without touching the revision number', async () => {
    mockFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(engagementAt(ProjectStatus.BRIEF_GENERATED)),
    });
    mockFindOneAndUpdate.mockResolvedValue(engagementAt(ProjectStatus.IN_PROGRESS));

    const res = await PATCH(makeRequest(), { params });
    const body = (await res.json()) as { data: { status: string; revisionNumber: number } };

    expect(res.status).toBe(200);
    expect(body.data.status).toBe(ProjectStatus.IN_PROGRESS);
    expect(body.data.revisionNumber).toBe(0);
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ProjectStatus.BRIEF_GENERATED }),
      expect.not.objectContaining({ $inc: expect.anything() }),
      { new: true }
    );
  });

  // The report is no longer reopened here, because it never closed. A version
  // the lecturer sent back is one the student may already answer — the upload
  // rule in `submissionRejection` says so, and it is tested there. Resuming
  // moves the project; nothing about the report has to move with it.

  it('resumes a project the lecturer sent back, and advances the revision', async () => {
    mockFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(engagementAt(ProjectStatus.REVISION_REQUIRED)),
    });
    mockFindOneAndUpdate.mockResolvedValue({
      ...engagementAt(ProjectStatus.IN_PROGRESS),
      revisionNumber: 1,
    });

    const res = await PATCH(makeRequest(), { params });
    const body = (await res.json()) as { data: { status: string; revisionNumber: number } };

    expect(res.status).toBe(200);
    expect(body.data.status).toBe(ProjectStatus.IN_PROGRESS);
    expect(body.data.revisionNumber).toBe(1);
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ProjectStatus.REVISION_REQUIRED }),
      expect.objectContaining({ $inc: { revisionNumber: 1 } }),
      { new: true }
    );
  });

  it('refuses to reopen a verified project', async () => {
    mockFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(engagementAt(ProjectStatus.VERIFIED)),
    });

    const res = await PATCH(makeRequest(), { params });
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('ORDER_INVALID_STATUS_TRANSITION');
    expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns 409 when the status changed between the read and the write', async () => {
    mockFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(engagementAt(ProjectStatus.REVISION_REQUIRED)),
    });
    mockFindOneAndUpdate.mockResolvedValue(null);

    const res = await PATCH(makeRequest(), { params });

    expect(res.status).toBe(409);
  });

  it("returns 404 for an engagement that is not the caller's", async () => {
    mockFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await PATCH(makeRequest(), { params });

    expect(res.status).toBe(404);
  });

  it('rejects a body asking for any other status', async () => {
    const res = await PATCH(makeRequest({ status: 'VERIFIED' }), { params });

    expect(res.status).toBe(400);
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it('rejects a malformed engagement id', async () => {
    const res = await PATCH(makeRequest(), { params: Promise.resolve({ id: 'not-an-id' }) });

    expect(res.status).toBe(400);
  });

  it('refuses a lecturer', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(LECTURER_SESSION);

    const res = await PATCH(makeRequest(), { params });

    expect(res.status).toBe(403);
  });

  it('refuses an unauthenticated caller', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(makeRequest(), { params });

    expect(res.status).toBe(401);
  });
});
