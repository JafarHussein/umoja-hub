/**
 * @jest-environment node
 *
 * Tests for GET + PATCH /api/groups/[groupId]
 * Covers: group details, member ADD/REMOVE, role guards, validation.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockGroupFindById = jest.fn();
const mockGroupFindByIdAndUpdate = jest.fn();
jest.mock('@/lib/models/FarmerGroup.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn((...a: unknown[]) => mockGroupFindById(...a)),
    findByIdAndUpdate: jest.fn((...a: unknown[]) => mockGroupFindByIdAndUpdate(...a)),
  },
}));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: jest.fn((...a: unknown[]) => mockUserFindById(...a)) },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET, PATCH } from '../route';

const GROUP_ID = '507f1f77bcf86cd799439011';
const CREATOR_ID = '507f1f77bcf86cd799439012';
const MEMBER_ID = '507f1f77bcf86cd799439013';
const TARGET_ID = '507f1f77bcf86cd799439014';

const CREATOR_SESSION = { user: { id: CREATOR_ID, role: 'FARMER', firstName: 'Kamau' } };
const ADMIN_SESSION = { user: { id: 'admin-001', role: 'ADMIN', firstName: 'Admin' } };
const OUTSIDER_SESSION = { user: { id: '507f1f77bcf86cd799439099', role: 'FARMER', firstName: 'Other' } };

const mockGroup = {
  _id: GROUP_ID,
  groupName: 'Nairobi Farmers',
  county: 'Nairobi',
  createdBy: CREATOR_ID,
  members: [CREATOR_ID, MEMBER_ID],
  memberCount: 2,
  status: 'ACTIVE',
};

function makeGetRequest() {
  return new NextRequest(`http://localhost/api/groups/${GROUP_ID}`, { method: 'GET' });
}

function makePatchRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/groups/${GROUP_ID}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeParams(groupId = GROUP_ID) {
  return { params: Promise.resolve({ groupId }) };
}

describe('GET /api/groups/[groupId]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns group data for a member', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(CREATOR_SESSION);
    mockGroupFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockGroup) });

    const res = await GET(makeGetRequest(), makeParams());
    const body = await res.json() as { data: typeof mockGroup };

    expect(res.status).toBe(200);
    expect(body.data.groupName).toBe('Nairobi Farmers');
  });

  it('returns 403 when non-member FARMER requests group', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(OUTSIDER_SESSION);
    mockGroupFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockGroup) });

    const res = await GET(makeGetRequest(), makeParams());

    expect(res.status).toBe(403);
  });

  it('allows ADMIN to view any group', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockGroupFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockGroup) });

    const res = await GET(makeGetRequest(), makeParams());

    expect(res.status).toBe(200);
  });

  it('returns 404 when group does not exist', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockGroupFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await GET(makeGetRequest(), makeParams());

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/groups/[groupId] — member management', () => {
  beforeEach(() => jest.clearAllMocks());

  it('allows creator to ADD a new farmer member', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(CREATOR_SESSION);
    mockGroupFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockGroup) });
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ role: 'FARMER' }) }),
    });
    mockGroupFindByIdAndUpdate.mockResolvedValue({ ...mockGroup, memberCount: 3 });

    const res = await PATCH(makePatchRequest({ action: 'ADD', userId: TARGET_ID }), makeParams());
    const body = await res.json() as { data: { memberCount: number } };

    expect(res.status).toBe(200);
    expect(mockGroupFindByIdAndUpdate).toHaveBeenCalledWith(
      GROUP_ID,
      expect.objectContaining({ $addToSet: expect.anything(), $inc: { memberCount: 1 } }),
      { new: true }
    );
    expect(body.data.memberCount).toBe(3);
  });

  it('allows creator to REMOVE an existing member', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(CREATOR_SESSION);
    mockGroupFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockGroup) });
    mockGroupFindByIdAndUpdate.mockResolvedValue({ ...mockGroup, memberCount: 1 });

    const res = await PATCH(makePatchRequest({ action: 'REMOVE', userId: MEMBER_ID }), makeParams());

    expect(res.status).toBe(200);
    expect(mockGroupFindByIdAndUpdate).toHaveBeenCalledWith(
      GROUP_ID,
      expect.objectContaining({ $pull: expect.anything(), $inc: { memberCount: -1 } }),
      { new: true }
    );
  });

  it('returns 409 when trying to ADD an existing member', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(CREATOR_SESSION);
    mockGroupFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ ...mockGroup, members: [CREATOR_ID, TARGET_ID] }),
    });

    const res = await PATCH(makePatchRequest({ action: 'ADD', userId: TARGET_ID }), makeParams());

    expect(res.status).toBe(409);
    expect(mockGroupFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('returns 409 when trying to REMOVE the group creator', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockGroupFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockGroup) });

    const res = await PATCH(makePatchRequest({ action: 'REMOVE', userId: CREATOR_ID }), makeParams());

    expect(res.status).toBe(409);
  });

  it('returns 403 when non-creator FARMER tries to manage members', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(OUTSIDER_SESSION);
    mockGroupFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockGroup) });

    const res = await PATCH(makePatchRequest({ action: 'ADD', userId: TARGET_ID }), makeParams());

    expect(res.status).toBe(403);
  });

  it('returns 400 on invalid ObjectId', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(CREATOR_SESSION);

    const res = await PATCH(makePatchRequest({ action: 'ADD', userId: 'not-an-objectid' }), makeParams());

    expect(res.status).toBe(400);
  });

  it('returns 400 on validation failure', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(CREATOR_SESSION);

    const res = await PATCH(makePatchRequest({ action: 'INVALID' }), makeParams());

    expect(res.status).toBe(400);
  });
});
