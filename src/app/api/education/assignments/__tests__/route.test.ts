/**
 * @jest-environment node
 *
 * Tests for GET /api/education/assignments — the projects a student's lecturers
 * have set that are open to them.
 *
 * The route's whole job is deciding who sees what, and the two rules pull in
 * opposite directions: an open offer is filtered down to the cohort it was
 * aimed at, while a student the lecturer named is never filtered at all. Both
 * halves are checked here, along with the case that reads as an error and is
 * not one — an institution whose lecturers have set nothing yet.
 */

import { NextRequest } from 'next/server';
import { AcademicDiscipline, AcademicProvenance, AssignmentAudience, AssignmentStatus, KnowledgeArea } from '@/types';
import type { AcademicContext } from '@/lib/education/academicContext';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: jest.fn((...a: unknown[]) => mockUserFindById(...a)) },
}));

const mockAssignmentFind = jest.fn();
jest.mock('@/lib/models/ProjectAssignment.model', () => ({
  __esModule: true,
  default: { find: jest.fn((...a: unknown[]) => mockAssignmentFind(...a)) },
}));

const mockEngagementCountDocuments = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn((...a: unknown[]) => mockEngagementCountDocuments(...a)),
  },
}));

const mockLoadAcademicContext = jest.fn();
jest.mock('@/lib/education/academicContext', () => ({
  loadAcademicContext: (...a: unknown[]) => mockLoadAcademicContext(...a),
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET } from '../route';

const STUDENT_ID = 'student-001';
const STUDENT_SESSION = { user: { id: STUDENT_ID, role: 'STUDENT' } };
const LECTURER_SESSION = { user: { id: 'lecturer-001', role: 'LECTURER' } };

const YEAR_THREE_SEMESTER_ONE: AcademicContext = {
  programmeName: 'BSc Computer Science',
  discipline: AcademicDiscipline.CS,
  currentYear: 3,
  currentSemester: 1,
  currentUnits: [
    {
      code: 'CSC 301',
      title: 'Database Systems',
      knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
      areaLabels: ['Database Systems'],
    },
  ],
  knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
  provenance: AcademicProvenance.INSTITUTION_CURRICULUM,
  provenanceLabel: 'From your university curriculum',
  provenanceRecordedAt: new Date('2026-01-10'),
};

function baseAssignment(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'assignment-001',
    lecturerId: { firstName: 'Dr. Grace', lastName: 'Ndungu' },
    institutionId: 'institution-001',
    title: 'Clinic queue and referral tracker',
    problemStatement: 'Referrals move between departments on paper slips that go missing.',
    coreRequirements: ['Register a patient and move them through a referral chain'],
    deliverables: ['A deployed system'],
    technicalConstraints: ['One shared workstation'],
    knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS, KnowledgeArea.INFORMATION_SECURITY],
    targetYear: 3,
    targetSemester: 1,
    audience: AssignmentAudience.COHORT,
    assignedStudentIds: [],
    status: AssignmentStatus.OPEN,
    ...overrides,
  };
}

function studentAt(institutionId: string | undefined): void {
  mockUserFindById.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ studentData: { institutionId } }),
    }),
  });
}

function candidatesAre(records: unknown[]): void {
  mockAssignmentFind.mockReturnValue({
    populate: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(records) }),
    }),
  });
}

function makeRequest() {
  return new NextRequest('http://localhost/api/education/assignments', { method: 'GET' });
}

