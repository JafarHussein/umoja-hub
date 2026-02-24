/**
 * @jest-environment node
 *
 * Integration tests for POST /api/education/projects/[engagementId]/submit
 * Spec: PHASE_IMPLEMENTATION_MASTER.md Phase 5 §D
 * Critical: documents-complete check, UNDER_PEER_REVIEW status, VerificationAuditLog creation
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const mockEngagementFindOne = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...args: unknown[]) => mockEngagementFindOne(...args)),
  },
}));

const mockPeerReviewCreate = jest.fn();
jest.mock('@/lib/models/PeerReview.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn((...args: unknown[]) => mockPeerReviewCreate(...args)),
  },
}));

const mockAuditCreate = jest.fn();
jest.mock('@/lib/models/VerificationAuditLog.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn((...args: unknown[]) => mockAuditCreate(...args)),
  },
}));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn((...args: unknown[]) => mockUserFindById(...args)),
  },
}));

jest.mock('@/lib/integrations/githubService', () => ({
  getCommitHistory: jest.fn().mockResolvedValue({
    commitCount: 5,
    lastCommitHash: 'abc123',
    commitTimelineHash: 'def456',
  }),
}));

const mockAssignPeerReviewer = jest.fn();
jest.mock('@/lib/educationhub/peerReviewRouter', () => ({
  assignPeerReviewer: (...args: unknown[]) => mockAssignPeerReviewer(...args),
}));

import { POST } from '../route';

function makeRequest(engagementId = 'eng-123'): NextRequest {
  return new NextRequest(
    `http://localhost/api/education/projects/${engagementId}/submit`,
    { method: 'POST' }
  );
}

const studentSession = {
  user: { id: 'student-123', email: 'student@test.com', role: 'STUDENT' },
};

const lecturerSession = {
  user: { id: 'lecturer-789', email: 'lecturer@test.com', role: 'LECTURER' },
};

const completeDocuments = {
  problemBreakdown: { content: 'My breakdown', hash: 'hash1', submittedAt: new Date() },
  approachPlan: { content: 'My plan', hash: 'hash2', submittedAt: new Date() },
  finalReflection: { content: 'My reflection', hash: 'hash3', submittedAt: new Date() },
  blockerLog: [{ description: 'Had a blocker', resolution: 'Fixed it', loggedAt: new Date() }],
  aiUsageLog: [{ prompt: 'Help me debug', response: 'Try this...', loggedAt: new Date() }],
};

function makeMockEngagement(overrides = {}) {
  return {
    _id: 'eng-123',
    studentId: 'student-123',
    track: 'AI_BRIEF',
    tier: 'BEGINNER',
    status: 'IN_PROGRESS',
    brief: { suggestedTechStack: ['JavaScript'] },
    githubRepoName: undefined,
    githubSnapshot: null,
    peerReviewId: null,
    documents: completeDocuments,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('POST /api/education/projects/[engagementId]/submit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = makeRequest();
    const res = await POST(req, { params: Promise.resolve({ engagementId: 'eng-123' }) });

    expect(res.status).toBe(401);
  });

  it('returns 403 when role is LECTURER', async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);

    const req = makeRequest();
    const res = await POST(req, { params: Promise.resolve({ engagementId: 'eng-123' }) });

    expect(res.status).toBe(403);
  });

  it('returns 404 when engagement not found', async () => {
    mockGetServerSession.mockResolvedValue(studentSession);
    mockEngagementFindOne.mockResolvedValue(null);

    const req = makeRequest('nonexistent');
    const res = await POST(req, { params: Promise.resolve({ engagementId: 'nonexistent' }) });

    expect(res.status).toBe(404);
  });

  it('returns 409 when engagement status is not IN_PROGRESS', async () => {
    mockGetServerSession.mockResolvedValue(studentSession);
    mockEngagementFindOne.mockResolvedValue(
      makeMockEngagement({ status: 'UNDER_PEER_REVIEW' })
    );

    const req = makeRequest();
    const res = await POST(req, { params: Promise.resolve({ engagementId: 'eng-123' }) });

    expect(res.status).toBe(409);
  });

  it('returns 409 EDUCATION_DOCUMENTS_INCOMPLETE when documents are missing', async () => {
    mockGetServerSession.mockResolvedValue(studentSession);
    mockEngagementFindOne.mockResolvedValue(
      makeMockEngagement({
        documents: {
          problemBreakdown: { hash: 'hash1' },
          approachPlan: { hash: 'hash2' },
          finalReflection: null, // missing
          blockerLog: [],
          aiUsageLog: [],
        },
      })
    );

    const req = makeRequest();
    const res = await POST(req, { params: Promise.resolve({ engagementId: 'eng-123' }) });
    const data = (await res.json()) as { code: string };

    expect(res.status).toBe(409);
    expect(data.code).toBe('EDUCATION_DOCUMENTS_INCOMPLETE');
  });

  it('returns 200 with UNDER_PEER_REVIEW status and VerificationAuditLog on successful submission', async () => {
    mockGetServerSession.mockResolvedValue(studentSession);
    mockEngagementFindOne.mockResolvedValue(makeMockEngagement());

    mockAssignPeerReviewer.mockResolvedValue('reviewer-456');
    mockPeerReviewCreate.mockResolvedValue({ _id: 'peer-review-001' });
    mockAuditCreate.mockResolvedValue({});

    const req = makeRequest();
    const res = await POST(req, { params: Promise.resolve({ engagementId: 'eng-123' }) });
    const data = (await res.json()) as {
      data: {
        engagementId: string;
        status: string;
        peerReviewStatus: string;
        documentHashes: { problemBreakdown: string };
      };
    };

    expect(res.status).toBe(200);
    expect(data.data.status).toBe('UNDER_PEER_REVIEW');
    expect(data.data.peerReviewStatus).toBe('ASSIGNED');
    expect(data.data.documentHashes.problemBreakdown).toBe('hash1');

    // VerificationAuditLog must be created
    expect(mockAuditCreate).toHaveBeenCalledTimes(1);
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        engagementId: 'eng-123',
        documentHashes: expect.objectContaining({
          problemBreakdown: 'hash1',
        }),
      })
    );
  });

  it('sets peerReviewStatus to WAIVED when no reviewer is available', async () => {
    mockGetServerSession.mockResolvedValue(studentSession);
    mockEngagementFindOne.mockResolvedValue(makeMockEngagement());

    mockAssignPeerReviewer.mockResolvedValue(null); // no reviewer available
    mockPeerReviewCreate.mockResolvedValue({ _id: 'peer-review-002' });
    mockAuditCreate.mockResolvedValue({});

    const req = makeRequest();
    const res = await POST(req, { params: Promise.resolve({ engagementId: 'eng-123' }) });
    const data = (await res.json()) as { data: { peerReviewStatus: string } };

    expect(res.status).toBe(200);
    expect(data.data.peerReviewStatus).toBe('WAIVED');
  });
});
