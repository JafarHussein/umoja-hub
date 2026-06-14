/**
 * @jest-environment node
 *
 * Tests for GET /api/farmers/ledger
 * Covers: farmer guard, line-item mapping, derived balance passthrough.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockComputeEscrowBalance = jest.fn();
jest.mock('@/lib/foodhub/escrow', () => ({
  computeEscrowBalance: (...a: unknown[]) => mockComputeEscrowBalance(...a),
}));

const mockOrderFind = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: { find: (...a: unknown[]) => mockOrderFind(...a) },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET } from '../route';

const FARMER_SESSION = { user: { id: 'f1', role: 'FARMER', firstName: 'Kamau' } };
const BUYER_SESSION = { user: { id: 'b1', role: 'BUYER', firstName: 'Bea' } };

function req() {
  return new NextRequest('http://localhost/api/farmers/ledger');
}

describe('GET /api/farmers/ledger', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-farmer with 403', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
    const res = await GET(req());
    expect(res.status).toBe(403);
  });

  it('returns mapped PAID line items alongside the derived balance', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockOrderFind.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: 'o1',
                orderReferenceId: 'UMJ-1',
                cropName: 'Maize',
                quantityOrdered: 10,
                unit: 'KG',
                totalAmountKES: 2000,
                fulfillmentStatus: 'COMPLETED',
                paidAt: new Date('2026-06-01'),
              },
            ]),
          }),
        }),
      }),
    });
    mockComputeEscrowBalance.mockResolvedValue({
      grossReceivedKES: 2000,
      committedPayoutsKES: 0,
      availableKES: 2000,
    });

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.lineItems).toHaveLength(1);
    expect(body.data.lineItems[0]).toMatchObject({
      orderId: 'o1',
      orderReferenceId: 'UMJ-1',
      amountKES: 2000,
      fulfillmentStatus: 'COMPLETED',
    });
    expect(body.data.balance.availableKES).toBe(2000);
  });
});
