/**
 * @jest-environment node
 *
 * Integration tests for POST /api/education/briefs
 * Spec: PHASE_IMPLEMENTATION_MASTER.md Phase 5 §D
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn((...args: unknown[]) => mockUserFindById(...args)),
  },
}));

const mockEngagementCreate = jest.fn();
const mockEngagementFind = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn((...args: unknown[]) => mockEngagementCreate(...args)),
    find: jest.fn((...args: unknown[]) => mockEngagementFind(...args)),
  },
}));

const mockPortfolioFindOneAndUpdate = jest.fn();
jest.mock('@/lib/models/StudentPortfolioStatus.model', () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: jest.fn((...args: unknown[]) => mockPortfolioFindOneAndUpdate(...args)),
  },
}));

const mockLibraryFindOne = jest.fn();
jest.mock('@/lib/models/BriefContextLibrary.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...args: unknown[]) => mockLibraryFindOne(...args)),
  },
}));

const mockGenerateBrief = jest.fn();
jest.mock('@/lib/integrations/openaiService', () => ({
  generateBrief: (...args: unknown[]) => mockGenerateBrief(...args),
}));

const mockBuildPrompt = jest.fn().mockReturnValue('test prompt');
jest.mock('@/lib/educationhub/briefGenerator', () => ({
  buildBriefGenerationPrompt: (...args: unknown[]) => mockBuildPrompt(...args),
}));

import { POST } from '../route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/education/briefs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const studentSession = {
  user: { id: 'student-123', email: 'student@test.com', role: 'STUDENT' },
};

const farmerSession = {
  user: { id: 'farmer-456', email: 'farmer@test.com', role: 'FARMER' },
};

const mockStudentUser = {
  studentData: {
    currentTier: 'BEGINNER',
    primaryInterest: 'mobile apps',
    techStackPreferences: ['React Native'],
    universityAffiliation: 'University of Nairobi',
  },
};

const mockLibrary = {
  _id: 'library-1',
  contexts: [
    {
      id: 'ctx-1',
      industryName: 'Mobile Payments',
      description: 'M-Pesa ecosystem',
      targetTiers: ['BEGINNER'],
    },
  ],
};

const mockBrief = {
  projectTitle: 'M-Pesa SACCO Tracker',
  clientPersona: {
    name: 'Grace Wanjiku',
    businessType: 'SACCO',
    county: 'Kiambu',
    technicalLiteracy: 'low',
    context: 'She runs a local SACCO.',
  },
  problemStatement: 'Members cannot track savings.',
  coreRequirements: ['Track savings', 'M-Pesa integration'],
  technicalRequirements: ['USSD', 'MongoDB'],
  kenyanConstraints: ['2G only', 'M-Pesa payments', 'Low-end Android'],
  outOfScope: ['Web dashboard'],
  successCriteria: ['80% of members can check balance'],
  suggestedTechStack: ['React Native', 'Node.js'],
  estimatedDurationWeeks: 2,
  industryContext: 'SACCO management in Kenya.',
};

describe('POST /api/education/briefs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 AUTH_FORBIDDEN when role is FARMER', async () => {
    mockGetServerSession.mockResolvedValue(farmerSession);

    const req = makeRequest({ track: 'AI_BRIEF', tier: 'BEGINNER' });
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it('returns 401 when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = makeRequest({ track: 'AI_BRIEF', tier: 'BEGINNER' });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 VALIDATION_FAILED for invalid body', async () => {
    mockGetServerSession.mockResolvedValue(studentSession);

    const req = makeRequest({ track: 'INVALID_TRACK' });
    const res = await POST(req);
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when track is OPEN_SOURCE (wrong endpoint)', async () => {
    mockGetServerSession.mockResolvedValue(studentSession);

    const req = makeRequest({ track: 'OPEN_SOURCE', tier: 'BEGINNER' });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 201 with brief JSON on successful generation', async () => {
    mockGetServerSession.mockResolvedValue(studentSession);

    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockStudentUser),
      }),
    });

    mockEngagementFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    mockLibraryFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLibrary),
      }),
    });

    mockGenerateBrief.mockResolvedValue(mockBrief);

    const mockEngagement = {
      _id: 'engagement-abc',
      createdAt: new Date(),
      githubRepoUrl: undefined,
      githubRepoName: undefined,
    };
    mockEngagementCreate.mockResolvedValue(mockEngagement);
    mockPortfolioFindOneAndUpdate.mockResolvedValue({});

    const req = makeRequest({ track: 'AI_BRIEF', tier: 'BEGINNER' });
    const res = await POST(req);
    const body = (await res.json()) as {
      data: { engagementId: string; brief: typeof mockBrief };
    };

    expect(res.status).toBe(201);
    expect(body.data.engagementId).toBe('engagement-abc');
    expect(body.data.brief.projectTitle).toBe('M-Pesa SACCO Tracker');
    expect(mockGenerateBrief).toHaveBeenCalledTimes(1);
  });

  it('returns 503 EDUCATION_BRIEF_GENERATION_FAILED when OpenAI fails', async () => {
    mockGetServerSession.mockResolvedValue(studentSession);

    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockStudentUser),
      }),
    });

    mockEngagementFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    mockLibraryFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLibrary),
      }),
    });

    const { AppError } = await import('@/lib/utils');
    mockGenerateBrief.mockRejectedValue(
      new AppError('Failed to generate', 503, 'EDUCATION_BRIEF_GENERATION_FAILED')
    );

    const req = makeRequest({ track: 'AI_BRIEF', tier: 'BEGINNER' });
    const res = await POST(req);
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(503);
    expect(body.code).toBe('EDUCATION_BRIEF_GENERATION_FAILED');
  });
});
