/**
 * @jest-environment node
 *
 * RBAC Matrix Integration Tests — Phase 7 Security Hardening
 *
 * One test per row of the RBAC matrix in BUSINESS_LOGIC.md §12.
 * Each test verifies that unauthorized roles receive 401 or 403,
 * and that authorized roles pass the auth guard.
 *
 * Matrix reference:
 * Route Pattern                     FARMER  BUYER  STUDENT  LECTURER  ADMIN
 * ─────────────────────────────────────────────────────────────────────────
 * GET  /api/marketplace              ✓       ✓       ✓        ✓        ✓   (public)
 * POST /api/marketplace              ✓       ✗       ✗        ✗        ✓
 * POST /api/farmers/verify           ✓       ✗       ✗        ✗        ✗
 * POST /api/orders                   ✗       ✓       ✗        ✗        ✗
 * POST /api/assistant                ✓       ✗       ✗        ✗        ✗
 * GET  /api/prices                   ✓       ✗       ✗        ✗        ✓
 * POST /api/education/briefs         ✗       ✗       ✓        ✗        ✗
 * POST /api/education/mentor         ✗       ✗       ✓        ✗        ✗
 * POST /api/education/reviews/[id]   ✗       ✗       ✗        ✓        ✗
 * GET  /api/education/portfolio/[u]  ✓       ✓       ✓        ✓        ✓   (public)
 * GET  /api/experience/verify/[id]   ✓       ✓       ✓        ✓        ✓   (public)
 * GET  /api/admin/*                  ✗       ✗       ✗        ✗        ✓
 */

import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

// Generic model stubs — return safe defaults so auth-blocked routes never
// reach DB calls (they throw before), while authorized-role happy-path tests
// have minimal working stubs.
const noop = jest.fn().mockResolvedValue(null);
const noopFind = jest.fn().mockResolvedValue([]);

jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: noop, findOne: noop, find: noopFind, countDocuments: jest.fn().mockResolvedValue(0) },
}));
jest.mock('@/lib/models/MarketplaceListing.model', () => ({
  __esModule: true,
  default: { find: noopFind, countDocuments: jest.fn().mockResolvedValue(0), create: noop },
}));
jest.mock('@/lib/models/FarmerTrustScore.model', () => ({
  __esModule: true,
  default: { find: noopFind, findOne: noop },
}));
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: { create: noop, findOne: noop, find: noopFind },
}));
jest.mock('@/lib/models/PriceHistory.model', () => ({
  __esModule: true,
  default: { create: noop, find: noopFind },
}));
jest.mock('@/lib/models/PriceAlert.model', () => ({
  __esModule: true,
  default: { find: noopFind },
}));
jest.mock('@/lib/models/ChatSession.model', () => ({
  __esModule: true,
  default: { findOne: noop, findById: noop, create: noop, findByIdAndUpdate: noop },
}));
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: { findOne: noop, findById: noop, create: noop },
}));
jest.mock('@/lib/models/MentorSession.model', () => ({
  __esModule: true,
  default: { findOne: noop, create: noop, findByIdAndUpdate: noop },
}));
jest.mock('@/lib/models/StudentPortfolioStatus.model', () => ({
  __esModule: true,
  default: { findOne: noop, findOneAndUpdate: noop },
}));
jest.mock('@/lib/models/LecturerReview.model', () => ({
  __esModule: true,
  default: { create: noop, findOne: noop },
}));
jest.mock('@/lib/models/PeerReview.model', () => ({
  __esModule: true,
  default: { findOne: noop, create: noop },
}));
jest.mock('@/lib/models/VerificationAuditLog.model', () => ({
  __esModule: true,
  default: { create: noop },
}));
jest.mock('@/lib/models/BriefContextLibrary.model', () => ({
  __esModule: true,
  default: { findOne: noop },
}));
jest.mock('@/lib/models/VerifiedSupplier.model', () => ({
  __esModule: true,
  default: { findById: noop, findOne: noop, find: noopFind, countDocuments: jest.fn().mockResolvedValue(0) },
}));
jest.mock('@/lib/models/KnowledgeArticle.model', () => ({
  __esModule: true,
  default: { findById: noop, findOne: noop, find: noopFind },
}));
jest.mock('@/lib/models/PlatformImpactSummary.model', () => ({
  __esModule: true,
  default: { findOne: noop },
}));

