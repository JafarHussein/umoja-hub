/**
 * @jest-environment node
 *
 * GET /api/orders/[orderId].
 *
 * This route did not exist. The order detail screens compensated by fetching
 * the paginated list and searching it client-side, so any order past the first
 * page of 20 was unreachable by direct link — a buyer with 27 orders following
 * a link to their 25th was told "we can't find that order; it may belong to a
 * different account", about their own purchase.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

const BUYER_ID = '507f1f77bcf86cd799439012';
const FARMER_ID = '507f1f77bcf86cd799439013';
const ORDER_ID = '507f1f77bcf86cd799439011';

let storedOrder: Record<string, unknown> | null = null;

jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: { findById: () => ({ lean: () => Promise.resolve(storedOrder) }) },
}));
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: () => ({
      select: () => ({ lean: () => Promise.resolve({ _id: 'u', firstName: 'Wanjiku', lastName: 'Kamau' }) }),
    }),
  },
}));
jest.mock('@/lib/models/Rating.model', () => ({
  __esModule: true,
  default: { exists: () => Promise.resolve(null) },
}));

import { getServerSession } from 'next-auth';
import { GET } from '../route';

function req(): NextRequest {
  return new NextRequest(`http://localhost/api/orders/${ORDER_ID}`);
}
function params(orderId = ORDER_ID) {
  return { params: Promise.resolve({ orderId }) };
}

beforeEach(() => {
  storedOrder = {
    _id: ORDER_ID,
    orderReferenceId: 'UMJ-2026-000001',
    buyerId: BUYER_ID,
    farmerId: FARMER_ID,
    cropName: 'Tomatoes',
    quantityOrdered: 1,
    unit: 'CRATE',
    totalAmountKES: 4956,
    paymentStatus: 'PAID',
    fulfillmentStatus: 'IN_FULFILLMENT',
    fulfillmentType: 'PICKUP',
    buyerPhone: '+254712345678',
    createdAt: new Date('2026-08-04T10:00:00Z'),
  };
});

describe('GET /api/orders/[orderId]', () => {
  it('returns the order to the buyer on it', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: BUYER_ID, role: 'BUYER' } });
    const res = await GET(req(), params());
    const body = (await res.json()) as { data: { orderReferenceId: string } };
    expect(res.status).toBe(200);
    expect(body.data.orderReferenceId).toBe('UMJ-2026-000001');
  });

  it('returns it to the farmer on it', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: FARMER_ID, role: 'FARMER' } });
    expect((await GET(req(), params())).status).toBe(200);
  });

  it('returns it to an administrator', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'someone', role: 'ADMIN' } });
    expect((await GET(req(), params())).status).toBe(200);
  });

  it('tells a stranger the order does not exist, rather than that they may not see it', async () => {
    // 404 not 403: a 403 would confirm the id is real to someone with no
    // business knowing that, and order references are guessable by sequence.
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'nosy', role: 'BUYER' } });
    const res = await GET(req(), params());
    expect(res.status).toBe(404);
  });

  it('gives the same answer for an order that is genuinely missing', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: BUYER_ID, role: 'BUYER' } });
    storedOrder = null;
    expect((await GET(req(), params())).status).toBe(404);
  });

  it('rejects a malformed id without touching the database', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: BUYER_ID, role: 'BUYER' } });
    expect((await GET(req(), params('not-an-object-id'))).status).toBe(404);
  });

  it('requires a session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    expect((await GET(req(), params())).status).toBe(401);
  });
});
