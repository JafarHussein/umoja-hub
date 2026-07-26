/**
 * @jest-environment node
 *
 * Integration tests for GET /api/buyers/me (home county for the "Near me" filter).
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: (...args: unknown[]) => mockUserFindById(...args) },
}));

import { GET } from '../route';

function req(): NextRequest {
  return new NextRequest('http://localhost/api/buyers/me');
}

describe('GET /api/buyers/me', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns the county for a signed-in user', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'buyer1' } });
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ county: 'Nakuru' }) }),
    });

    const res = await GET(req());
    const body = (await res.json()) as { data: { county: string | null } };

    expect(res.status).toBe(200);
    expect(body.data.county).toBe('Nakuru');
  });

  it('returns null county when the user has none set', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'buyer1' } });
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({}) }),
    });

    const res = await GET(req());
    const body = (await res.json()) as { data: { county: string | null } };

    expect(res.status).toBe(200);
    expect(body.data.county).toBeNull();
  });
});
