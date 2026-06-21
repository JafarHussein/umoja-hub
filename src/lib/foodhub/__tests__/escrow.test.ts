/**
 * @jest-environment node
 *
 * Tests for computeEscrowBalance — the derived escrow balance.
 * Verifies that releasable funds are gated on COMPLETED (buyer-confirmed
 * receipt), held funds are PAID-but-in-fulfilment, open mediations surface as
 * inDispute, and available = max(0, releasable − committed).
 */

const mockOrderAggregate = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: { aggregate: (...a: unknown[]) => mockOrderAggregate(...a) },
}));

const mockWRAggregate = jest.fn();
jest.mock('@/lib/models/WithdrawalRequest.model', () => ({
  __esModule: true,
  default: { aggregate: (...a: unknown[]) => mockWRAggregate(...a) },
}));

const mockMediationDistinct = jest.fn();
jest.mock('@/lib/models/MediationRequest.model', () => ({
  __esModule: true,
  default: { distinct: (...a: unknown[]) => mockMediationDistinct(...a) },
}));

import { computeEscrowBalance } from '../escrow';
import { OrderPaymentStatus, OrderFulfillmentStatus } from '@/types';

const FARMER_ID = '507f1f77bcf86cd799439011';

// The Order.aggregate calls fire in a fixed order inside computeEscrowBalance:
// [0] gross (all PAID), [1] held (PAID + IN_FULFILLMENT), [2] releasable
// (COMPLETED), [3] inDispute (only when disputed order ids exist).
function wireOrderAggregate(totals: { gross: number; held: number; releasable: number; inDispute?: number }) {
  mockOrderAggregate.mockImplementation((pipeline: Array<{ $match?: Record<string, unknown> }>) => {
    const match = pipeline[0]?.$match ?? {};
    if (match._id) return Promise.resolve(totals.inDispute ? [{ total: totals.inDispute }] : []);
    if (match.fulfillmentStatus === OrderFulfillmentStatus.COMPLETED)
      return Promise.resolve(totals.releasable ? [{ total: totals.releasable }] : []);
    if (match.fulfillmentStatus === OrderFulfillmentStatus.IN_FULFILLMENT)
      return Promise.resolve(totals.held ? [{ total: totals.held }] : []);
    if (match.paymentStatus === OrderPaymentStatus.PAID)
      return Promise.resolve(totals.gross ? [{ total: totals.gross }] : []);
    return Promise.resolve([]);
  });
}

describe('computeEscrowBalance', () => {
  beforeEach(() => jest.clearAllMocks());

  it('gates available funds on COMPLETED, not on PAID', async () => {
    // Farmer has 5000 received: 2000 still held in fulfilment, 3000 released.
    mockMediationDistinct.mockResolvedValue([]);
    wireOrderAggregate({ gross: 5000, held: 2000, releasable: 3000 });
    mockWRAggregate.mockResolvedValue([]);

    const balance = await computeEscrowBalance(FARMER_ID);

    expect(balance.grossReceivedKES).toBe(5000);
    expect(balance.heldKES).toBe(2000);
    expect(balance.releasableKES).toBe(3000);
    expect(balance.inDisputeKES).toBe(0);
    expect(balance.committedPayoutsKES).toBe(0);
    // Only the released 3000 is available — the held 2000 is not.
    expect(balance.availableKES).toBe(3000);
  });

  it('subtracts committed payouts from releasable, never below zero', async () => {
    mockMediationDistinct.mockResolvedValue([]);
    wireOrderAggregate({ gross: 4000, held: 0, releasable: 4000 });
    mockWRAggregate.mockResolvedValue([{ total: 4500 }]); // over-committed edge

    const balance = await computeEscrowBalance(FARMER_ID);

    expect(balance.releasableKES).toBe(4000);
    expect(balance.committedPayoutsKES).toBe(4500);
    expect(balance.availableKES).toBe(0);
  });

  it('reports inDispute when an open mediation blocks held funds', async () => {
    mockMediationDistinct.mockResolvedValue(['order-1']);
    wireOrderAggregate({ gross: 6000, held: 6000, releasable: 0, inDispute: 6000 });
    mockWRAggregate.mockResolvedValue([]);

    const balance = await computeEscrowBalance(FARMER_ID);

    expect(balance.heldKES).toBe(6000);
    expect(balance.inDisputeKES).toBe(6000);
    expect(balance.releasableKES).toBe(0);
    expect(balance.availableKES).toBe(0);
  });

  it('returns zeros for a farmer with no orders', async () => {
    mockMediationDistinct.mockResolvedValue([]);
    wireOrderAggregate({ gross: 0, held: 0, releasable: 0 });
    mockWRAggregate.mockResolvedValue([]);

    const balance = await computeEscrowBalance(FARMER_ID);

    expect(balance).toEqual({
      grossReceivedKES: 0,
      heldKES: 0,
      inDisputeKES: 0,
      releasableKES: 0,
      committedPayoutsKES: 0,
      availableKES: 0,
    });
  });
});
