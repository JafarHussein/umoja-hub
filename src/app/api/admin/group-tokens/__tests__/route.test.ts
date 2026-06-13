/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/group-tokens
 * Covers: admin guard, validation, active-group requirement, mint + audit + SMS.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockGroupFindById = jest.fn();
jest.mock('@/lib/models/FarmerGroup.model', () => ({
  __esModule: true,
  default: { findById: (...a: unknown[]) => mockGroupFindById(...a) },
}));

const mockTokenCreate = jest.fn();
jest.mock('@/lib/models/GroupJoinToken.model', () => ({
  __esModule: true,
  default: { create: (...a: unknown[]) => mockTokenCreate(...a) },
}));

const mockAuditCreate = jest.fn().mockResolvedValue({});
jest.mock('@/lib/models/AdminAuditLog.model', () => ({
  __esModule: true,
  default: { create: (...a: unknown[]) => mockAuditCreate(...a) },
}));

const mockSendSMS = jest.fn().mockResolvedValue({ success: true });
jest.mock('@/lib/integrations/smsService', () => ({ sendSMS: (...a: unknown[]) => mockSendSMS(...a) }));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

const ADMIN_SESSION = { user: { id: 'admin-1', role: 'ADMIN', firstName: 'Admin' } };
const FARMER_SESSION = { user: { id: 'f1', role: 'FARMER', firstName: 'Kamau' } };
const GROUP_ID = '507f1f77bcf86cd799439011';

function postReq(body: unknown) {
  return new NextRequest('http://localhost/api/admin/group-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function groupSelectLean(group: unknown) {
  mockGroupFindById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(group) }) });
}

describe('POST /api/admin/group-tokens', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-admin with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const res = await POST(postReq({ groupId: GROUP_ID, recipientPhone: '0712345678' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 on an invalid recipient phone', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    const res = await POST(postReq({ groupId: GROUP_ID, recipientPhone: '0612345678' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when the group is missing or inactive', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    groupSelectLean({ groupName: 'X', status: 'INACTIVE' });
    const res = await POST(postReq({ groupId: GROUP_ID, recipientPhone: '0712345678' }));
    expect(res.status).toBe(404);
  });

  it('mints a token, audit-logs it and dispatches the SMS', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    groupSelectLean({ groupName: 'Nairobi Farmers', status: 'ACTIVE' });
    mockTokenCreate.mockResolvedValue({});

    const res = await POST(postReq({ groupId: GROUP_ID, recipientPhone: '0712345678' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.token).toMatch(/^[A-Z0-9]{8}$/);
    expect(mockAuditCreate).toHaveBeenCalledWith(expect.objectContaining({ action: 'GROUP_TOKEN_MINTED' }));
    expect(mockSendSMS).toHaveBeenCalled();
  });

  it('re-rolls on a duplicate-key collision', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    groupSelectLean({ groupName: 'Nairobi Farmers', status: 'ACTIVE' });
    mockTokenCreate
      .mockRejectedValueOnce({ code: 11000 })
      .mockResolvedValueOnce({});

    const res = await POST(postReq({ groupId: GROUP_ID, recipientPhone: '0712345678' }));

    expect(res.status).toBe(201);
    expect(mockTokenCreate).toHaveBeenCalledTimes(2);
  });
});
