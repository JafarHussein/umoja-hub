/**
 * @jest-environment node
 *
 * Tests for POST /api/buyers/verify
 * Covers: buyer guard, Cloudinary validation, re-submit guards, PENDING write.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFindById = jest.fn();
const mockUserFindByIdAndUpdate = jest.fn().mockResolvedValue({});
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: (...a: unknown[]) => mockUserFindById(...a),
    findByIdAndUpdate: (...a: unknown[]) => mockUserFindByIdAndUpdate(...a),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

const BUYER_SESSION = { user: { id: 'b1', role: 'BUYER', firstName: 'Bea' } };
const FARMER_SESSION = { user: { id: 'f1', role: 'FARMER', firstName: 'Kamau' } };
const CERT = 'https://res.cloudinary.com/umojahub/tcc.pdf';

function postReq(body: unknown) {
  return new NextRequest('http://localhost/api/buyers/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/buyers/verify', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-buyer with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const res = await POST(postReq({ taxComplianceCertificate: CERT }));
    expect(res.status).toBe(403);
  });

  it('returns 400 on a non-Cloudinary certificate', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await POST(postReq({ taxComplianceCertificate: 'https://evil.com/x.pdf' }));
    expect(res.status).toBe(400);
  });

  it('returns 403 when a verification is already pending', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockUserFindById.mockResolvedValue({ buyerData: { verificationStatus: 'PENDING' } });
    const res = await POST(postReq({ taxComplianceCertificate: CERT }));
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('BUYER_VERIFICATION_PENDING');
  });

  it('returns 409 when already approved', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockUserFindById.mockResolvedValue({ buyerData: { verificationStatus: 'APPROVED' } });
    const res = await POST(postReq({ taxComplianceCertificate: CERT }));
    expect(res.status).toBe(409);
  });

  it('records the certificate and moves to PENDING', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    mockUserFindById.mockResolvedValue({ buyerData: { verificationStatus: 'UNSUBMITTED' } });
    const res = await POST(postReq({ taxComplianceCertificate: CERT }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.verificationStatus).toBe('PENDING');
    expect(mockUserFindByIdAndUpdate).toHaveBeenCalled();
  });
});
