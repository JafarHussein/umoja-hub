/**
 * @jest-environment node
 *
 * Tests for PATCH + GET /api/groups/[groupId]/orders/[orderId]
 * Covers: JOIN (success, auto-advance, already joined, deadline, wrong status, not member)
 *         CLOSE / FULFILL / CANCEL (success and invalid state transitions)
 *         Role guards (farmer cannot CLOSE; admin cannot JOIN)
 *         GET (member access, admin bypass, 404)
 */

import { NextRequest } from 'next/server';
import { GroupOrderStatus } from '@/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockGroupFindOne = jest.fn();
jest.mock('@/lib/models/FarmerGroup.model', () => ({
  __esModule: true,
  default: { findOne: jest.fn((...a: unknown[]) => mockGroupFindOne(...a)) },
}));

const mockGroupOrderFindOne = jest.fn();
const mockGroupOrderSave = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/models/GroupOrder.model', () => ({
  __esModule: true,
  default: { findOne: jest.fn((...a: unknown[]) => mockGroupOrderFindOne(...a)) },
}));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: jest.fn((...a: unknown[]) => mockUserFindById(...a)) },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FUTURE_DEADLINE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const PAST_DEADLINE = new Date(Date.now() - 1000);

const GROUP_ID = 'group-abc';
const ORDER_ID = 'order-xyz';
const FARMER_ID = 'farmer-111';
const OTHER_FARMER_ID = 'farmer-222';

function makeFarmerSession(id = FARMER_ID) {
  return { user: { id, role: 'FARMER', firstName: 'Test' } };
}
const ADMIN_SESSION = { user: { id: 'admin-001', role: 'ADMIN', firstName: 'Admin' } };

function makeGroup(memberIds: string[] = [FARMER_ID]) {
  return {
    members: memberIds,
    status: 'ACTIVE',
  };
}

function makeGroupOrder(overrides: Partial<{
  status: string;
  participatingMembers: Array<{ userId: string; paymentStatus: string }>;
  minimumMembers: number;
  joiningDeadline: Date;
}> = {}) {
  const doc = {
    _id: ORDER_ID,
    groupId: GROUP_ID,
    status: GroupOrderStatus.OPEN,
    minimumMembers: 3,
    joiningDeadline: FUTURE_DEADLINE,
    participatingMembers: [] as Array<{ userId: string; paymentStatus: string }>,
    save: mockGroupOrderSave,
    ...overrides,
  };
  return doc;
}

function makePatchRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/groups/${GROUP_ID}/orders/${ORDER_ID}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGetRequest() {
  return new NextRequest(`http://localhost/api/groups/${GROUP_ID}/orders/${ORDER_ID}`, {
    method: 'GET',
  });
}

// JOIN requires the session farmer to be verified — prime the User mock with
// a verified (or unverified) farmerData lookup result.
function primeJoiningFarmer(isVerified = true) {
  mockUserFindById.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ farmerData: { isVerified } }),
    }),
  });
}

