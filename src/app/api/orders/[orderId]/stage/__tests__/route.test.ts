/**
 * @jest-environment node
 *
 * Tests for PATCH /api/orders/[orderId]/stage — fulfilment progress.
 * The load-bearing property here is what this route does NOT do: it must never
 * touch paymentStatus or fulfillmentStatus, because escrow custody, the
 * mediation gate and the admin ledger all key on those.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockOrderFindById = jest.fn();
const mockOrderFindOneAndUpdate = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: {
    findById: (...a: unknown[]) => mockOrderFindById(...a),
    findOneAndUpdate: (...a: unknown[]) => mockOrderFindOneAndUpdate(...a),
  },
}));

const mockNotify = jest.fn();
jest.mock('@/lib/notifications/notify', () => ({ notify: (...a: unknown[]) => mockNotify(...a) }));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { PATCH } from '../route';

const ORDER_ID = '507f1f77bcf86cd799439011';
const FARMER_ID = '507f1f77bcf86cd799439013';
const BUYER_ID = '507f1f77bcf86cd799439012';

const FARMER_SESSION = { user: { id: FARMER_ID, role: 'FARMER', firstName: 'Wanjiku' } };
const BUYER_SESSION = { user: { id: BUYER_ID, role: 'BUYER', firstName: 'Kamau' } };

function order(overrides: Record<string, unknown> = {}) {
  return {
    _id: ORDER_ID,
    orderReferenceId: 'UMJ-2026-000123',
    cropName: 'Maize',
    buyerId: BUYER_ID,
    farmerId: FARMER_ID,
    paymentStatus: 'PAID',
    fulfillmentStatus: 'IN_FULFILLMENT',
    fulfillmentStage: undefined,
    ...overrides,
  };
}

function req(body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/orders/${ORDER_ID}/stage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
function params(orderId = ORDER_ID) {
  return { params: Promise.resolve({ orderId }) };
}

describe('PATCH /api/orders/[orderId]/stage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderFindOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: ORDER_ID }),
    });
  });

  it('rejects a buyer with 403 — progress is the farmer’s to report', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await PATCH(req({ stage: 'READY' }), params());
    expect(res.status).toBe(403);
  });

  it('rejects a farmer who does not own the order with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockOrderFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(order({ farmerId: 'someone-else' })),
    });
    const res = await PATCH(req({ stage: 'READY' }), params());
    expect(res.status).toBe(403);
  });

  it('rejects an unknown stage with 400', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const res = await PATCH(req({ stage: 'LOADED_ONTO_LORRY' }), params());
    expect(res.status).toBe(400);
  });

  it('advances the stage without touching payment or fulfilment status', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockOrderFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(order()) });

    const res = await PATCH(req({ stage: 'PREPARING' }), params());
    expect(res.status).toBe(200);

    const update = mockOrderFindOneAndUpdate.mock.calls[0]?.[1] as {
      $set: Record<string, unknown>;
      $push: Record<string, unknown>;
    };
    expect(update.$set).toEqual({ fulfillmentStage: 'PREPARING' });
    // The escrow-bearing fields must be untouched.
    expect(update.$set).not.toHaveProperty('paymentStatus');
    expect(update.$set).not.toHaveProperty('fulfillmentStatus');
    expect(update.$push).toHaveProperty('stageHistory');
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ userId: BUYER_ID })
    );
  });

  it('allows skipping ahead — produce collected at the farm never sits READY', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockOrderFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(order({ fulfillmentStage: 'PREPARING' })),
    });

    const res = await PATCH(req({ stage: 'DELIVERED' }), params());
    expect(res.status).toBe(200);
  });

  it('refuses to move progress backwards', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockOrderFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(order({ fulfillmentStage: 'IN_TRANSIT' })),
    });

    const res = await PATCH(req({ stage: 'READY' }), params());

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('ORDER_STAGE_NOT_FORWARD');
    expect(mockOrderFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('refuses to re-report the stage it is already on', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockOrderFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(order({ fulfillmentStage: 'READY' })),
    });

    const res = await PATCH(req({ stage: 'READY' }), params());
    expect(res.status).toBe(409);
  });

  it('refuses progress on an order that is not paid and in fulfilment', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockOrderFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(order({ fulfillmentStatus: 'COMPLETED' })),
    });

    const res = await PATCH(req({ stage: 'DELIVERED' }), params());
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('ORDER_INVALID_STATUS_TRANSITION');
  });

  it('returns 409 when another update won the race', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockOrderFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(order()) });
    mockOrderFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await PATCH(req({ stage: 'PREPARING' }), params());
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('ORDER_STAGE_CONFLICT');
  });
});
