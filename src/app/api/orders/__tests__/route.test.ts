/**
 * @jest-environment node
 *
 * Tests for POST /api/orders — atomic inventory reservation
 * Covers: success path, SOLD_OUT auto-transition, race condition (atomic update returns null),
 *         STK Push failure rollback (order deleted + inventory restored), validation errors.
 */

import { NextRequest } from 'next/server';
import { ListingStatus } from '@/types';
import { AppError } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockListingFindById = jest.fn();
const mockListingFindOneAndUpdate = jest.fn();
const mockListingFindByIdAndUpdate = jest.fn();
jest.mock('@/lib/models/MarketplaceListing.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn((...a: unknown[]) => mockListingFindById(...a)),
    findOneAndUpdate: jest.fn((...a: unknown[]) => mockListingFindOneAndUpdate(...a)),
    findByIdAndUpdate: jest.fn((...a: unknown[]) => mockListingFindByIdAndUpdate(...a)),
  },
}));

const mockOrderCreate = jest.fn();
const mockOrderFindByIdAndDelete = jest.fn();
const mockOrderFindByIdAndUpdate = jest.fn();
jest.mock('@/lib/models/Order.model', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }),
    create: jest.fn((...a: unknown[]) => mockOrderCreate(...a)),
    findByIdAndDelete: jest.fn((...a: unknown[]) => mockOrderFindByIdAndDelete(...a)),
    findByIdAndUpdate: jest.fn((...a: unknown[]) => mockOrderFindByIdAndUpdate(...a)),
  },
}));

jest.mock('@/lib/foodhub/orderUtils', () => ({
  generateOrderReferenceId: jest.fn().mockResolvedValue('UMJ-2026-000001'),
}));

const mockInitiateSTKPush = jest.fn();
jest.mock('@/lib/integrations/darajaService', () => ({
  initiateSTKPush: jest.fn((...a: unknown[]) => mockInitiateSTKPush(...a)),
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BUYER_SESSION = { user: { id: 'buyer-001', role: 'BUYER', firstName: 'Aisha' } };
const LISTING_ID = '507f1f77bcf86cd799439011';
const FARMER_ID = '507f1f77bcf86cd799439012';

const mockAvailableListing = {
  _id: LISTING_ID,
  farmerId: FARMER_ID,
  cropName: 'Tomatoes',
  unit: 'KG',
  currentPricePerUnit: 55,
  quantityAvailable: 100,
  listingStatus: ListingStatus.AVAILABLE,
};

const mockReservedListing = {
  ...mockAvailableListing,
  quantityAvailable: 90, // after 10 KG reserved
};

const mockCreatedOrder = {
  _id: 'order-001',
  orderReferenceId: 'UMJ-2026-000001',
};

function makeOrderRequest(body: unknown) {
  return new NextRequest('http://localhost/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validOrderBody = {
  listingId: LISTING_ID,
  quantityOrdered: 10,
  fulfillmentType: 'PICKUP',
  buyerPhone: '0712345678',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/orders — atomic inventory reservation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(BUYER_SESSION);
  });

  it('creates order and atomically decrements inventory on success', async () => {
    mockListingFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockAvailableListing) }),
    });
    mockListingFindOneAndUpdate.mockResolvedValue(mockReservedListing);
    mockOrderCreate.mockResolvedValue(mockCreatedOrder);
    mockInitiateSTKPush.mockResolvedValue({ CheckoutRequestID: 'chk-001' });
    mockOrderFindByIdAndUpdate.mockResolvedValue({});

    const res = await POST(makeOrderRequest(validOrderBody));
    const body = await res.json() as { data: { orderReferenceId: string } };

    expect(res.status).toBe(201);
    expect(body.data.orderReferenceId).toBe('UMJ-2026-000001');

    // Verify atomic update was called with correct filter and pipeline
    expect(mockListingFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: LISTING_ID,
        listingStatus: ListingStatus.AVAILABLE,
        quantityAvailable: { $gte: 10 },
      }),
      expect.any(Array), // pipeline update
      { new: true }
    );
  });

  it('returns 409 when atomic reserve returns null (race condition — stock claimed between check and update)', async () => {
    mockListingFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockAvailableListing) }),
    });
    // Simulates another buyer winning the race between Step 1 and Step 2
    mockListingFindOneAndUpdate.mockResolvedValue(null);

    const res = await POST(makeOrderRequest(validOrderBody));
    const body = await res.json() as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('ORDER_INSUFFICIENT_STOCK');
    // Order must NOT have been created
    expect(mockOrderCreate).not.toHaveBeenCalled();
  });

  it('rolls back order AND restores inventory when STK Push fails', async () => {
    mockListingFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockAvailableListing) }),
    });
    mockListingFindOneAndUpdate.mockResolvedValue(mockReservedListing);
    mockOrderCreate.mockResolvedValue(mockCreatedOrder);
    mockInitiateSTKPush.mockRejectedValue(
      new AppError('Could not initiate M-Pesa payment.', 502, 'PAYMENT_STK_FAILED')
    );
    mockOrderFindByIdAndDelete.mockResolvedValue({});
    mockListingFindByIdAndUpdate.mockResolvedValue({});

    const res = await POST(makeOrderRequest(validOrderBody));

    expect(res.status).toBe(502);
    // Order deleted
    expect(mockOrderFindByIdAndDelete).toHaveBeenCalledWith('order-001');
    // Inventory restored with correct quantity and status
    expect(mockListingFindByIdAndUpdate).toHaveBeenCalledWith(
      LISTING_ID,
      expect.objectContaining({
        $inc: { quantityAvailable: 10 },
        listingStatus: ListingStatus.AVAILABLE,
      })
    );
  });

  it('returns 404 when listing does not exist', async () => {
    mockListingFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });

    const res = await POST(makeOrderRequest(validOrderBody));

    expect(res.status).toBe(404);
    expect(mockListingFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns 409 when listing is SOLD_OUT', async () => {
    mockListingFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          ...mockAvailableListing,
          listingStatus: ListingStatus.SOLD_OUT,
        }),
      }),
    });

    const res = await POST(makeOrderRequest(validOrderBody));
    const body = await res.json() as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('FARMER_LISTING_UNAVAILABLE');
    expect(mockListingFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns 409 when quantityOrdered exceeds quantityAvailable', async () => {
    mockListingFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          ...mockAvailableListing,
          quantityAvailable: 5,
        }),
      }),
    });

    const res = await POST(makeOrderRequest({ ...validOrderBody, quantityOrdered: 50 }));
    const body = await res.json() as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('ORDER_INSUFFICIENT_STOCK');
    expect(mockListingFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 when request body fails validation', async () => {
    const res = await POST(makeOrderRequest({ listingId: LISTING_ID })); // missing required fields

    expect(res.status).toBe(400);
    expect(mockListingFindById).not.toHaveBeenCalled();
  });

  it('returns 403 when non-BUYER calls POST /api/orders', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'farmer-001', role: 'FARMER', firstName: 'Kamau' },
    });

    const res = await POST(makeOrderRequest(validOrderBody));

    expect(res.status).toBe(403);
  });
});
