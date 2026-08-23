/**
 * @jest-environment node
 *
 * Tests for POST /api/education/engagements
 * Covers: success (AI_BRIEF), success (OPEN_SOURCE), the academic-context gate,
 *         the one-active-engagement guard, OPEN_SOURCE URL validation, role
 *         guard, and OpenAI service error propagation.
 */

import { NextRequest } from 'next/server';
import { AcademicDiscipline, AcademicProvenance, KnowledgeArea, ProjectStatus } from '@/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn((...a: unknown[]) => mockUserFindById(...a)),
  },
}));

const mockEngagementFindOne = jest.fn();
const mockEngagementFind = jest.fn();
const mockEngagementCreate = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockEngagementFindOne(...a)),
    find: jest.fn((...a: unknown[]) => mockEngagementFind(...a)),
    create: jest.fn((...a: unknown[]) => mockEngagementCreate(...a)),
  },
}));

const mockLibraryFindOne = jest.fn();
jest.mock('@/lib/models/BriefContextLibrary.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockLibraryFindOne(...a)),
  },
}));

const mockLoadAcademicContext = jest.fn();
jest.mock('@/lib/education/academicContext', () => ({
  loadAcademicContext: (...a: unknown[]) => mockLoadAcademicContext(...a),
}));

const mockGenerateAIBrief = jest.fn();
const mockGenerateOpenSourceBrief = jest.fn();
jest.mock('@/lib/integrations/briefService', () => ({
  generateAIBrief: jest.fn((...a: unknown[]) => mockGenerateAIBrief(...a)),
  generateOpenSourceBrief: jest.fn((...a: unknown[]) => mockGenerateOpenSourceBrief(...a)),
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT', firstName: 'Amina' } };

const ACADEMIC_CONTEXT = {
  programmeName: 'BSc Computer Science',
  discipline: AcademicDiscipline.CS,
  currentYear: 2,
  currentSemester: 1,
  currentUnits: [
    {
      code: 'SCS 231',
      title: 'Database Systems I',
      knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
      areaLabels: ['Database Systems'],
    },
  ],
  knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
  provenance: AcademicProvenance.INSTITUTION_CURRICULUM,
  provenanceLabel: 'From your institution’s published curriculum',
  provenanceRecordedAt: new Date('2026-02-01T00:00:00Z'),
};

const MOCK_AI_BRIEF = { title: 'FarmLink SMS' };
const MOCK_OS_BRIEF = { title: 'Contribute to OpenMRS' };

const MOCK_ENGAGEMENT = {
  _id: 'engagement-001',
  studentId: 'student-001',
  track: 'AI_BRIEF',
  status: ProjectStatus.BRIEF_GENERATED,
  brief: MOCK_AI_BRIEF,
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/education/engagements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function noPriorEngagements(): void {
  mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
  mockEngagementFind.mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
  });
}

function noLibrary(): void {
  mockLibraryFindOne.mockReturnValue({
    sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
  });
}

function libraryWith(contexts: Array<{ id: string; industryName: string }>): void {
  mockLibraryFindOne.mockReturnValue({
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: 'lib-1',
        contexts: contexts.map((c) => ({
          ...c,
          problemDomains: ['crop monitoring'],
          kenyanConstraints: ['mobile-first'],
          clientPersonaTemplate: { businessTypes: ['farm'], counties: ['Kiambu'], contexts: [] },
        })),
      }),
    }),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/education/engagements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          status: 'ACTIVE',
          studentData: { primaryInterest: 'Backend systems' },
        }),
      }),
    });
    mockLoadAcademicContext.mockResolvedValue(ACADEMIC_CONTEXT);
  });

  it('creates AI_BRIEF engagement and returns 201', async () => {
    noPriorEngagements();
    noLibrary();
    mockGenerateAIBrief.mockResolvedValue(MOCK_AI_BRIEF);
    mockEngagementCreate.mockResolvedValue(MOCK_ENGAGEMENT);

    const res = await POST(makeRequest({ track: 'AI_BRIEF' }));
    const body = (await res.json()) as { data: { track: string } };

    expect(res.status).toBe(201);
    expect(body.data.track).toBe('AI_BRIEF');
    expect(mockEngagementCreate).toHaveBeenCalledWith(
      expect.objectContaining({ track: 'AI_BRIEF', status: ProjectStatus.BRIEF_GENERATED })
    );
  });

  it('writes the brief from the student’s coursework', async () => {
    noPriorEngagements();
    noLibrary();
    mockGenerateAIBrief.mockResolvedValue(MOCK_AI_BRIEF);
    mockEngagementCreate.mockResolvedValue(MOCK_ENGAGEMENT);

    await POST(makeRequest({ track: 'AI_BRIEF' }));

    expect(mockGenerateAIBrief).toHaveBeenCalledWith(
      expect.objectContaining({ academic: ACADEMIC_CONTEXT })
    );
  });

  it('refuses to write a brief for a student with no coursework on record', async () => {
    noPriorEngagements();
    mockLoadAcademicContext.mockResolvedValue(null);

    const res = await POST(makeRequest({ track: 'AI_BRIEF' }));
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('ACADEMIC_CONTEXT_REQUIRED');
    expect(mockGenerateAIBrief).not.toHaveBeenCalled();
    expect(mockEngagementCreate).not.toHaveBeenCalled();
  });

  it('falls back to the interest on the student’s profile', async () => {
    noPriorEngagements();
    noLibrary();
    mockGenerateAIBrief.mockResolvedValue(MOCK_AI_BRIEF);
    mockEngagementCreate.mockResolvedValue(MOCK_ENGAGEMENT);

    await POST(makeRequest({ track: 'AI_BRIEF' }));

    expect(mockGenerateAIBrief).toHaveBeenCalledWith(
      expect.objectContaining({ interest: 'Backend systems' })
    );
  });

  it('prefers an interest chosen for this project over the profile', async () => {
    noPriorEngagements();
    noLibrary();
    mockGenerateAIBrief.mockResolvedValue(MOCK_AI_BRIEF);
    mockEngagementCreate.mockResolvedValue(MOCK_ENGAGEMENT);

    await POST(makeRequest({ track: 'AI_BRIEF', interest: 'Information security' }));

    expect(mockGenerateAIBrief).toHaveBeenCalledWith(
      expect.objectContaining({ interest: 'Information security' })
    );
    expect(mockEngagementCreate).toHaveBeenCalledWith(
      expect.objectContaining({ interest: 'Information security' })
    );
  });

  it('selects a problem domain from BriefContextLibrary when available', async () => {
    noPriorEngagements();
    libraryWith([{ id: 'ctx-1', industryName: 'AgriTech' }]);
    mockGenerateAIBrief.mockResolvedValue(MOCK_AI_BRIEF);
    mockEngagementCreate.mockResolvedValue(MOCK_ENGAGEMENT);

    await POST(makeRequest({ track: 'AI_BRIEF' }));

    expect(mockGenerateAIBrief).toHaveBeenCalledWith(
      expect.objectContaining({
        industry: expect.objectContaining({ industryName: 'AgriTech' }),
      })
    );
    expect(mockEngagementCreate).toHaveBeenCalledWith(
      expect.objectContaining({ industryName: 'AgriTech' })
    );
  });

  it('does not put a student back in a domain they have already worked in', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockEngagementFind.mockReturnValue({
      select: jest
        .fn()
        .mockReturnValue({ lean: jest.fn().mockResolvedValue([{ industryName: 'AgriTech' }]) }),
    });
    libraryWith([
      { id: 'ctx-1', industryName: 'AgriTech' },
      { id: 'ctx-2', industryName: 'Health Systems' },
    ]);
    mockGenerateAIBrief.mockResolvedValue(MOCK_AI_BRIEF);
    mockEngagementCreate.mockResolvedValue(MOCK_ENGAGEMENT);

    await POST(makeRequest({ track: 'AI_BRIEF' }));

    expect(mockGenerateAIBrief).toHaveBeenCalledWith(
      expect.objectContaining({
        industry: expect.objectContaining({ industryName: 'Health Systems' }),
      })
    );
  });

  it('falls back into the exhausted library rather than refusing a project', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockEngagementFind.mockReturnValue({
      select: jest
        .fn()
        .mockReturnValue({ lean: jest.fn().mockResolvedValue([{ industryName: 'AgriTech' }]) }),
    });
    libraryWith([{ id: 'ctx-1', industryName: 'AgriTech' }]);
    mockGenerateAIBrief.mockResolvedValue(MOCK_AI_BRIEF);
    mockEngagementCreate.mockResolvedValue(MOCK_ENGAGEMENT);

    await POST(makeRequest({ track: 'AI_BRIEF' }));

    expect(mockGenerateAIBrief).toHaveBeenCalledWith(
      expect.objectContaining({
        industry: expect.objectContaining({ industryName: 'AgriTech' }),
      })
    );
  });

  it('creates OPEN_SOURCE engagement and aims it at the coursework too', async () => {
    noPriorEngagements();
    mockGenerateOpenSourceBrief.mockResolvedValue(MOCK_OS_BRIEF);
    mockEngagementCreate.mockResolvedValue({
      ...MOCK_ENGAGEMENT,
      track: 'OPEN_SOURCE',
      brief: MOCK_OS_BRIEF,
    });

    const res = await POST(
      makeRequest({
        track: 'OPEN_SOURCE',
        githubRepoUrl: 'https://github.com/OpenMRS/openmrs-core',
      })
    );

    expect(res.status).toBe(201);
    expect(mockGenerateOpenSourceBrief).toHaveBeenCalledWith(
      'https://github.com/OpenMRS/openmrs-core',
      'OpenMRS/openmrs-core',
      ACADEMIC_CONTEXT
    );
  });

  it('returns 409 when student already has an active engagement', async () => {
    mockEngagementFindOne.mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue({ _id: 'old-engagement', status: ProjectStatus.IN_PROGRESS }),
    });

    const res = await POST(makeRequest({ track: 'AI_BRIEF' }));
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('ENGAGEMENT_ALREADY_ACTIVE');
    expect(mockEngagementCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when OPEN_SOURCE track is missing githubRepoUrl', async () => {
    const res = await POST(makeRequest({ track: 'OPEN_SOURCE' }));
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_FAILED');
    expect(mockEngagementCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when githubRepoUrl is not a GitHub repository URL', async () => {
    const res = await POST(
      makeRequest({ track: 'OPEN_SOURCE', githubRepoUrl: 'https://gitlab.com/owner/repo' })
    );
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when validation fails (missing track)', async () => {
    const res = await POST(makeRequest({ interest: 'Backend systems' }));

    expect(res.status).toBe(400);
    expect(mockEngagementCreate).not.toHaveBeenCalled();
  });

  it('propagates 503 when OpenAI service fails on AI_BRIEF', async () => {
    const { AppError } = jest.requireActual('@/lib/utils') as {
      AppError: new (msg: string, status: number, code: string) => Error;
    };
    noPriorEngagements();
    noLibrary();
    mockGenerateAIBrief.mockRejectedValue(
      new AppError('Brief generation is temporarily unavailable.', 503, 'AI_SERVICE_ERROR')
    );

    const res = await POST(makeRequest({ track: 'AI_BRIEF' }));

    expect(res.status).toBe(503);
    expect(mockEngagementCreate).not.toHaveBeenCalled();
  });

  it('returns 403 when a non-STUDENT user calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'farmer-001', role: 'FARMER', firstName: 'Kamau' },
    });

    const res = await POST(makeRequest({ track: 'AI_BRIEF' }));

    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await POST(makeRequest({ track: 'AI_BRIEF' }));

    expect(res.status).toBe(401);
  });
});
