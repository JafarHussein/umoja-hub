/**
 * @jest-environment node
 *
 * Tests for GET / PUT /api/education/enrolment — the student's own academic
 * record. Covers the role guard, the "not declared yet" state, validation, the
 * suspended-account gate, and the rule that provenance is decided from the data
 * rather than taken from the request.
 */

import { NextRequest } from 'next/server';
import { AcademicDiscipline, AcademicProvenance, KnowledgeArea, UserStatus } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: (...a: unknown[]) => mockUserFindById(...a) },
}));

const mockEnrolmentFindOne = jest.fn();
const mockEnrolmentUpdate = jest.fn();
jest.mock('@/lib/models/StudentEnrolment.model', () => ({
  __esModule: true,
  default: {
    findOne: (...a: unknown[]) => mockEnrolmentFindOne(...a),
    findOneAndUpdate: (...a: unknown[]) => mockEnrolmentUpdate(...a),
  },
}));

const mockResolveEnrolment = jest.fn();
jest.mock('@/lib/education/academicContext', () => {
  const actual = jest.requireActual('@/lib/education/academicContext');
  return {
    ...actual,
    resolveEnrolment: (...a: unknown[]) => mockResolveEnrolment(...a),
  };
});

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET, PUT } from '../route';

const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT', firstName: 'Amina' } };
const LECTURER_SESSION = { user: { id: 'lect-001', role: 'LECTURER', firstName: 'Grace' } };

const STORED = {
  studentId: 'student-001',
  programmeId: 'prog-1',
  programmeName: 'BSc Computer Science',
  discipline: AcademicDiscipline.CS,
  currentYear: 2,
  currentSemester: 1,
  provenance: AcademicProvenance.INSTITUTION_CURRICULUM,
  provenanceRecordedAt: new Date('2026-02-01T00:00:00Z'),
  currentUnits: [
    {
      code: 'SCS 231',
      title: 'Database Systems I',
      knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
    },
  ],
};

const VALID_BODY = {
  programmeName: 'BSc Computer Science',
  discipline: AcademicDiscipline.CS,
  currentYear: 2,
  currentSemester: 1,
  currentUnits: [
    { title: 'Database Systems I', knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS] },
  ],
  completedUnits: [],
};

function getRequest(): NextRequest {
  return new NextRequest('http://localhost/api/education/enrolment', { method: 'GET' });
}

function putRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/education/enrolment', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/education/enrolment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
  });

  it('returns the caller’s academic context', async () => {
    mockEnrolmentFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(STORED) });

    const res = await GET(getRequest());
    const body = (await res.json()) as {
      data: { programmeId: string | null; context: { provenanceLabel: string } };
    };

    expect(res.status).toBe(200);
    expect(body.data.programmeId).toBe('prog-1');
    expect(body.data.context.provenanceLabel).toBe('From your institution’s published curriculum');
  });

  it('scopes the read to the caller — there is no path to anyone else’s record', async () => {
    mockEnrolmentFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    await GET(getRequest());
    expect(mockEnrolmentFindOne).toHaveBeenCalledWith({ studentId: 'student-001' });
  });

  it('returns { data: null } when nothing has been declared — not a 404', async () => {
    mockEnrolmentFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await GET(getRequest());
    const body = (await res.json()) as { data: null };

    expect(res.status).toBe(200);
    expect(body.data).toBeNull();
  });

  it('refuses a lecturer', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(LECTURER_SESSION);
    const res = await GET(getRequest());
    expect(res.status).toBe(403);
  });

  it('refuses an unauthenticated caller', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(getRequest());
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/education/enrolment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          status: UserStatus.ACTIVE,
          studentData: { institutionId: 'inst-1' },
        }),
      }),
    });
    mockResolveEnrolment.mockResolvedValue({
      programmeName: 'BSc Computer Science',
      discipline: AcademicDiscipline.CS,
      currentUnits: STORED.currentUnits,
      completedUnits: [],
      provenance: AcademicProvenance.SELF_DECLARED,
      institutionId: 'inst-1',
    });
    mockEnrolmentUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ ...STORED, provenance: AcademicProvenance.SELF_DECLARED }),
    });
  });

  it('records the enrolment and returns the resulting context', async () => {
    const res = await PUT(putRequest(VALID_BODY));
    const body = (await res.json()) as { data: { context: { provenanceLabel: string } } };

    expect(res.status).toBe(200);
    expect(body.data.context.provenanceLabel).toBe('You told us this');
  });

  it('ignores a provenance asserted by the client', async () => {
    await PUT(putRequest({ ...VALID_BODY, provenance: AcademicProvenance.INSTITUTION_CURRICULUM }));

    const update = mockEnrolmentUpdate.mock.calls[0]![1] as { $set: Record<string, unknown> };
    expect(update.$set.provenance).toBe(AcademicProvenance.SELF_DECLARED);
  });

  it('replaces the record rather than merging last semester into this one', async () => {
    await PUT(putRequest(VALID_BODY));
    const update = mockEnrolmentUpdate.mock.calls[0]![1] as {
      $set: Record<string, unknown>;
      $unset?: Record<string, string>;
    };
    expect(update.$set.currentUnits).toEqual(STORED.currentUnits);
    // No programme resolved, so any previous one is cleared, not left dangling.
    expect(update.$unset).toEqual({ programmeId: '' });
  });

  it('writes against the caller’s own id', async () => {
    await PUT(putRequest(VALID_BODY));
    expect(mockEnrolmentUpdate.mock.calls[0]![0]).toEqual({ studentId: 'student-001' });
  });

  it('rejects a semester with no units', async () => {
    const res = await PUT(putRequest({ ...VALID_BODY, currentUnits: [] }));
    expect(res.status).toBe(400);
    expect(mockEnrolmentUpdate).not.toHaveBeenCalled();
  });

  it('rejects a faculty outside CS and IT', async () => {
    const res = await PUT(putRequest({ ...VALID_BODY, discipline: 'LAW' }));
    expect(res.status).toBe(400);
  });

  it('refuses a suspended account', async () => {
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ status: UserStatus.SUSPENDED }),
      }),
    });

    const res = await PUT(putRequest(VALID_BODY));
    expect(res.status).toBe(403);
    expect(mockEnrolmentUpdate).not.toHaveBeenCalled();
  });

  it('refuses a lecturer', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(LECTURER_SESSION);
    const res = await PUT(putRequest(VALID_BODY));
    expect(res.status).toBe(403);
  });
});
