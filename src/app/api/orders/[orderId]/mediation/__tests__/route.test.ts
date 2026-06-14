/**
 * @jest-environment node
 *
 * Tests for POST + GET /api/orders/[orderId]/mediation
 * Covers: buyer-owner gate, order-state + 48h gates, one-open rule, party-read access.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockOrderFindById = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: { findById: (...a: unknown[]) => mockOrderFindById(...a) },
}));

const mockMRFindOne = jest.fn();
const mockMRCreate = jest.fn();
jest.mock('@/lib/models/MediationRequest.model', () => ({
  __esModule: true,
  default: {
    findOne: (...a: unknown[]) => mockMRFindOne(...a),
    create: (...a: unknown[]) => mockMRCreate(...a),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST, GET } from '../route';

const ORDER_ID = '507f1f77bcf86cd799439011';
const BUYER_ID = '507f1f77bcf86cd799439012';
const FARMER_ID = '507f1f77bcf86cd799439013';
const BUYER_SESSION = { user: { id: BUYER_ID, role: 'BUYER', firstName: 'Bea' } };
const FARMER_SESSION = { user: { id: FARMER_ID, role: 'FARMER', firstName: 'Kamau' } };
const ADMIN_SESSION = { user: { id: 'admin-1', role: 'ADMIN', firstName: 'Admin' } };

const VALID_BODY = {
  category: 'NOT_DELIVERED',
  description: 'The maize never arrived after more than two weeks of waiting on this order.',
};

function postReq(body: unknown) {
  return new NextRequest(`http://localhost/api/orders/${ORDER_ID}/mediation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function params(orderId = ORDER_ID) {
  return { params: Promise.resolve({ orderId }) };
}

function orderSelectLean(order: unknown) {
  mockOrderFindById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(order) }) });
}

const PAID_STALE = {
  buyerId: BUYER_ID,
  farmerId: FARMER_ID,
  paymentStatus: 'PAID',
  fulfillmentStatus: 'IN_FULFILLMENT',
  paidAt: new Date(Date.now() - 49 * 60 * 60 * 1000),
};

describe('POST /api/orders/[orderId]/mediation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-buyer with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const res = await POST(postReq(VALID_BODY), params());
    expect(res.status).toBe(403);
  });

  it('returns 400 on an invalid order ID', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await POST(postReq(VALID_BODY), params('not-valid'));
    expect(res.status).toBe(400);
  });

  it('returns 400 on an invalid category', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await POST(postReq({ ...VALID_BODY, category: 'BOGUS' }), params());
    expect(res.status).toBe(400);
  });

  it('returns 403 when the buyer does not own the order', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    orderSelectLean({ ...PAID_STALE, buyerId: 'someone-else' });
    const res = await POST(postReq(VALID_BODY), params());
    expect(res.status).toBe(403);
  });

  it('returns 409 when the order is not PAID + IN_FULFILLMENT', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    orderSelectLean({ ...PAID_STALE, fulfillmentStatus: 'COMPLETED' });
    const res = await POST(postReq(VALID_BODY), params());
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('MEDIATION_INVALID_ORDER_STATE');
  });

  it('returns 409 when escalation is too early', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    orderSelectLean({ ...PAID_STALE, paidAt: new Date(Date.now() - 60 * 60 * 1000) });
    const res = await POST(postReq(VALID_BODY), params());
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('MEDIATION_TOO_EARLY');
  });

  it('returns 409 when an escalation is already open', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    orderSelectLean(PAID_STALE);
    mockMRFindOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'mr-1', status: 'OPEN' }) }) });
    const res = await POST(postReq(VALID_BODY), params());
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('MEDIATION_ALREADY_OPEN');
  });

  it('files the escalation and returns 201', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    orderSelectLean(PAID_STALE);
    mockMRFindOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
    mockMRCreate.mockResolvedValue({ _id: 'mr-1', orderId: ORDER_ID, status: 'OPEN' });

    const res = await POST(postReq(VALID_BODY), params());

    expect(res.status).toBe(201);
    expect(mockMRCreate).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: ORDER_ID, buyerId: BUYER_ID, farmerId: FARMER_ID, status: 'OPEN' })
    );
  });
});

describe('GET /api/orders/[orderId]/mediation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 403 for a non-party, non-admin user', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'stranger', role: 'BUYER' } });
    mockOrderFindById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ buyerId: BUYER_ID, farmerId: FARMER_ID }) }) });
    const res = await GET(new NextRequest('http://localhost'), params());
    expect(res.status).toBe(403);
  });

  it('returns the latest escalation for an admin', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockOrderFindById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ buyerId: BUYER_ID, farmerId: FARMER_ID }) }) });
    mockMRFindOne.mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'mr-1', status: 'OPEN' }) }) });

    const res = await GET(new NextRequest('http://localhost'), params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.status).toBe('OPEN');
  });
});
