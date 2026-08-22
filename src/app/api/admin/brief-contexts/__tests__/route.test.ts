/**
 * @jest-environment node
 *
 * Tests for GET + PUT /api/admin/brief-contexts
 * Covers: GET success, GET 404 no library, PUT creates version 1 (no prior), PUT increments version,
 * PUT 400 validation, 403 wrong role, 401 unauthenticated.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockLibraryFindOne = jest.fn();
const mockLibraryCreate = jest.fn();
jest.mock('@/lib/models/BriefContextLibrary.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockLibraryFindOne(...a)),
    create: jest.fn((...a: unknown[]) => mockLibraryCreate(...a)),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET, PUT } from '../route';

const ADMIN_SESSION = { user: { id: 'admin-001', role: 'ADMIN', firstName: 'UmojaHub' } };
const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT', firstName: 'Amina' } };

const SAMPLE_CONTEXT = {
  id: 'agri-supply-chain',
  industryName: 'Agricultural Supply Chain',
  description: 'Systems that connect smallholder farmers with buyers.',
  clientPersonaTemplate: {
    businessTypes: ['farmer cooperative'],
    counties: ['Nyandarua'],
    contexts: ['post-harvest loss reduction'],
  },
  problemDomains: ['traceability from farm to market'],
  kenyanConstraints: ['unreliable mobile data connectivity in rural areas'],
  exampleProjects: ['Farmer produce listing and order management system'],
};

const EXISTING_LIBRARY = {
  _id: '64a1b2c3d4e5f6a7b8c9d0e1',
  version: 3,
  updatedBy: 'admin-001',
  contexts: [SAMPLE_CONTEXT],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const VALID_PUT_BODY = { contexts: [SAMPLE_CONTEXT] };

function makeGetRequest() {
  return new NextRequest('http://localhost/api/admin/brief-contexts', { method: 'GET' });
}

function makePutRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/brief-contexts', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/admin/brief-contexts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
  });

  it('returns the latest library version', async () => {
    mockLibraryFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(EXISTING_LIBRARY) }),
    });

    const res = await GET(makeGetRequest());
    const body = await res.json() as { data: { version: number } };

    expect(res.status).toBe(200);
    expect(body.data.version).toBe(3);
  });

  it('returns 404 when no library document exists', async () => {
    mockLibraryFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(404);
  });

  it('returns 403 when a non-ADMIN calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/admin/brief-contexts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
  });

  it('creates version 1 when no prior library exists', async () => {
    mockLibraryFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
    mockLibraryCreate.mockResolvedValue({ ...EXISTING_LIBRARY, version: 1 });

    const res = await PUT(makePutRequest(VALID_PUT_BODY));
    const body = await res.json() as { data: { version: number } };

    expect(res.status).toBe(201);
    expect(mockLibraryCreate).toHaveBeenCalledWith(
      expect.objectContaining({ version: 1, updatedBy: ADMIN_SESSION.user.id })
    );
    expect(body.data.version).toBe(1);
  });

  it('creates version N+1 when a prior library exists at version N', async () => {
    mockLibraryFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(EXISTING_LIBRARY) }),
    });
    mockLibraryCreate.mockResolvedValue({ ...EXISTING_LIBRARY, version: 4 });

    const res = await PUT(makePutRequest(VALID_PUT_BODY));
    const body = await res.json() as { data: { version: number } };

    expect(res.status).toBe(201);
    expect(mockLibraryCreate).toHaveBeenCalledWith(
      expect.objectContaining({ version: 4, updatedBy: ADMIN_SESSION.user.id })
    );
    expect(body.data.version).toBe(4);
  });

  it('returns 400 when contexts array is empty', async () => {
    const res = await PUT(makePutRequest({ contexts: [] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when a context entry is missing required fields', async () => {
    const res = await PUT(makePutRequest({ contexts: [{ id: 'test' }] }));
    expect(res.status).toBe(400);
  });

  it('returns 403 when a non-ADMIN calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
    const res = await PUT(makePutRequest(VALID_PUT_BODY));
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await PUT(makePutRequest(VALID_PUT_BODY));
    expect(res.status).toBe(401);
  });
});
