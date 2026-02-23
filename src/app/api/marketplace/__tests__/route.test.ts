/**
 * @jest-environment node
 *
 * Integration tests for POST /api/marketplace
 * Tests: verified farmer creates listing, unverified farmer blocked, validation failure
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({ getServerSession: (...args: unknown[]) => mockGetServerSession(...args) }));

const mockUserFindById = jest.fn();
const mockUserFind = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn((...args: unknown[]) => mockUserFindById(...args)),
    find: jest.fn((...args: unknown[]) => mockUserFind(...args)),
  },
}));

const mockListingCreate = jest.fn();
const mockListingFind = jest.fn();
const mockListingCountDocuments = jest.fn();
jest.mock('@/lib/models/MarketplaceListing.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn((...args: unknown[]) => mockListingCreate(...args)),
    find: jest.fn((...args: unknown[]) => mockListingFind(...args)),
    countDocuments: jest.fn((...args: unknown[]) => mockListingCountDocuments(...args)),
  },
}));

const mockPriceHistoryCreate = jest.fn();
jest.mock('@/lib/models/PriceHistory.model', () => ({
  __esModule: true,
  default: { create: jest.fn((...args: unknown[]) => mockPriceHistoryCreate(...args)) },
}));

const mockTrustFind = jest.fn();
jest.mock('@/lib/models/FarmerTrustScore.model', () => ({
  __esModule: true,
  default: { find: jest.fn((...args: unknown[]) => mockTrustFind(...args)) },
}));

import { POST, GET } from '../route';

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/marketplace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validListingBody = {
  title: 'Fresh Tomatoes — Grade A Kiambu',
  cropName: 'Tomatoes',
  description: 'Freshly harvested grade A tomatoes from certified farm in Kiambu, ready for immediate pickup.',
  quantityAvailable: 100,
  unit: 'KG',
  currentPricePerUnit: 65,
  pickupCounty: 'Kiambu',
  pickupDescription: 'Farm gate, Thika Road, near Ruiru junction',
  imageUrls: ['https://res.cloudinary.com/dqs2dwrjx/image/upload/v1/tomatoes.jpg'],
  buyerContactPreference: ['PHONE'],
};

const farmerSession = {
  user: { id: 'farmer-123', email: 'farmer@test.com', role: 'FARMER', firstName: 'Kamau' },
};

const buyerSession = {
  user: { id: 'buyer-456', email: 'buyer@test.com', role: 'BUYER', firstName: 'Wanjiku' },
};

describe('POST /api/marketplace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 FARMER_NOT_VERIFIED for unverified farmer', async () => {
    mockGetServerSession.mockResolvedValue(farmerSession);
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          farmerData: { isVerified: false, cropsGrown: [] },
          county: 'Kiambu',
        }),
      }),
    });

    const req = makePostRequest(validListingBody);
    const res = await POST(req);
    const body = await res.json() as { code: string };

    expect(res.status).toBe(403);
    expect(body.code).toBe('FARMER_NOT_VERIFIED');
  });

  it('returns 201 with listing data for verified farmer with valid body', async () => {
    mockGetServerSession.mockResolvedValue(farmerSession);
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          farmerData: { isVerified: true, cropsGrown: ['tomatoes'] },
          county: 'Kiambu',
        }),
      }),
    });

    const mockListingDoc = {
      _id: 'listing-abc',
      createdAt: new Date('2025-03-01'),
    };
    mockListingCreate.mockResolvedValue(mockListingDoc);
    mockPriceHistoryCreate.mockResolvedValue({});

    const req = makePostRequest(validListingBody);
    const res = await POST(req);
    const body = await res.json() as { data: { id: string; listingStatus: string; priceHistoryRecorded: boolean } };

    expect(res.status).toBe(201);
    expect(body.data.id).toBe('listing-abc');
    expect(body.data.listingStatus).toBe('AVAILABLE');
    expect(body.data.priceHistoryRecorded).toBe(true);
    expect(mockListingCreate).toHaveBeenCalledTimes(1);
    expect(mockPriceHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        cropName: 'Tomatoes',
        county: 'Kiambu',
        source: 'LISTING_CREATED',
      })
    );
  });

  it('returns 400 VALIDATION_FAILED when body is invalid', async () => {
    mockGetServerSession.mockResolvedValue(farmerSession);
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          farmerData: { isVerified: true },
          county: 'Kiambu',
        }),
      }),
    });

    const req = makePostRequest({ title: 'x' }); // Missing required fields
    const res = await POST(req);
    const body = await res.json() as { code: string };

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_FAILED');
  });

  it('returns 403 AUTH_FORBIDDEN when role is BUYER', async () => {
    mockGetServerSession.mockResolvedValue(buyerSession);

    const req = makePostRequest(validListingBody);
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it('returns 401 when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = makePostRequest(validListingBody);
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 201 even when PriceHistory insert fails (non-fatal)', async () => {
    mockGetServerSession.mockResolvedValue(farmerSession);
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          farmerData: { isVerified: true },
          county: 'Kiambu',
        }),
      }),
    });
    mockListingCreate.mockResolvedValue({ _id: 'listing-xyz', createdAt: new Date() });
    mockPriceHistoryCreate.mockRejectedValue(new Error('DB write failed'));

    const req = makePostRequest(validListingBody);
    const res = await POST(req);
    const body = await res.json() as { data: { priceHistoryRecorded: boolean } };

    expect(res.status).toBe(201);
    expect(body.data.priceHistoryRecorded).toBe(false);
  });
});

describe('GET /api/marketplace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with empty data array when no listings', async () => {
    mockListingFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
    });
    mockListingCountDocuments.mockResolvedValue(0);
    // User.find called for farmer enrichment (even with empty page, route still calls it)
    mockUserFind.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    });
    mockTrustFind.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) });

    const req = new NextRequest('http://localhost/api/marketplace');
    const res = await GET(req);
    const body = await res.json() as { data: unknown[]; total: number };

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(0);
    expect(body.total).toBe(0);
  });
});
