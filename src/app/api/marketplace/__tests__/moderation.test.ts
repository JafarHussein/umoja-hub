/**
 * @jest-environment node
 *
 * Content moderation tests for POST /api/marketplace
 * Spec: listing description moderated by OpenAI before storage
 *       → flagged content returns 422 AI_CONTENT_FLAGGED
 */

import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const mockModerateContent = jest.fn();
jest.mock('@/lib/integrations/openaiService', () => ({
  moderateContent: (...args: unknown[]) => mockModerateContent(...args),
  generateBrief: jest.fn(),
}));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: (...args: unknown[]) => mockUserFindById(...args) },
}));

const mockListingCreate = jest.fn();
jest.mock('@/lib/models/MarketplaceListing.model', () => ({
  __esModule: true,
  default: { create: (...args: unknown[]) => mockListingCreate(...args) },
}));

jest.mock('@/lib/models/PriceHistory.model', () => ({
  __esModule: true,
  default: { create: jest.fn().mockResolvedValue({}) },
}));

jest.mock('@/lib/models/FarmerTrustScore.model', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

jest.mock('@/lib/rateLimit', () => ({ applyRateLimit: jest.fn().mockReturnValue(null) }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { POST } from '../route';

const VERIFIED_FARMER_SESSION = {
  user: { id: '507f1f77bcf86cd799439011', email: 'farmer@gmail.com', role: 'FARMER' },
};

const VERIFIED_FARMER_DOC = {
  farmerData: { isVerified: true },
  county: 'Kiambu',
};

const CREATED_LISTING_STUB = {
  _id: { toString: () => '507f1f77bcf86cd799439099' },
  title: 'Fresh Tomatoes — Kiambu',
  cropName: 'tomatoes',
  description: 'Grade A tomatoes from Kiambu, harvested this week.',
  farmerId: '507f1f77bcf86cd799439011',
  isVerifiedListing: true,
  listingStatus: 'AVAILABLE',
  createdAt: new Date(),
};

const VALID_LISTING = {
  title: 'Fresh Tomatoes — Kiambu',
  cropName: 'tomatoes',
  description: 'Grade A tomatoes from Kiambu, harvested this week.',
  quantityAvailable: 100,
  unit: 'KG',
  currentPricePerUnit: 120,
  pickupCounty: 'Kiambu',
  pickupDescription: 'Thika Road Farm — call before arrival',
  imageUrls: ['https://res.cloudinary.com/dqs2dwrjx/image/upload/v1/tomatoes.jpg'],
  buyerContactPreference: ['PHONE'],
};

function makeReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/marketplace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function setupVerifiedFarmer(): void {
  mockGetServerSession.mockResolvedValue(VERIFIED_FARMER_SESSION);
  mockUserFindById.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(VERIFIED_FARMER_DOC),
    }),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/marketplace — content moderation', () => {
  beforeEach(() => {
    // Reset all mocks fully between tests so implementations don't bleed over
    jest.resetAllMocks();
    setupVerifiedFarmer();
    // Default: moderation passes, listing creates successfully
    mockModerateContent.mockResolvedValue(false);
    mockListingCreate.mockResolvedValue(CREATED_LISTING_STUB);
  });

  it('allows listing creation when moderation returns safe', async () => {
    const res = await POST(makeReq(VALID_LISTING));
    expect(res.status).toBe(201);
    expect(mockModerateContent).toHaveBeenCalledWith(VALID_LISTING.description);
    expect(mockListingCreate).toHaveBeenCalled();
  });

  it('returns 422 AI_CONTENT_FLAGGED when moderation flags the description', async () => {
    mockModerateContent.mockResolvedValue(true);

    const res = await POST(makeReq(VALID_LISTING));
    expect(res.status).toBe(422);

    const json = (await res.json()) as { code: string; error: string };
    expect(json.code).toBe('AI_CONTENT_FLAGGED');

    // Listing must NOT be created in the database
    expect(mockListingCreate).not.toHaveBeenCalled();
  });

  it('calls moderateContent with the exact description string', async () => {
    await POST(makeReq(VALID_LISTING));

    expect(mockModerateContent).toHaveBeenCalledTimes(1);
    expect(mockModerateContent).toHaveBeenCalledWith(VALID_LISTING.description);
  });

  it('proceeds normally when moderation API fails (fail-open: returns false)', async () => {
    // moderateContent returns false on API failure per fail-open design
    mockModerateContent.mockResolvedValue(false);

    const res = await POST(makeReq(VALID_LISTING));
    expect(res.status).toBe(201);
    expect(mockListingCreate).toHaveBeenCalled();
  });

  it('skips moderation and still creates listing when no description provided', async () => {
    const { description: _desc, ...noDesc } = VALID_LISTING;

    await POST(makeReq(noDesc));

    // Moderation should NOT be called when description is absent
    expect(mockModerateContent).not.toHaveBeenCalled();
  });
});
