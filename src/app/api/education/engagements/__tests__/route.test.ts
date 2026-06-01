/**
 * @jest-environment node
 *
 * Tests for POST /api/education/engagements
 * Covers: success (AI_BRIEF), success (OPEN_SOURCE), one-active-engagement guard,
 *         OPEN_SOURCE missing URL, invalid GitHub URL, validation failure, role guard,
 *         OpenAI service error propagation.
 */

import { NextRequest } from 'next/server';
import { ProjectStatus } from '@/types';

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
const mockEngagementCreate = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockEngagementFindOne(...a)),
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

const mockGenerateAIBrief = jest.fn();
const mockGenerateOpenSourceBrief = jest.fn();
jest.mock('@/lib/integrations/openaiService', () => ({
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

const MOCK_AI_BRIEF = {
  title: 'FarmLink SMS',
  clientPersona: { businessType: 'Small farm', county: 'Nakuru', context: 'Sells directly' },
  problemStatement: 'Farmers lack a way to reach buyers.',
  coreRequirements: ['User registration', 'Listing creation', 'SMS alerts'],
  technicalConstraints: ['Works on 2G'],
  kenyanContextConstraints: ['M-Pesa integration'],
  deliverables: ['Working MVP'],
  suggestedTechStack: ['Node.js', 'MongoDB'],
  estimatedComplexity: 'LOW' as const,
};

const MOCK_OS_BRIEF = {
  repoUrl: 'https://github.com/OpenMRS/openmrs-core',
  repoName: 'OpenMRS/openmrs-core',
  contributionGoal: 'Fix a bug in the patient search module.',
  proposedApproach: 'Find a labelled issue, fork, fix, PR.',
};

const MOCK_ENGAGEMENT = {
  _id: 'engagement-001',
  studentId: 'student-001',
  track: 'AI_BRIEF',
  tier: 'BEGINNER',
  status: ProjectStatus.BRIEF_GENERATED,
  brief: MOCK_AI_BRIEF,
};

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/education/engagements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ status: 'ACTIVE' }) }),
    });
  });

  it('creates AI_BRIEF engagement and returns 201', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockLibraryFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
    mockGenerateAIBrief.mockResolvedValue(MOCK_AI_BRIEF);
    mockEngagementCreate.mockResolvedValue(MOCK_ENGAGEMENT);

    const res = await POST(makeRequest({ track: 'AI_BRIEF', tier: 'BEGINNER' }));
    const body = await res.json() as { data: { track: string } };

    expect(res.status).toBe(201);
    expect(body.data.track).toBe('AI_BRIEF');
    expect(mockGenerateAIBrief).toHaveBeenCalledWith('BEGINNER', undefined);
    expect(mockEngagementCreate).toHaveBeenCalledWith(
      expect.objectContaining({ track: 'AI_BRIEF', tier: 'BEGINNER', status: ProjectStatus.BRIEF_GENERATED })
    );
  });

  it('selects a brief context from BriefContextLibrary when available', async () => {
    const mockContext = {
      contexts: [
        {
          id: 'ctx-1',
          industryName: 'AgriTech',
          problemDomains: ['crop monitoring'],
          kenyanConstraints: ['mobile-first'],
          clientPersonaTemplate: { businessTypes: ['farm'], counties: ['Kiambu'], contexts: [] },
          targetTiers: ['BEGINNER'],
        },
      ],
    };
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockLibraryFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockContext) }),
    });
    mockGenerateAIBrief.mockResolvedValue(MOCK_AI_BRIEF);
    mockEngagementCreate.mockResolvedValue(MOCK_ENGAGEMENT);

    await POST(makeRequest({ track: 'AI_BRIEF', tier: 'BEGINNER' }));

    expect(mockGenerateAIBrief).toHaveBeenCalledWith(
      'BEGINNER',
      expect.objectContaining({ industryName: 'AgriTech' })
    );
  });

  it('creates OPEN_SOURCE engagement and returns 201', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockGenerateOpenSourceBrief.mockResolvedValue(MOCK_OS_BRIEF);
    mockEngagementCreate.mockResolvedValue({
      ...MOCK_ENGAGEMENT,
      track: 'OPEN_SOURCE',
      brief: MOCK_OS_BRIEF,
    });

    const res = await POST(
      makeRequest({
        track: 'OPEN_SOURCE',
        tier: 'INTERMEDIATE',
        githubRepoUrl: 'https://github.com/OpenMRS/openmrs-core',
      })
    );
    expect(res.status).toBe(201);
    expect(mockGenerateOpenSourceBrief).toHaveBeenCalledWith(
      'https://github.com/OpenMRS/openmrs-core',
      'OpenMRS/openmrs-core'
    );
  });

  it('returns 409 when student already has an active engagement', async () => {
    mockEngagementFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'old-engagement', status: ProjectStatus.IN_PROGRESS }),
    });

    const res = await POST(makeRequest({ track: 'AI_BRIEF', tier: 'BEGINNER' }));
    const body = await res.json() as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('ENGAGEMENT_ALREADY_ACTIVE');
    expect(mockEngagementCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when OPEN_SOURCE track is missing githubRepoUrl', async () => {
    const res = await POST(makeRequest({ track: 'OPEN_SOURCE', tier: 'BEGINNER' }));
    const body = await res.json() as { code: string };

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_FAILED');
    expect(mockEngagementCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when githubRepoUrl is not a GitHub repository URL', async () => {
    const res = await POST(
      makeRequest({
        track: 'OPEN_SOURCE',
        tier: 'BEGINNER',
        githubRepoUrl: 'https://gitlab.com/owner/repo',
      })
    );
    const body = await res.json() as { code: string };

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when validation fails (missing required fields)', async () => {
    const res = await POST(makeRequest({ tier: 'BEGINNER' })); // missing track

    expect(res.status).toBe(400);
    expect(mockEngagementCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when tier is invalid', async () => {
    const res = await POST(makeRequest({ track: 'AI_BRIEF', tier: 'EXPERT' }));

    expect(res.status).toBe(400);
  });

  it('propagates 503 when OpenAI service fails on AI_BRIEF', async () => {
    const { AppError } = jest.requireActual('@/lib/utils') as { AppError: new (msg: string, status: number, code: string) => Error };
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockLibraryFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
    mockGenerateAIBrief.mockRejectedValue(
      new AppError('Brief generation is temporarily unavailable.', 503, 'AI_SERVICE_ERROR')
    );

    const res = await POST(makeRequest({ track: 'AI_BRIEF', tier: 'BEGINNER' }));

    expect(res.status).toBe(503);
    expect(mockEngagementCreate).not.toHaveBeenCalled();
  });

  it('returns 403 when a non-STUDENT user calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'farmer-001', role: 'FARMER', firstName: 'Kamau' },
    });

    const res = await POST(makeRequest({ track: 'AI_BRIEF', tier: 'BEGINNER' }));

    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await POST(makeRequest({ track: 'AI_BRIEF', tier: 'BEGINNER' }));

    expect(res.status).toBe(401);
  });
});
