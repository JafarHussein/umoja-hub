/**
 * @jest-environment node
 *
 * Tests for POST + GET /api/farmers/payout-requests
 * Covers: auth guard, suspension, one-open-request rule, balance ceiling, happy path.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockComputeEscrowBalance = jest.fn();
jest.mock('@/lib/foodhub/escrow', () => ({
  computeEscrowBalance: (...a: unknown[]) => mockComputeEscrowBalance(...a),
}));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: (...a: unknown[]) => mockUserFindById(...a) },
}));

const mockWRFindOne = jest.fn();
const mockWRFind = jest.fn();
const mockWRCreate = jest.fn();
jest.mock('@/lib/models/WithdrawalRequest.model', () => ({
  __esModule: true,
  default: {
    findOne: (...a: unknown[]) => mockWRFindOne(...a),
    find: (...a: unknown[]) => mockWRFind(...a),
    create: (...a: unknown[]) => mockWRCreate(...a),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST, GET } from '../route';

const FARMER_ID = '507f1f77bcf86cd799439011';
const FARMER_SESSION = { user: { id: FARMER_ID, role: 'FARMER', firstName: 'Kamau' } };
const BUYER_SESSION = { user: { id: 'b1', role: 'BUYER', firstName: 'Bea' } };

function postReq(body: unknown) {
  return new NextRequest('http://localhost/api/farmers/payout-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function selectLean(value: unknown) {
  return { select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }) };
}

describe('POST /api/farmers/payout-requests', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-farmer with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await POST(postReq({ amountKES: 1000 }));
    expect(res.status).toBe(403);
  });

  it('returns 400 on invalid amount', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const res = await POST(postReq({ amountKES: -5 }));
    expect(res.status).toBe(400);
  });

  it('returns 403 when the account is suspended', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockUserFindById.mockReturnValue(selectLean({ status: 'SUSPENDED' }));
    const res = await POST(postReq({ amountKES: 1000 }));
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('ACCOUNT_SUSPENDED');
  });

  it('returns 409 when an open request already exists', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockUserFindById.mockReturnValue(selectLean({ status: 'ACTIVE' }));
    mockWRFindOne.mockReturnValue(selectLean({ _id: 'open-1' }));
    const res = await POST(postReq({ amountKES: 1000 }));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('PAYOUT_REQUEST_PENDING');
  });

  it('returns 409 when the amount exceeds the available balance', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockUserFindById.mockReturnValue(selectLean({ status: 'ACTIVE' }));
    mockWRFindOne.mockReturnValue(selectLean(null));
    mockComputeEscrowBalance.mockResolvedValue({
      grossReceivedKES: 5000,
      committedPayoutsKES: 4500,
      availableKES: 500,
    });
    const res = await POST(postReq({ amountKES: 1000 }));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('PAYOUT_INSUFFICIENT_BALANCE');
    expect(mockWRCreate).not.toHaveBeenCalled();
  });

  it('creates the request and returns 201 with the adjusted balance', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockUserFindById.mockReturnValue(selectLean({ status: 'ACTIVE' }));
    mockWRFindOne.mockReturnValue(selectLean(null));
    mockComputeEscrowBalance.mockResolvedValue({
      grossReceivedKES: 5000,
      committedPayoutsKES: 0,
      availableKES: 5000,
    });
    mockWRCreate.mockResolvedValue({ _id: 'wr-1', farmerId: FARMER_ID, amountKES: 1000 });

    const res = await POST(postReq({ amountKES: 1000 }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(mockWRCreate).toHaveBeenCalled();
    expect(body.balance.availableKES).toBe(4000);
    expect(body.balance.committedPayoutsKES).toBe(1000);
  });
});

describe('GET /api/farmers/payout-requests', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-farmer with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await GET(new NextRequest('http://localhost/api/farmers/payout-requests'));
    expect(res.status).toBe(403);
  });

  it('returns the request history with the live balance', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockWRFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: 'wr-1' }]) }),
      }),
    });
    mockComputeEscrowBalance.mockResolvedValue({
      grossReceivedKES: 5000,
      committedPayoutsKES: 1000,
      availableKES: 4000,
    });

    const res = await GET(new NextRequest('http://localhost/api/farmers/payout-requests'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.balance.availableKES).toBe(4000);
  });
});