// Lazy-import after mocks are registered
import { PATCH, GET } from '../route';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PATCH /api/groups/[groupId]/orders/[orderId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    primeJoiningFarmer();
  });

  // --- JOIN ---

  it('JOIN: farmer joins successfully — status stays OPEN (threshold not met)', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(makeFarmerSession());
    mockGroupOrderFindOne.mockResolvedValue(makeGroupOrder({ minimumMembers: 5 }));
    mockGroupFindOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeGroup()) }) });

    const res = await PATCH(
      makePatchRequest({ action: 'JOIN' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );

    expect(res.status).toBe(200);
    expect(mockGroupOrderSave).toHaveBeenCalled();
  });

  it('JOIN: auto-advances to MINIMUM_MET when threshold crossed', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(makeFarmerSession());
    // 2 existing members, minimum is 3 — joining makes it 3 → auto-advance
    const order = makeGroupOrder({
      minimumMembers: 3,
      participatingMembers: [
        { userId: OTHER_FARMER_ID, paymentStatus: 'PENDING' },
        { userId: 'farmer-333', paymentStatus: 'PENDING' },
      ],
    });
    mockGroupOrderFindOne.mockResolvedValue(order);
    mockGroupFindOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeGroup()) }) });

    const res = await PATCH(
      makePatchRequest({ action: 'JOIN' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );
    const body = await res.json() as { data: { status: string } };

    expect(res.status).toBe(200);
    expect(body.data.status).toBe(GroupOrderStatus.MINIMUM_MET);
  });

  it('JOIN: returns 403 when the joining farmer is not verified', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(makeFarmerSession());
    mockGroupOrderFindOne.mockResolvedValue(makeGroupOrder());
    mockGroupFindOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeGroup()) }) });
    primeJoiningFarmer(false);

    const res = await PATCH(
      makePatchRequest({ action: 'JOIN' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );

    expect(res.status).toBe(403);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('FARMER_NOT_VERIFIED');
    expect(mockGroupOrderSave).not.toHaveBeenCalled();
  });

  it('JOIN: returns 409 when farmer is already participating', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(makeFarmerSession());
    mockGroupOrderFindOne.mockResolvedValue(
      makeGroupOrder({ participatingMembers: [{ userId: FARMER_ID, paymentStatus: 'PENDING' }] })
    );
    mockGroupFindOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeGroup()) }) });

    const res = await PATCH(
      makePatchRequest({ action: 'JOIN' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );

    expect(res.status).toBe(409);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('ALREADY_PARTICIPATING');
  });

  it('JOIN: returns 409 when joining deadline has passed', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(makeFarmerSession());
    mockGroupOrderFindOne.mockResolvedValue(makeGroupOrder({ joiningDeadline: PAST_DEADLINE }));
    mockGroupFindOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeGroup()) }) });

    const res = await PATCH(
      makePatchRequest({ action: 'JOIN' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );

    expect(res.status).toBe(409);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('GROUP_ORDER_DEADLINE_PASSED');
  });

  it('JOIN: returns 409 when order is CLOSED', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(makeFarmerSession());
    mockGroupOrderFindOne.mockResolvedValue(makeGroupOrder({ status: GroupOrderStatus.CLOSED }));
    mockGroupFindOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeGroup()) }) });

    const res = await PATCH(
      makePatchRequest({ action: 'JOIN' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );

    expect(res.status).toBe(409);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('JOIN: returns 403 when farmer is not a group member', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(makeFarmerSession());
    mockGroupOrderFindOne.mockResolvedValue(makeGroupOrder());
    // Group has no members that match FARMER_ID
    mockGroupFindOne.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeGroup([OTHER_FARMER_ID])) }),
    });

    const res = await PATCH(
      makePatchRequest({ action: 'JOIN' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );

    expect(res.status).toBe(403);
  });

  it('JOIN: returns 403 when admin tries to join', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockGroupOrderFindOne.mockResolvedValue(makeGroupOrder());

    const res = await PATCH(
      makePatchRequest({ action: 'JOIN' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );

    expect(res.status).toBe(403);
  });

  // --- CLOSE ---

  it('CLOSE: admin closes MINIMUM_MET order successfully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockGroupOrderFindOne.mockResolvedValue(makeGroupOrder({ status: GroupOrderStatus.MINIMUM_MET }));

    const res = await PATCH(
      makePatchRequest({ action: 'CLOSE' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );
    const body = await res.json() as { data: { status: string } };

    expect(res.status).toBe(200);
    expect(body.data.status).toBe(GroupOrderStatus.CLOSED);
  });

  it('CLOSE: returns 409 when order is OPEN (not enough members yet)', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockGroupOrderFindOne.mockResolvedValue(makeGroupOrder({ status: GroupOrderStatus.OPEN }));

    const res = await PATCH(
      makePatchRequest({ action: 'CLOSE' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );

    expect(res.status).toBe(409);
  });

  it('CLOSE: returns 403 when non-admin tries to close', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(makeFarmerSession());
    mockGroupOrderFindOne.mockResolvedValue(makeGroupOrder({ status: GroupOrderStatus.MINIMUM_MET }));

    const res = await PATCH(
      makePatchRequest({ action: 'CLOSE' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );

    expect(res.status).toBe(403);
  });

  // --- FULFILL ---

  it('FULFILL: admin fulfills CLOSED order successfully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockGroupOrderFindOne.mockResolvedValue(makeGroupOrder({ status: GroupOrderStatus.CLOSED }));

    const res = await PATCH(
      makePatchRequest({ action: 'FULFILL' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );
    const body = await res.json() as { data: { status: string } };

    expect(res.status).toBe(200);
    expect(body.data.status).toBe(GroupOrderStatus.FULFILLED);
  });

  it('FULFILL: returns 409 when order is not CLOSED', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockGroupOrderFindOne.mockResolvedValue(makeGroupOrder({ status: GroupOrderStatus.MINIMUM_MET }));

    const res = await PATCH(
      makePatchRequest({ action: 'FULFILL' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );

    expect(res.status).toBe(409);
  });

  // --- CANCEL ---

  it('CANCEL: admin cancels OPEN order successfully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockGroupOrderFindOne.mockResolvedValue(makeGroupOrder({ status: GroupOrderStatus.OPEN }));

    const res = await PATCH(
      makePatchRequest({ action: 'CANCEL' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );
    const body = await res.json() as { data: { status: string } };

    expect(res.status).toBe(200);
    expect(body.data.status).toBe(GroupOrderStatus.CANCELLED);
  });

  it('CANCEL: returns 409 when order is already FULFILLED', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockGroupOrderFindOne.mockResolvedValue(makeGroupOrder({ status: GroupOrderStatus.FULFILLED }));

    const res = await PATCH(
      makePatchRequest({ action: 'CANCEL' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );

    expect(res.status).toBe(409);
  });

  // --- General ---

  it('returns 404 when group order does not exist', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockGroupOrderFindOne.mockResolvedValue(null);

    const res = await PATCH(
      makePatchRequest({ action: 'CANCEL' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );

    expect(res.status).toBe(404);
  });

  it('returns 400 when action is invalid', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);

    const res = await PATCH(
      makePatchRequest({ action: 'INVALID_ACTION' }),
      { params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }) }
    );

    expect(res.status).toBe(400);
  });
});

describe('GET /api/groups/[groupId]/orders/[orderId]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns group order for a group member', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(makeFarmerSession());
    mockGroupFindOne.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeGroup()) }),
    });
    const order = makeGroupOrder();
    const mockLean = { lean: jest.fn().mockResolvedValue(order) };
    mockGroupOrderFindOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue(mockLean) }),
    });

    const res = await GET(makeGetRequest(), {
      params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { data: { _id: string } };
    expect(body.data._id).toBe(ORDER_ID);
  });

  it('returns group order for admin without membership check', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    const order = makeGroupOrder();
    const mockLeanAdmin = { lean: jest.fn().mockResolvedValue(order) };
    mockGroupOrderFindOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue(mockLeanAdmin) }),
    });

    const res = await GET(makeGetRequest(), {
      params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }),
    });

    expect(res.status).toBe(200);
    // Admin path skips group membership lookup
    expect(mockGroupFindOne).not.toHaveBeenCalled();
  });

  it('returns 403 when farmer is not a group member', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(makeFarmerSession());
    mockGroupFindOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(makeGroup([OTHER_FARMER_ID])),
      }),
    });

    const res = await GET(makeGetRequest(), {
      params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }),
    });

    expect(res.status).toBe(403);
  });

  it('returns 404 when order does not exist', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockGroupOrderFindOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) }),
    });

    const res = await GET(makeGetRequest(), {
      params: Promise.resolve({ groupId: GROUP_ID, orderId: ORDER_ID }),
    });

    expect(res.status).toBe(404);
  });
});
