/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/verify-lecturer
 * Covers: success, 404 not found, 404 not a lecturer, 409 already verified, 400 validation, 403 role guard, 401 unauthed.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFindById = jest.fn();
const mockUserFindByIdAndUpdate = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn((...a: unknown[]) => mockUserFindById(...a)),
    findByIdAndUpdate: jest.fn((...a: unknown[]) => mockUserFindByIdAndUpdate(...a)),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

const ADMIN_SESSION = { user: { id: 'admin-001', role: 'ADMIN', firstName: 'Admin' } };
const LECTURER_SESSION = { user: { id: 'lecturer-001', role: 'LECTURER', firstName: 'Prof' } };

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/verify-lecturer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const UNVERIFIED_LECTURER = {
  _id: 'lecturer-001',
  role: 'LECTURER',
  firstName: 'Prof',
  lecturerData: { isVerified: false, universityAffiliation: 'University of Nairobi' },
};

const VERIFIED_LECTURER = {
  _id: 'lecturer-001',
  role: 'LECTURER',
  firstName: 'Prof',
  lecturerData: { isVerified: true, universityAffiliation: 'University of Nairobi' },
};

describe('POST /api/admin/verify-lecturer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
  });

  it('verifies an unverified lecturer and returns 200', async () => {
    mockUserFindById.mockResolvedValue(UNVERIFIED_LECTURER);

    const res = await POST(makeRequest({ lecturerId: 'lecturer-001' }));
    const body = await res.json() as { data: { lecturerId: string; isVerified: boolean } };

    expect(res.status).toBe(200);
    expect(body.data.lecturerId).toBe('lecturer-001');
    expect(body.data.isVerified).toBe(true);
    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith('lecturer-001', {
      $set: { 'lecturerData.isVerified': true },
    });
  });

  it('returns 404 when the user does not exist', async () => {
    mockUserFindById.mockResolvedValue(null);

    const res = await POST(makeRequest({ lecturerId: 'nonexistent-id' }));

    expect(res.status).toBe(404);
  });

  it('returns 404 when the user is not a LECTURER', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'student-001', role: 'STUDENT' });

    const res = await POST(makeRequest({ lecturerId: 'student-001' }));

    expect(res.status).toBe(404);
  });

  it('returns 409 when the lecturer is already verified', async () => {
    mockUserFindById.mockResolvedValue(VERIFIED_LECTURER);

    const res = await POST(makeRequest({ lecturerId: 'lecturer-001' }));
    const body = await res.json() as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('LECTURER_ALREADY_VERIFIED');
  });

  it('returns 400 when lecturerId is missing', async () => {
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it('returns 403 when a non-ADMIN calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(LECTURER_SESSION);

    const res = await POST(makeRequest({ lecturerId: 'lecturer-001' }));

    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await POST(makeRequest({ lecturerId: 'lecturer-001' }));

    expect(res.status).toBe(401);
  });
});