// External service stubs
jest.mock('@/lib/integrations/groqService', () => ({ sendFarmAssistantMessage: jest.fn() }));
jest.mock('@/lib/integrations/openaiService', () => ({
  generateBrief: jest.fn(),
  moderateContent: jest.fn().mockResolvedValue(false),
}));
jest.mock('@/lib/integrations/darajaService', () => ({
  initiateStkPush: jest.fn(),
  verifyDarajaSignature: jest.fn().mockReturnValue(true),
}));
jest.mock('@/lib/integrations/smsService', () => ({ sendSMS: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/integrations/weatherService', () => ({ getWeatherForCounty: jest.fn() }));
jest.mock('@/lib/integrations/githubService', () => ({ searchRepos: jest.fn() }));
jest.mock('@/lib/educationhub/peerReviewRouter', () => ({ assignPeerReviewer: jest.fn() }));
jest.mock('@/lib/educationhub/documentHash', () => ({ hashDocument: jest.fn().mockReturnValue('abc123') }));
jest.mock('@/lib/trust/farmerTrustCalculator', () => ({ recalculate: jest.fn() }));
jest.mock('@/lib/trust/portfolioTierer', () => ({ recalculate: jest.fn() }));
jest.mock('@/lib/rateLimit', () => ({ applyRateLimit: jest.fn().mockReturnValue(null) }));

// ---------------------------------------------------------------------------
// Session factories
// ---------------------------------------------------------------------------

function session(role: string) {
  return { user: { id: 'user123', email: 'test@test.com', role } };
}

const NO_SESSION = null;

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

function req(url: string, method = 'GET', body?: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

// ---------------------------------------------------------------------------
// Row 1: POST /api/marketplace — FARMER ✓ | BUYER ✗ | STUDENT ✗ | LECTURER ✗
// ---------------------------------------------------------------------------

describe('RBAC: POST /api/marketplace', () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/marketplace/route');
    POST = mod.POST;
  });

  beforeEach(() => jest.clearAllMocks());

  it('returns 403 AUTH_FORBIDDEN for BUYER', async () => {
    mockGetServerSession.mockResolvedValue(session('BUYER'));
    const res = await POST(req('/api/marketplace', 'POST', { title: 'test' }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('AUTH_FORBIDDEN');
  });

  it('returns 403 AUTH_FORBIDDEN for STUDENT', async () => {
    mockGetServerSession.mockResolvedValue(session('STUDENT'));
    const res = await POST(req('/api/marketplace', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('returns 403 AUTH_FORBIDDEN for LECTURER', async () => {
    mockGetServerSession.mockResolvedValue(session('LECTURER'));
    const res = await POST(req('/api/marketplace', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('returns 401 AUTH_REQUIRED when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(NO_SESSION);
    const res = await POST(req('/api/marketplace', 'POST', {}));
    expect(res.status).toBe(401);
  });

  it('passes auth guard for FARMER (proceeds to validation)', async () => {
    mockGetServerSession.mockResolvedValue(session('FARMER'));
    // FARMER passes role check — will fail at Zod validation (no required fields)
    // but status ≠ 403/401 confirms role was accepted
    const res = await POST(req('/api/marketplace', 'POST', {}));
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Row 2: POST /api/farmers/verify — FARMER ✓ | others ✗
// ---------------------------------------------------------------------------

describe('RBAC: POST /api/farmers/verify', () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/farmers/verify/route');
    POST = mod.POST as unknown as (req: NextRequest) => Promise<Response>;
  });

  beforeEach(() => jest.clearAllMocks());

  it('returns 403 for BUYER', async () => {
    mockGetServerSession.mockResolvedValue(session('BUYER'));
    const res = await POST(req('/api/farmers/verify', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('returns 403 for STUDENT', async () => {
    mockGetServerSession.mockResolvedValue(session('STUDENT'));
    const res = await POST(req('/api/farmers/verify', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('returns 403 for ADMIN', async () => {
    mockGetServerSession.mockResolvedValue(session('ADMIN'));
    const res = await POST(req('/api/farmers/verify', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('passes auth guard for FARMER', async () => {
    mockGetServerSession.mockResolvedValue(session('FARMER'));
    const res = await POST(req('/api/farmers/verify', 'POST', {}));
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Row 3: POST /api/orders — BUYER ✓ | others ✗
// ---------------------------------------------------------------------------

describe('RBAC: POST /api/orders', () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeAll(async () => {
    jest.mock('@/lib/models/MarketplaceListing.model', () => ({
      __esModule: true,
      default: { findById: noop },
    }));
    const mod = await import('@/app/api/orders/route');
    POST = mod.POST;
  });

  beforeEach(() => jest.clearAllMocks());

  it('returns 403 for FARMER', async () => {
    mockGetServerSession.mockResolvedValue(session('FARMER'));
    const res = await POST(req('/api/orders', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('returns 403 for STUDENT', async () => {
    mockGetServerSession.mockResolvedValue(session('STUDENT'));
    const res = await POST(req('/api/orders', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('returns 403 for LECTURER', async () => {
    mockGetServerSession.mockResolvedValue(session('LECTURER'));
    const res = await POST(req('/api/orders', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('passes auth guard for BUYER', async () => {
    mockGetServerSession.mockResolvedValue(session('BUYER'));
    const res = await POST(req('/api/orders', 'POST', {}));
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Row 4: POST /api/assistant — FARMER ✓ | others ✗
// ---------------------------------------------------------------------------

describe('RBAC: POST /api/assistant', () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/assistant/route');
    POST = mod.POST;
  });

  beforeEach(() => jest.clearAllMocks());

  it('returns 403 for BUYER', async () => {
    mockGetServerSession.mockResolvedValue(session('BUYER'));
    const res = await POST(req('/api/assistant', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('returns 403 for STUDENT', async () => {
    mockGetServerSession.mockResolvedValue(session('STUDENT'));
    const res = await POST(req('/api/assistant', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('returns 403 for LECTURER', async () => {
    mockGetServerSession.mockResolvedValue(session('LECTURER'));
    const res = await POST(req('/api/assistant', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('passes auth guard for FARMER', async () => {
    mockGetServerSession.mockResolvedValue(session('FARMER'));
    const res = await POST(req('/api/assistant', 'POST', {}));
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Row 5: GET /api/prices — FARMER ✓ | ADMIN ✓ | BUYER ✗ | STUDENT ✗ | LECTURER ✗
// ---------------------------------------------------------------------------

describe('RBAC: GET /api/prices', () => {
  let GET: (req: NextRequest) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/prices/route');
    GET = mod.GET;
  });

  beforeEach(() => jest.clearAllMocks());

  it('returns 403 for BUYER', async () => {
    mockGetServerSession.mockResolvedValue(session('BUYER'));
    const res = await GET(req('/api/prices'));
    expect(res.status).toBe(403);
  });

  it('returns 403 for STUDENT', async () => {
    mockGetServerSession.mockResolvedValue(session('STUDENT'));
    const res = await GET(req('/api/prices'));
    expect(res.status).toBe(403);
  });

  it('returns 403 for LECTURER', async () => {
    mockGetServerSession.mockResolvedValue(session('LECTURER'));
    const res = await GET(req('/api/prices'));
    expect(res.status).toBe(403);
  });

  it('passes auth guard for FARMER', async () => {
    mockGetServerSession.mockResolvedValue(session('FARMER'));
    const res = await GET(req('/api/prices'));
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });

  it('passes auth guard for ADMIN', async () => {
    mockGetServerSession.mockResolvedValue(session('ADMIN'));
    const res = await GET(req('/api/prices'));
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Row 6: POST /api/education/briefs — STUDENT ✓ | others ✗
// ---------------------------------------------------------------------------

describe('RBAC: POST /api/education/briefs', () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/education/briefs/route');
    POST = mod.POST;
  });

  beforeEach(() => jest.clearAllMocks());

  it('returns 403 for FARMER', async () => {
    mockGetServerSession.mockResolvedValue(session('FARMER'));
    const res = await POST(req('/api/education/briefs', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('returns 403 for BUYER', async () => {
    mockGetServerSession.mockResolvedValue(session('BUYER'));
    const res = await POST(req('/api/education/briefs', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('returns 403 for LECTURER', async () => {
    mockGetServerSession.mockResolvedValue(session('LECTURER'));
    const res = await POST(req('/api/education/briefs', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('returns 403 for ADMIN', async () => {
    mockGetServerSession.mockResolvedValue(session('ADMIN'));
    const res = await POST(req('/api/education/briefs', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('passes auth guard for STUDENT', async () => {
    mockGetServerSession.mockResolvedValue(session('STUDENT'));
    const res = await POST(req('/api/education/briefs', 'POST', {}));
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Row 7: POST /api/education/mentor — STUDENT ✓ | others ✗
// ---------------------------------------------------------------------------

describe('RBAC: POST /api/education/mentor', () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/education/mentor/route');
    POST = mod.POST;
  });

  beforeEach(() => jest.clearAllMocks());

  it('returns 403 for FARMER', async () => {
    mockGetServerSession.mockResolvedValue(session('FARMER'));
    const res = await POST(req('/api/education/mentor', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('returns 403 for LECTURER', async () => {
    mockGetServerSession.mockResolvedValue(session('LECTURER'));
    const res = await POST(req('/api/education/mentor', 'POST', {}));
    expect(res.status).toBe(403);
  });

  it('passes auth guard for STUDENT', async () => {
    mockGetServerSession.mockResolvedValue(session('STUDENT'));
    const res = await POST(req('/api/education/mentor', 'POST', {}));
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Row 8: POST /api/education/reviews/[id] — LECTURER ✓ | others ✗
// ---------------------------------------------------------------------------

describe('RBAC: POST /api/education/reviews/[engagementId]', () => {
  let POST: (req: NextRequest, ctx: { params: Promise<{ engagementId: string }> }) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/education/reviews/[engagementId]/route');
    POST = mod.POST;
  });

  beforeEach(() => jest.clearAllMocks());

  const ctx = { params: Promise.resolve({ engagementId: '507f1f77bcf86cd799439011' }) };

  it('returns 403 for STUDENT', async () => {
    mockGetServerSession.mockResolvedValue(session('STUDENT'));
    const res = await POST(req('/api/education/reviews/123', 'POST', {}), ctx);
    expect(res.status).toBe(403);
  });

  it('returns 403 for FARMER', async () => {
    mockGetServerSession.mockResolvedValue(session('FARMER'));
    const res = await POST(req('/api/education/reviews/123', 'POST', {}), ctx);
    expect(res.status).toBe(403);
  });

  it('returns 403 for ADMIN', async () => {
    mockGetServerSession.mockResolvedValue(session('ADMIN'));
    const res = await POST(req('/api/education/reviews/123', 'POST', {}), ctx);
    expect(res.status).toBe(403);
  });

  it('passes auth guard for LECTURER', async () => {
    mockGetServerSession.mockResolvedValue(session('LECTURER'));
    const res = await POST(req('/api/education/reviews/123', 'POST', {}), ctx);
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Row 9: GET /api/admin/* — ADMIN ✓ | all others ✗
// ---------------------------------------------------------------------------

describe('RBAC: GET /api/admin/verification-queue', () => {
  let GET: (req: NextRequest) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/admin/verification-queue/route');
    GET = mod.GET;
  });

  beforeEach(() => jest.clearAllMocks());

  it('returns 403 for FARMER', async () => {
    mockGetServerSession.mockResolvedValue(session('FARMER'));
    const res = await GET(req('/api/admin/verification-queue'));
    expect(res.status).toBe(403);
  });

  it('returns 403 for BUYER', async () => {
    mockGetServerSession.mockResolvedValue(session('BUYER'));
    const res = await GET(req('/api/admin/verification-queue'));
    expect(res.status).toBe(403);
  });

  it('returns 403 for STUDENT', async () => {
    mockGetServerSession.mockResolvedValue(session('STUDENT'));
    const res = await GET(req('/api/admin/verification-queue'));
    expect(res.status).toBe(403);
  });

  it('returns 403 for LECTURER', async () => {
    mockGetServerSession.mockResolvedValue(session('LECTURER'));
    const res = await GET(req('/api/admin/verification-queue'));
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(NO_SESSION);
    const res = await GET(req('/api/admin/verification-queue'));
    expect(res.status).toBe(401);
  });

  it('passes auth guard for ADMIN', async () => {
    mockGetServerSession.mockResolvedValue(session('ADMIN'));
    const res = await GET(req('/api/admin/verification-queue'));
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Row 10 & 11: Public routes — no auth required
// GET /api/education/portfolio/[username] and GET /api/experience/verify/[projectId]
// ---------------------------------------------------------------------------

describe('RBAC: Public routes — no auth required', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/education/portfolio/[username] returns non-401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(NO_SESSION);
    const { GET } = await import('@/app/api/education/portfolio/[username]/route');
    const res = await GET(
      req('/api/education/portfolio/wanjiku', 'GET'),
      { params: Promise.resolve({ username: 'wanjiku' }) }
    );
    // Public route: never 401 or 403 (may be 404 if user doesn't exist)
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('GET /api/experience/verify/[projectId] returns non-401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(NO_SESSION);
    const { GET } = await import('@/app/api/experience/verify/[projectId]/route');
    const res = await GET(
      req('/api/experience/verify/507f1f77bcf86cd799439011', 'GET'),
      { params: Promise.resolve({ projectId: '507f1f77bcf86cd799439011' }) }
    );
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
