/**
 * @jest-environment node
 *
 * Integration tests for GET /api/marketplace/suggest (search autocomplete).
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockAggregate = jest.fn();
const mockLean = jest.fn();
jest.mock('@/lib/models/MarketplaceListing.model', () => ({
  __esModule: true,
  default: {
    aggregate: (...args: unknown[]) => mockAggregate(...args),
    find: () => ({
      sort: () => ({
        limit: () => ({
          select: () => ({ lean: () => mockLean() }),
        }),
      }),
    }),
  },
}));

import { GET } from '../route';

interface ISuggestBody {
  data: {
    crops: { value: string; count: number }[];
    categories: { value: string; label: string }[];
    counties: { value: string; count: number }[];
    listings: { id: string }[];
  };
}

function req(q: string): NextRequest {
  return new NextRequest(`http://localhost/api/marketplace/suggest?q=${encodeURIComponent(q)}`);
}

describe('GET /api/marketplace/suggest', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty sections for a short query without querying the db', async () => {
    const res = await GET(req('t'));
    const body = (await res.json()) as ISuggestBody;

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ crops: [], categories: [], counties: [], listings: [] });
    expect(mockAggregate).not.toHaveBeenCalled();
  });

  it('returns produce, county, and listing suggestions', async () => {
    mockAggregate
      .mockResolvedValueOnce([{ _id: 'Tomatoes', count: 3 }]) // crops
      .mockResolvedValueOnce([{ _id: 'Kirinyaga', count: 2 }]); // counties
    mockLean.mockResolvedValue([
      {
        _id: 'listing1',
        title: 'Grade A Tomatoes',
        cropName: 'Tomatoes',
        pickupCounty: 'Kirinyaga',
        currentPricePerUnit: 55,
        unit: 'KG',
      },
    ]);

    const res = await GET(req('tom'));
    const body = (await res.json()) as ISuggestBody;

    expect(res.status).toBe(200);
    expect(body.data.crops).toEqual([{ value: 'Tomatoes', count: 3 }]);
    expect(body.data.counties).toEqual([{ value: 'Kirinyaga', count: 2 }]);
    expect(body.data.listings[0]?.id).toBe('listing1');
    expect(body.data.categories).toEqual([]); // "tom" matches no category label
  });

  it('matches category labels by text', async () => {
    mockAggregate.mockResolvedValue([]);
    mockLean.mockResolvedValue([]);

    const res = await GET(req('veg'));
    const body = (await res.json()) as ISuggestBody;

    expect(body.data.categories).toEqual([{ value: 'VEGETABLES', label: 'Vegetables' }]);
  });
});
