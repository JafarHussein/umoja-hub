/**
 * @jest-environment node
 *
 * Tests for the escrow outcome applied when an admin RESOLVES a mediation:
 * REFUND returns held funds to the buyer (REFUNDED/DISPUTED + inventory restore
 * + REFUND_ISSUED event); RELEASE completes the order so funds go to the farmer
 * (RELEASED event); a money outcome is only valid when resolving.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockMRFindOneAndUpdate = jest.fn();
const mockMRFindById = jest.fn();
// The route reads the case before settling, so the money moves before the
// decision is recorded and a refusal can leave the case open.
const mockMRFindOne = jest.fn();
jest.mock('@/lib/models/MediationRequest.model', () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: (...a: unknown[]) => mockMRFindOneAndUpdate(...a),
    findById: (...a: unknown[]) => mockMRFindById(...a),
    findOne: (...a: unknown[]) => mockMRFindOne(...a),
  },
}));

jest.mock('@/lib/models/AdminAuditLog.model', () => ({
  __esModule: true,
  default: { create: jest.fn().mockResolvedValue({}) },
}));

const mockOrderFindOneAndUpdate = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: { findOneAndUpdate: (...a: unknown[]) => mockOrderFindOneAndUpdate(...a) },
}));

const mockListingUpdate = jest.fn().mockResolvedValue({});
jest.mock('@/lib/models/MarketplaceListing.model', () => ({
  __esModule: true,
  default: { findByIdAndUpdate: (...a: unknown[]) => mockListingUpdate(...a) },
}));

const mockEscrowCreate = jest.fn().mockResolvedValue({});
jest.mock('@/lib/models/EscrowEventLog.model', () => ({
  __esModule: true,
  default: { create: (...a: unknown[]) => mockEscrowCreate(...a) },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { PATCH } from '../route';

const ADMIN_SESSION = { user: { id: 'admin-1', role: 'ADMIN', firstName: 'Admin' } };
const MR_ID = '507f1f77bcf86cd799439011';

const ORDER = {
  _id: 'o1',
  listingId: 'l1',
  quantityOrdered: 10,
  buyerId: 'b1',
  farmerId: 'f1',
  totalAmountKES: 2000,
};

function patchReq(body: unknown) {
  return new NextRequest('http://localhost/api/admin/mediation-requests', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function resolvedMediation() {
  mockMRFindOneAndUpdate.mockReturnValue({
    lean: jest.fn().mockResolvedValue({
      _id: MR_ID,
      orderId: ORDER._id,
      buyerId: ORDER.buyerId,
      farmerId: ORDER.farmerId,
      status: 'RESOLVED',
    }),
  });
}

/** The case as it stands before the decision is recorded. */
function pendingMediation() {
  mockMRFindOne.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: MR_ID, orderId: ORDER._id }),
    }),
  });
}

describe('mediation escrow outcome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(ADMIN_SESSION);
    pendingMediation();
  });

  it('rejects a money outcome that is not paired with RESOLVED (400)', async () => {
    const res = await PATCH(patchReq({ requestId: MR_ID, status: 'IN_REVIEW', outcome: 'REFUND' }));
    expect(res.status).toBe(400);
    expect(mockOrderFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('REFUND returns held funds to the buyer and restores inventory', async () => {
    resolvedMediation();
    mockOrderFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(ORDER) });

    const res = await PATCH(
      patchReq({ requestId: MR_ID, status: 'RESOLVED', resolutionNote: 'Never delivered.', outcome: 'REFUND' })
    );

    expect(res.status).toBe(200);
    // Order moved to REFUNDED/DISPUTED under the held guard.
    const [guard, update] = mockOrderFindOneAndUpdate.mock.calls[0];
    expect(guard).toMatchObject({
      paymentStatus: 'PAID',
      fulfillmentStatus: 'IN_FULFILLMENT',
    });
    expect(update.$set).toMatchObject({
      paymentStatus: 'REFUNDED',
      fulfillmentStatus: 'DISPUTED',
      disputeReason: 'Never delivered.',
    });
    expect(mockListingUpdate).toHaveBeenCalledWith(
      'l1',
      expect.objectContaining({ $inc: { quantityAvailable: 10 } })
    );
    expect(mockEscrowCreate).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'REFUND_ISSUED', amountKES: 2000, actorRole: 'ADMIN' })
    );
  });

  it('RELEASE completes the order and logs a RELEASED event, no inventory change', async () => {
    resolvedMediation();
    mockOrderFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(ORDER) });

    const res = await PATCH(
      patchReq({ requestId: MR_ID, status: 'RESOLVED', resolutionNote: 'Farmer fulfilled.', outcome: 'RELEASE' })
    );

    expect(res.status).toBe(200);
    const [, update] = mockOrderFindOneAndUpdate.mock.calls[0];
    expect(update.$set).toMatchObject({ fulfillmentStatus: 'COMPLETED' });
    expect(mockListingUpdate).not.toHaveBeenCalled();
    expect(mockEscrowCreate).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'RELEASED', amountKES: 2000 })
    );
  });

  it('refuses out loud when the order is no longer in a held state', async () => {
    // The no-side-effects half of this was always right: nothing must move
    // twice. What was wrong was the silence. This answered 200 and marked the
    // case RESOLVED, so an administrator who chose "refund the buyer" on an
    // order whose funds had already left escrow — e.g. a buyer who confirmed
    // receipt mid-dispute — saw a success screen and a closed case while no
    // money moved and nobody was told. The case must stay open instead.
    resolvedMediation();
    mockOrderFindOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await PATCH(
      patchReq({ requestId: MR_ID, status: 'RESOLVED', resolutionNote: 'Late.', outcome: 'REFUND' })
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: 'ESCROW_NOT_HELD' });
    expect(mockListingUpdate).not.toHaveBeenCalled();
    expect(mockEscrowCreate).not.toHaveBeenCalled();
    // The decision is not recorded, so the case is still there to act on.
    expect(mockMRFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('leaves the order untouched for a plain resolution (no outcome)', async () => {
    resolvedMediation();

    const res = await PATCH(
      patchReq({ requestId: MR_ID, status: 'RESOLVED', resolutionNote: 'Closed amicably.' })
    );

    expect(res.status).toBe(200);
    expect(mockOrderFindOneAndUpdate).not.toHaveBeenCalled();
    expect(mockEscrowCreate).not.toHaveBeenCalled();
  });
});
