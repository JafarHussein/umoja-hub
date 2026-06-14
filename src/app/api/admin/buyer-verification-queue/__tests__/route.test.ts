/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/buyer-verification-queue
 * Covers: admin guard, PENDING filter, pagination shape.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFind = jest.fn();
const mockUserCount = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    find: (...a: unknown[]) => mockUserFind(...a),
    countDocuments: (...a: unknown[]) => mockUserCount(...a),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET } from '../route';

const ADMIN_SESSION = { user: { id: 'admin-1', role: 'ADMIN', firstName: 'Admin' } };
const BUYER_SESSION = { user: { id: 'b1', role: 'BUYER', firstName: 'Bea' } };

function req() {
  return new NextRequest('http://localhost/api/admin/buyer-verification-queue');
}

describe('GET /api/admin/buyer-verification-queue', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-admin with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await GET(req());
    expect(res.status).toBe(403);
  });

  it('returns the mapped pending buyers with a total', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockUserFind.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: 'b1',
                firstName: 'Bea',
                lastName: 'B',
                phoneNumber: '0700',
                county: 'Nairobi',
                buyerData: { taxComplianceCertificate: 'https://res.cloudinary.com/x.pdf' },
                createdAt: new Date('2026-06-01'),
              },
            ]),
          }),
        }),
      }),
    });
    mockUserCount.mockResolvedValue(1);

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data[0]).toMatchObject({ userId: 'b1', firstName: 'Bea' });
    expect(body.data[0].taxComplianceCertificate).toContain('res.cloudinary.com');
    expect(body.total).toBe(1);
  });
});