describe('GET /api/education/assignments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
    studentAt('institution-001');
    mockLoadAcademicContext.mockResolvedValue(YEAR_THREE_SEMESTER_ONE);
    mockEngagementCountDocuments.mockResolvedValue(0);
  });

  it('offers a project aimed at the semester the student is actually in', async () => {
    candidatesAre([baseAssignment()]);

    const res = await GET(makeRequest());
    const body = (await res.json()) as {
      data: Array<{ title: string; setBy: string; exercises: string[]; matchesYourUnits: string[] }>;
    };

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.setBy).toBe('Dr. Grace Ndungu');
    // What the lecturer says it exercises and what the student is studying are
    // two different facts, and the screen shows them side by side.
    expect(body.data[0]?.exercises).toHaveLength(2);
    expect(body.data[0]?.matchesYourUnits).toEqual(['Database Systems']);
  });

  it('withholds a cohort project aimed at another semester', async () => {
    candidatesAre([baseAssignment({ targetYear: 4, targetSemester: 2 })]);

    const res = await GET(makeRequest());
    const body = (await res.json()) as { data: unknown[] };

    expect(body.data).toHaveLength(0);
  });

  it('withholds a cohort project from another institution', async () => {
    candidatesAre([baseAssignment({ institutionId: 'institution-999' })]);

    const res = await GET(makeRequest());
    const body = (await res.json()) as { data: unknown[] };

    expect(body.data).toHaveLength(0);
  });

  it('offers a named project regardless of year, semester or institution', async () => {
    candidatesAre([
      baseAssignment({
        audience: AssignmentAudience.NAMED,
        assignedStudentIds: [STUDENT_ID],
        institutionId: 'institution-999',
        targetYear: 1,
        targetSemester: 2,
      }),
    ]);

    const res = await GET(makeRequest());
    const body = (await res.json()) as { data: unknown[] };

    // A lecturer naming a student is the strongest signal there is, and no
    // cohort filter may overrule it — that is the point of the feature.
    expect(body.data).toHaveLength(1);
  });

  it('hides a named project from everybody who is not on it', async () => {
    candidatesAre([
      baseAssignment({
        audience: AssignmentAudience.NAMED,
        assignedStudentIds: ['student-999'],
      }),
    ]);

    const res = await GET(makeRequest());
    const body = (await res.json()) as { data: unknown[] };

    // Matching the cohort rules must not quietly publish work meant for
    // two people.
    expect(body.data).toHaveLength(0);
  });

  it('marks a project as full once its capacity is taken', async () => {
    candidatesAre([baseAssignment({ capacity: 5 })]);
    mockEngagementCountDocuments.mockResolvedValue(5);

    const res = await GET(makeRequest());
    const body = (await res.json()) as { data: Array<{ full: boolean }> };

    expect(body.data[0]?.full).toBe(true);
  });

  it('leaves a project without a capacity unmarked, however many took it', async () => {
    candidatesAre([baseAssignment()]);

    const res = await GET(makeRequest());
    const body = (await res.json()) as { data: Array<{ full: boolean }> };

    expect(body.data[0]?.full).toBe(false);
    // No limit means nothing to count against, so the count is never made.
    expect(mockEngagementCountDocuments).not.toHaveBeenCalled();
  });

  it('asks only for open projects', async () => {
    candidatesAre([]);

    await GET(makeRequest());

    expect(mockAssignmentFind).toHaveBeenCalledWith(
      expect.objectContaining({ status: AssignmentStatus.OPEN })
    );
  });

  it('returns an empty list, not an error, when no lecturer has set anything', async () => {
    candidatesAre([]);

    const res = await GET(makeRequest());
    const body = (await res.json()) as { data: unknown[] };

    // The ordinary case at most institutions today. The interface reads this
    // as "this track is not open to you yet", which is the truth.
    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(0);
  });

  it('still offers a named project to a student with no coursework on record', async () => {
    mockLoadAcademicContext.mockResolvedValue(null);
    candidatesAre([
      baseAssignment({
        audience: AssignmentAudience.NAMED,
        assignedStudentIds: [STUDENT_ID],
      }),
    ]);

    const res = await GET(makeRequest());
    const body = (await res.json()) as { data: Array<{ matchesYourUnits: string[] }> };

    expect(body.data).toHaveLength(1);
    // Nothing is known about what they are studying, so nothing is claimed.
    expect(body.data[0]?.matchesYourUnits).toEqual([]);
  });

  it('withholds every cohort project from a student with no coursework on record', async () => {
    mockLoadAcademicContext.mockResolvedValue(null);
    candidatesAre([baseAssignment()]);

    const res = await GET(makeRequest());
    const body = (await res.json()) as { data: unknown[] };

    expect(body.data).toHaveLength(0);
  });

  it('returns 403 when a lecturer calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(LECTURER_SESSION);
    expect((await GET(makeRequest())).status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    expect((await GET(makeRequest())).status).toBe(401);
  });
});
