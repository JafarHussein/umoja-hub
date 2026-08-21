/**
 * @jest-environment node
 *
 * Tests for GET and POST /api/lecturer/projects — the work a lecturer sets.
 *
 * Two boundaries carry most of the weight here. Verification is one: setting
 * the work a student will spend a semester on is at least as consequential as
 * marking it, so the same gate governs both. The cohort boundary is the other,
 * running in the opposite direction to the review queue — a lecturer may name
 * their own students and nobody else's.
 */

import { NextRequest } from 'next/server';
import { AssignmentAudience, AssignmentStatus, KnowledgeArea } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFindById = jest.fn();
const mockUserCountDocuments = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn((...a: unknown[]) => mockUserFindById(...a)),
    countDocuments: jest.fn((...a: unknown[]) => mockUserCountDocuments(...a)),
  },
}));

const mockAssignmentFind = jest.fn();
const mockAssignmentCreate = jest.fn();
jest.mock('@/lib/models/ProjectAssignment.model', () => ({
  __esModule: true,
  default: {
    find: jest.fn((...a: unknown[]) => mockAssignmentFind(...a)),
    create: jest.fn((...a: unknown[]) => mockAssignmentCreate(...a)),
  },
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
import { GET, POST } from '../route';

const LECTURER_SESSION = { user: { id: 'lecturer-001', role: 'LECTURER' } };
const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT' } };

const VERIFIED_LECTURER = {
  _id: 'lecturer-001',
  firstName: 'Dr. Grace',
  lastName: 'Ndungu',
  lecturerData: { isVerified: true, institutionId: 'institution-001' },
};
const UNVERIFIED_LECTURER = {
  _id: 'lecturer-001',
  firstName: 'Prof. James',
  lastName: 'Mwangi',
  lecturerData: { isVerified: false, institutionId: 'institution-001' },
};
const UNAFFILIATED_LECTURER = {
  _id: 'lecturer-001',
  firstName: 'Dr. Grace',
  lastName: 'Ndungu',
  lecturerData: { isVerified: true },
};

function lecturerIs(record: unknown): void {
  mockUserFindById.mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(record) }),
  });
}

function projectsAre(records: unknown[]): void {
  mockAssignmentFind.mockReturnValue({
    sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(records) }),
  });
}

const VALID_BODY = {
  title: 'Clinic queue and referral tracker',
  problemStatement:
    'Patients are referred between three departments on paper slips that go missing, and nobody can say how long a patient has been waiting.',
  coreRequirements: ['Register a patient and move them through a referral chain'],
  deliverables: ['A deployed system'],
  technicalConstraints: ['One shared workstation'],
  knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
  targetYear: 3,
  targetSemester: 1,
  audience: AssignmentAudience.COHORT,
  assignedStudentIds: [],
  status: AssignmentStatus.OPEN,
};

const STUDENT_A = '64a1b2c3d4e5f6a7b8c9d0e1';
const STUDENT_B = '64a1b2c3d4e5f6a7b8c9d0e2';

function getRequest() {
  return new NextRequest('http://localhost/api/lecturer/projects', { method: 'GET' });
}
function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/lecturer/projects', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('GET /api/lecturer/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(LECTURER_SESSION);
  });

  it('returns the lecturer own projects with how many students took each up', async () => {
    lecturerIs(VERIFIED_LECTURER);
    projectsAre([{ _id: 'assignment-001', title: 'Clinic queue tracker' }]);
    mockEngagementCountDocuments.mockResolvedValue(4);

    const res = await GET(getRequest());
    const body = (await res.json()) as { data: Array<{ _id: string; takenBy: number }> };

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.takenBy).toBe(4);
    // Scoped in the query itself, not filtered afterwards.
    expect(mockAssignmentFind).toHaveBeenCalledWith(
      expect.objectContaining({ lecturerId: 'lecturer-001' })
    );
  });

  it('returns an empty list for a lecturer who has set nothing yet', async () => {
    lecturerIs(VERIFIED_LECTURER);
    projectsAre([]);

    const res = await GET(getRequest());
    const body = (await res.json()) as { data: unknown[] };

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(0);
  });

  it('returns 403 when the lecturer is not yet verified', async () => {
    lecturerIs(UNVERIFIED_LECTURER);

    const res = await GET(getRequest());
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(403);
    expect(body.code).toBe('LECTURER_NOT_VERIFIED');
    expect(mockAssignmentFind).not.toHaveBeenCalled();
  });

  it('returns 409 when the lecturer has no institution to set work for', async () => {
    lecturerIs(UNAFFILIATED_LECTURER);

    const res = await GET(getRequest());
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('LECTURER_NOT_AFFILIATED');
  });

  it('returns 403 when a student calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
    expect((await GET(getRequest())).status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    expect((await GET(getRequest())).status).toBe(401);
  });
});

