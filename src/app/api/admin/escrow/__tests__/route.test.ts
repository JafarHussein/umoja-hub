/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/escrow — the platform escrow read model.
 * Covers: admin guard, totals aggregation, per-order ledger with derived
 * escrow state, and the state filter.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockOrderAggregate = jest.fn();
const mockOrderFind = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: {
    aggregate: (...a: unknown[]) => mockOrderAggregate(...a),
    find: (...a: unknown[]) => mockOrderFind(...a),
  },
}));

const mockMediationDistinct = jest.fn();
jest.mock('@/lib/models/MediationRequest.model', () => ({
  __esModule: true,
  default: { distinct: (...a: unknown[]) => mockMediationDistinct(...a) },
}));

const mockWRAggregate = jest.fn();
jest.mock('@/lib/models/WithdrawalRequest.model', () => ({
  __esModule: true,
  default: { aggregate: (...a: unknown[]) => mockWRAggregate(...a) },
}));

const mockUserFind = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { find: (...a: unknown[]) => mockUserFind(...a) },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET } from '../route';

const ADMIN_SESSION = { user: { id: 'admin-1', role: 'ADMIN', firstName: 'Admin' } };
const BUYER_SESSION = { user: { id: 'b1', role: 'BUYER', firstName: 'Bea' } };

function req(qs = ''): NextRequest {
  return new NextRequest(`http://localhost/api/admin/escrow${qs}`);
}

function selectSortLimitLean(value: unknown) {
  return {
    select: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(value) }),
      }),
    }),
  };
}

describe('GET /api/admin/escrow', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-admin with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await GET(req());
    expect(res.status).toBe(403);
  });

  it('returns custody totals and a ledger with derived escrow state', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    mockMediationDistinct.mockResolvedValue(['o-dispute']);

    // Totals aggregations, matched by the pipeline's $match shape.
    mockOrderAggregate.mockImplementation(
      (pipeline: Array<{ $match?: Record<string, unknown> }>) => {
        const m = pipeline[0]?.$match ?? {};
        if (m._id) return Promise.resolve([{ total: 4000, count: 1 }]); // in-dispute
        if (m.fulfillmentStatus === 'COMPLETED') return Promise.resolve([{ total: 9000, count: 3 }]);
        if (m.fulfillmentStatus === 'IN_FULFILLMENT') return Promise.resolve([{ total: 4000, count: 2 }]);
        if (m.paymentStatus === 'REFUNDED') return Promise.resolve([{ total: 1500, count: 1 }]);
        return Promise.resolve([]);
      }
    );
    mockWRAggregate.mockResolvedValue([{ total: 7000 }]);

    mockOrderFind.mockReturnValue(
      selectSortLimitLean([
        {
          _id: 'o1',
          orderReferenceId: 'UMJ-1',
          cropName: 'Maize',
          totalAmountKES: 2000,
          paymentStatus: 'PAID',
          fulfillmentStatus: 'COMPLETED',
          farmerId: 'f1',
          buyerId: 'b1',
          paidAt: new Date('2026-06-01'),
        },
        {
          _id: 'o-dispute',
          orderReferenceId: 'UMJ-2',
          cropName: 'Beans',
          totalAmountKES: 4000,
          paymentStatus: 'PAID',
          fulfillmentStatus: 'IN_FULFILLMENT',
          farmerId: 'f1',
          buyerId: 'b2',
          paidAt: new Date('2026-06-02'),
        },
      ])
    );
    mockUserFind.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: 'f1', firstName: 'Kamau', lastName: 'N' },
          { _id: 'b1', firstName: 'Bea', lastName: 'B' },
          { _id: 'b2', firstName: 'Otieno', lastName: 'O' },
        ]),
      }),
    });

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.totals).toMatchObject({
      heldKES: 4000,
      releasableKES: 9000,
      inDisputeKES: 4000,
      refundedKES: 1500,
      settledKES: 7000,
    });
    // First order: PAID + COMPLETED → RELEASABLE.
    expect(body.data.lineItems[0]).toMatchObject({
      orderReferenceId: 'UMJ-1',
      escrowState: 'RELEASABLE',
      farmerName: 'Kamau N',
    });
    // Second order is in the open-mediation set → HELD_UNDER_REVIEW.
    expect(body.data.lineItems[1].escrowState).toBe('HELD_UNDER_REVIEW');
  });

  it('rejects an invalid cursor with 400', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    const res = await GET(req('?cursor=not-an-id'));
    expect(res.status).toBe(400);
  });
});
