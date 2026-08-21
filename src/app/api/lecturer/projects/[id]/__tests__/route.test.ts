/**
 * @jest-environment node
 *
 * Tests for PATCH /api/lecturer/projects/[id] — editing or withdrawing work.
 *
 * The rule worth protecting here is that a project students have already
 * started cannot have its brief rewritten underneath them: they chose it, and
 * planned against what it said. Withdrawing the offer is still allowed, which
 * is the difference between closing a project and deleting one.
 */

import { NextRequest } from 'next/server';
import { AssignmentStatus } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: jest.fn((...a: unknown[]) => mockUserFindById(...a)) },
}));

const mockAssignmentFindOne = jest.fn();
jest.mock('@/lib/models/ProjectAssignment.model', () => ({
  __esModule: true,
  default: { findOne: jest.fn((...a: unknown[]) => mockAssignmentFindOne(...a)) },
}));

const mockEngagementCountDocuments = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn((...a: unknown[]) => mockEngagementCountDocuments(...a)),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { PATCH } from '../route';

const ASSIGNMENT_ID = '64a1b2c3d4e5f6a7b8c9d0e1';
const LECTURER_SESSION = { user: { id: 'lecturer-001', role: 'LECTURER' } };
const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT' } };

function lecturerIs(isVerified: boolean): void {
  mockUserFindById.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'lecturer-001', lecturerData: { isVerified } }),
    }),
  });
}

/** A saveable document standing in for the Mongoose one. */
function assignmentDoc(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> & { save: jest.Mock } {
  return {
    _id: ASSIGNMENT_ID,
    lecturerId: 'lecturer-001',
    title: 'Clinic queue and referral tracker',
    status: AssignmentStatus.OPEN,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function request(body: unknown) {
  return new NextRequest(`http://localhost/api/lecturer/projects/${ASSIGNMENT_ID}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}
const params = Promise.resolve({ id: ASSIGNMENT_ID });

describe('PATCH /api/lecturer/projects/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(LECTURER_SESSION);
    lecturerIs(true);
    mockEngagementCountDocuments.mockResolvedValue(0);
  });

  it('edits a project nobody has started yet', async () => {
    const doc = assignmentDoc();
    mockAssignmentFindOne.mockResolvedValue(doc);

    const res = await PATCH(request({ title: 'Clinic queue tracker, revised' }), { params });

    expect(res.status).toBe(200);
    expect(doc.title).toBe('Clinic queue tracker, revised');
    expect(doc.save).toHaveBeenCalled();
  });

  it('refuses to rewrite the brief once a student has started the work', async () => {
    const doc = assignmentDoc();
    mockAssignmentFindOne.mockResolvedValue(doc);
    mockEngagementCountDocuments.mockResolvedValue(3);

    const res = await PATCH(
      request({
        problemStatement:
          'A different problem entirely, about reconciling a sacco fare ledger against conductor returns.',
      }),
      { params }
    );
    const body = (await res.json()) as { code: string; error: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('ASSIGNMENT_IN_USE');
    // The message has to name the number, or the lecturer cannot tell whether
    // this is one student they can talk to or a whole cohort.
    expect(body.error).toContain('3 students');
    expect(doc.save).not.toHaveBeenCalled();
  });

  it('still lets a lecturer close a project students have started', async () => {
    const doc = assignmentDoc();
    mockAssignmentFindOne.mockResolvedValue(doc);
    mockEngagementCountDocuments.mockResolvedValue(3);

    const res = await PATCH(request({ status: AssignmentStatus.CLOSED }), { params });

    // Closing is not deleting: the work already started keeps its brief, and
    // only new take-up stops.
    expect(res.status).toBe(200);
    expect(doc.status).toBe(AssignmentStatus.CLOSED);
    expect(doc.save).toHaveBeenCalled();
  });

  it('leaves fields the lecturer did not mention untouched', async () => {
    const doc = assignmentDoc({
      deliverables: ['A deployed system'],
      technicalConstraints: ['One shared workstation'],
      assignedStudentIds: ['student-001'],
    });
    mockAssignmentFindOne.mockResolvedValue(doc);

    await PATCH(request({ title: 'Clinic queue tracker, revised' }), { params });

    // An edit schema built with `.partial()` kept the create schema's empty
    // defaults, so renaming a project also cleared its deliverables and
    // un-named every student on it — which is the only thing that makes a
    // named project visible to anybody.
    expect(doc.deliverables).toEqual(['A deployed system']);
    expect(doc.technicalConstraints).toEqual(['One shared workstation']);
    expect(doc.assignedStudentIds).toEqual(['student-001']);
  });

  it('treats another lecturer project as one that does not exist', async () => {
    mockAssignmentFindOne.mockResolvedValue(null);

    const res = await PATCH(request({ status: AssignmentStatus.CLOSED }), { params });
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(404);
    expect(body.code).toBe('NOT_FOUND');
    // Ownership is in the query, so a project belonging to somebody else is
    // never loaded in the first place.
    expect(mockAssignmentFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: ASSIGNMENT_ID, lecturerId: 'lecturer-001' })
    );
  });

  it('rejects a status the project cannot be in', async () => {
    mockAssignmentFindOne.mockResolvedValue(assignmentDoc());

    const res = await PATCH(request({ status: 'ARCHIVED' }), { params });
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_FAILED');
    expect(mockAssignmentFindOne).not.toHaveBeenCalled();
  });

  it('returns 403 when the lecturer is not yet verified', async () => {
    lecturerIs(false);

    const res = await PATCH(request({ status: AssignmentStatus.CLOSED }), { params });
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(403);
    expect(body.code).toBe('LECTURER_NOT_VERIFIED');
    expect(mockAssignmentFindOne).not.toHaveBeenCalled();
  });

  it('returns 403 when a student calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
    const res = await PATCH(request({ status: AssignmentStatus.CLOSED }), { params });
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await PATCH(request({ status: AssignmentStatus.CLOSED }), { params });
    expect(res.status).toBe(401);
  });
});
