/**
 * @jest-environment node
 *
 * settleEscrow — the single implementation of moving held funds. These tests
 * pin the guard (only genuinely held money can be settled), the refund's
 * inventory restore, and the escrow event written for each outcome.
 */

const mockOrderFindOneAndUpdate = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: { findOneAndUpdate: (...a: unknown[]) => mockOrderFindOneAndUpdate(...a) },
}));

const mockEscrowCreate = jest.fn();
jest.mock('@/lib/models/EscrowEventLog.model', () => ({
  __esModule: true,
  default: { create: (...a: unknown[]) => mockEscrowCreate(...a) },
}));

const mockListingFindByIdAndUpdate = jest.fn();
jest.mock('@/lib/models/MarketplaceListing.model', () => ({
  __esModule: true,
  default: { findByIdAndUpdate: (...a: unknown[]) => mockListingFindByIdAndUpdate(...a) },
}));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: (...a: unknown[]) => mockUserFindById(...a) },
}));

jest.mock('@/lib/integrations/smsService', () => ({ sendSMS: jest.fn().mockResolvedValue(true) }));
jest.mock('@/lib/notifications/notify', () => ({ notify: jest.fn().mockResolvedValue(undefined) }));

import { settleEscrow } from '../escrowSettlement';
import { MediationOutcome } from '@/types';

const ORDER_ID = '507f1f77bcf86cd799439011';
const LISTING_ID = '507f1f77bcf86cd799439014';

function settledOrder() {
  return {
    _id: ORDER_ID,
    orderReferenceId: 'UMJ-2026-000123',
    listingId: LISTING_ID,
    buyerId: 'b1',
    farmerId: 'f1',
    quantityOrdered: 20,
    totalAmountKES: 2000,
  };
}

describe('settleEscrow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEscrowCreate.mockResolvedValue({});
    mockListingFindByIdAndUpdate.mockResolvedValue({});
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });
  });

  it('refuses to settle funds that are not held', async () => {
    mockOrderFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const result = await settleEscrow({
      orderId: ORDER_ID,
      outcome: MediationOutcome.RELEASE,
      adminId: 'admin-1',
      context: 'ADMIN_DIRECT',
    });

    expect(result).toEqual({ applied: false, reason: 'NOT_HELD' });
    expect(mockEscrowCreate).not.toHaveBeenCalled();
  });

  it('guards the transition on PAID + IN_FULFILLMENT', async () => {
    mockOrderFindOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue(settledOrder()),
    });

    await settleEscrow({
      orderId: ORDER_ID,
      outcome: MediationOutcome.RELEASE,
      adminId: 'admin-1',
      context: 'ADMIN_DIRECT',
    });

    expect(mockOrderFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: ORDER_ID,
        paymentStatus: 'PAID',
        fulfillmentStatus: 'IN_FULFILLMENT',
      }),
      expect.anything(),
      expect.objectContaining({ new: true })
    );
  });

  it('completes the order and logs RELEASED on a release', async () => {
    mockOrderFindOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue(settledOrder()),
    });

    const result = await settleEscrow({
      orderId: ORDER_ID,
      outcome: MediationOutcome.RELEASE,
      note: 'Buyer confirmed by phone.',
      adminId: 'admin-1',
      context: 'ADMIN_DIRECT',
    });

    expect(result).toMatchObject({ applied: true, amountKES: 2000 });
    expect(mockOrderFindOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { $set: { fulfillmentStatus: 'COMPLETED' } },
      expect.anything()
    );
    expect(mockEscrowCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'RELEASED',
        actorRole: 'ADMIN',
        actorId: 'admin-1',
        note: 'Buyer confirmed by phone.',
      })
    );
    // A release keeps the produce sold — nothing returns to the marketplace.
    expect(mockListingFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('refunds, marks the order disputed and returns the produce to the market', async () => {
    mockOrderFindOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue(settledOrder()),
    });

    const result = await settleEscrow({
      orderId: ORDER_ID,
      outcome: MediationOutcome.REFUND,
      note: 'Farmer never dispatched.',
      adminId: 'admin-1',
      context: 'MEDIATION',
    });

    expect(result).toMatchObject({ applied: true, outcome: MediationOutcome.REFUND });

    const update = mockOrderFindOneAndUpdate.mock.calls[0]?.[1] as {
      $set: Record<string, unknown>;
    };
    expect(update.$set).toMatchObject({
      paymentStatus: 'REFUNDED',
      fulfillmentStatus: 'DISPUTED',
      disputeReason: 'Farmer never dispatched.',
    });

    expect(mockListingFindByIdAndUpdate).toHaveBeenCalledWith(
      LISTING_ID,
      expect.objectContaining({ $inc: { quantityAvailable: 20 } })
    );
    expect(mockEscrowCreate).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'REFUND_ISSUED' })
    );
  });

  it('omits the note from the order when none was given', async () => {
    mockOrderFindOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue(settledOrder()),
    });

    await settleEscrow({
      orderId: ORDER_ID,
      outcome: MediationOutcome.REFUND,
      adminId: 'admin-1',
      context: 'ADMIN_DIRECT',
    });

    const update = mockOrderFindOneAndUpdate.mock.calls[0]?.[1] as {
      $set: Record<string, unknown>;
    };
    expect(update.$set).not.toHaveProperty('disputeReason');
  });
});
