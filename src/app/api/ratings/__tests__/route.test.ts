/**
 * @jest-environment node
 *
 * Integration tests for POST /api/ratings
 * Tests: BUYER creates rating, FARMER blocked, duplicate rating blocked, trust score triggered
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const mockOrderFindById = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: { findById: jest.fn((...args: unknown[]) => mockOrderFindById(...args)) },
}));

const mockRatingCreate = jest.fn();
const mockRatingFind = jest.fn();
jest.mock('@/lib/models/Rating.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn((...args: unknown[]) => mockRatingCreate(...args)),
    find: jest.fn((...args: unknown[]) => mockRatingFind(...args)),
  },
}));

// Mock recalculate as non-blocking
const mockRecalculate = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/trust/farmerTrustCalculator', () => ({
  recalculate: (...args: unknown[]) => mockRecalculate(...args),
}));

import { POST } from '../route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/ratings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const buyerSession = {
  user: { id: 'buyer-456', email: 'buyer@test.com', role: 'BUYER', firstName: 'Wanjiku' },
};

const farmerSession = {
  user: { id: 'farmer-123', email: 'farmer@test.com', role: 'FARMER', firstName: 'Kamau' },
};

const completedOrder = {
  _id: 'order-abc',
  buyerId: 'buyer-456',
  farmerId: 'farmer-123',
  fulfillmentStatus: 'COMPLETED',
};

describe('POST /api/ratings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 201 with ratingId and averageUpdated for valid BUYER rating', async () => {
    mockGetServerSession.mockResolvedValue(buyerSession);
    mockOrderFindById.mockResolvedValue(completedOrder);
    mockRatingCreate.mockResolvedValue({ _id: 'rating-xyz' });
    mockRatingFind.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ rating: 4 }, { rating: 5 }, { rating: 3 }]),
      }),
    });

    const req = makeRequest({ orderId: 'order-abc', rating: 4, comment: 'Good quality tomatoes' });
    const res = await POST(req);
    const body = await res.json() as { data: { ratingId: string; averageUpdated: number } };

    expect(res.status).toBe(201);
    expect(body.data.ratingId).toBe('rating-xyz');
    expect(body.data.averageUpdated).toBe(4); // (4+5+3)/3 = 4
  });

  it('triggers farmerTrustCalculator.recalculate after rating', async () => {
    mockGetServerSession.mockResolvedValue(buyerSession);
    mockOrderFindById.mockResolvedValue(completedOrder);
    mockRatingCreate.mockResolvedValue({ _id: 'rating-xyz' });
    mockRatingFind.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ rating: 5 }]) }),
    });

    const req = makeRequest({ orderId: 'order-abc', rating: 5 });
    await POST(req);

    // Allow async side effect to run
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockRecalculate).toHaveBeenCalledWith('farmer-123');
  });

  it('returns 403 when role is FARMER', async () => {
    mockGetServerSession.mockResolvedValue(farmerSession);

    const req = makeRequest({ orderId: 'order-abc', rating: 5 });
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it('returns 401 when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = makeRequest({ orderId: 'order-abc', rating: 5 });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 404 when order does not exist', async () => {
    mockGetServerSession.mockResolvedValue(buyerSession);
    mockOrderFindById.mockResolvedValue(null);

    const req = makeRequest({ orderId: 'nonexistent', rating: 4 });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it('returns 403 when buyer does not own the order', async () => {
    mockGetServerSession.mockResolvedValue(buyerSession);
    mockOrderFindById.mockResolvedValue({
      ...completedOrder,
      buyerId: 'different-buyer', // not the session buyer
    });

    const req = makeRequest({ orderId: 'order-abc', rating: 4 });
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it('returns 409 when order is not COMPLETED', async () => {
    mockGetServerSession.mockResolvedValue(buyerSession);
    mockOrderFindById.mockResolvedValue({
      ...completedOrder,
      fulfillmentStatus: 'IN_FULFILLMENT',
    });

    const req = makeRequest({ orderId: 'order-abc', rating: 4 });
    const res = await POST(req);

    expect(res.status).toBe(409);
  });

  it('returns 409 DB_DUPLICATE when order already has a rating (Mongoose duplicate key)', async () => {
    mockGetServerSession.mockResolvedValue(buyerSession);
    mockOrderFindById.mockResolvedValue(completedOrder);

    // Mongoose duplicate key error
    const dupError = new Error('Duplicate key') as Error & { code: number };
    dupError.code = 11000;
    mockRatingCreate.mockRejectedValue(dupError);

    const req = makeRequest({ orderId: 'order-abc', rating: 5 });
    const res = await POST(req);

    expect(res.status).toBe(409);
  });

  it('returns 400 VALIDATION_FAILED when rating is out of range', async () => {
    mockGetServerSession.mockResolvedValue(buyerSession);

    const req = makeRequest({ orderId: 'order-abc', rating: 6 }); // max is 5
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 VALIDATION_FAILED when rating is 0', async () => {
    mockGetServerSession.mockResolvedValue(buyerSession);

    const req = makeRequest({ orderId: 'order-abc', rating: 0 }); // min is 1
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