describe('POST /api/lecturer/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(LECTURER_SESSION);
    mockAssignmentCreate.mockImplementation((doc: Record<string, unknown>) =>
      Promise.resolve({ ...doc, _id: 'assignment-001' })
    );
  });

  it('writes the project against the lecturer own institution', async () => {
    lecturerIs(VERIFIED_LECTURER);

    const res = await POST(postRequest(VALID_BODY));

    expect(res.status).toBe(201);
    // The lecturer and the institution come from the session and the record,
    // never from the request: a caller cannot file work under somebody else.
    expect(mockAssignmentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        lecturerId: 'lecturer-001',
        institutionId: 'institution-001',
        title: VALID_BODY.title,
      })
    );
  });

  it('omits capacity entirely when none was given', async () => {
    lecturerIs(VERIFIED_LECTURER);

    await POST(postRequest(VALID_BODY));

    // "No limit" is the absence of a capacity, not a capacity of nothing — a
    // stored `undefined` would still be a key the read path has to interpret.
    const created = mockAssignmentCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(created, 'capacity')).toBe(false);
  });

  it('keeps a capacity that was given', async () => {
    lecturerIs(VERIFIED_LECTURER);

    await POST(postRequest({ ...VALID_BODY, capacity: 12 }));

    expect(mockAssignmentCreate).toHaveBeenCalledWith(expect.objectContaining({ capacity: 12 }));
  });

  it('accepts named students who are the lecturer own', async () => {
    lecturerIs(VERIFIED_LECTURER);
    mockUserCountDocuments.mockResolvedValue(2);

    const res = await POST(
      postRequest({
        ...VALID_BODY,
        audience: AssignmentAudience.NAMED,
        assignedStudentIds: [STUDENT_A, STUDENT_B],
      })
    );

    expect(res.status).toBe(201);
    expect(mockUserCountDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ 'studentData.institutionId': 'institution-001' })
    );
  });

  it('refuses to name a student from another institution', async () => {
    lecturerIs(VERIFIED_LECTURER);
    // Only one of the two named students is in this lecturer's cohort.
    mockUserCountDocuments.mockResolvedValue(1);

    const res = await POST(
      postRequest({
        ...VALID_BODY,
        audience: AssignmentAudience.NAMED,
        assignedStudentIds: [STUDENT_A, STUDENT_B],
      })
    );
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(403);
    expect(body.code).toBe('STUDENT_OUTSIDE_COHORT');
    expect(mockAssignmentCreate).not.toHaveBeenCalled();
  });

  it('refuses a named project with nobody on it', async () => {
    lecturerIs(VERIFIED_LECTURER);

    const res = await POST(
      postRequest({ ...VALID_BODY, audience: AssignmentAudience.NAMED, assignedStudentIds: [] })
    );
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_FAILED');
    expect(mockAssignmentCreate).not.toHaveBeenCalled();
  });

  it('rejects a project that does not say which subjects it exercises', async () => {
    lecturerIs(VERIFIED_LECTURER);

    const res = await POST(postRequest({ ...VALID_BODY, knowledgeAreas: [] }));
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_FAILED');
  });

  it('returns 403 when an unverified lecturer tries to set work', async () => {
    lecturerIs(UNVERIFIED_LECTURER);

    const res = await POST(postRequest(VALID_BODY));
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(403);
    expect(body.code).toBe('LECTURER_NOT_VERIFIED');
    expect(mockAssignmentCreate).not.toHaveBeenCalled();
  });

  it('returns 403 when a student tries to set work', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
    expect((await POST(postRequest(VALID_BODY))).status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    expect((await POST(postRequest(VALID_BODY))).status).toBe(401);
  });
});
