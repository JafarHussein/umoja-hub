/**
 * @jest-environment node
 *
 * Integration tests for the engine's database layer — `12_TESTING_STRATEGY.md`
 * §3.2.
 *
 * These run against a real MongoDB (mongodb-memory-server). That is the whole
 * point: `computeRecommendation` was executed by no test, and D1 lived there.
 * The unit suite could not have caught it, and a mocked Mongoose would not have
 * either — a mocked `.select()` returns whatever the test says it returns, so a
 * mock-based test passes just as happily while the column is missing.
 *
 * `connectDB` is stubbed because the connection is established here against the
 * in-memory server; the models themselves are real and use the default mongoose
 * connection.
 *
 * NOT part of `npm test` — run with `npm run test:integration`.
 *
 * Where the database comes from depends on who is running:
 *
 * - **CI** supplies one through `INTEGRATION_MONGODB_URI`, backed by a `mongo:7`
 *   service container (the pattern `e2e.yml` already uses). `MongoMemoryServer`
 *   is then never constructed, so no binary is ever downloaded on a runner.
 * - **Locally**, with that variable unset, an in-memory server is started. It
 *   downloads a MongoDB binary (~400 MB) on first use and caches it.
 *
 * `npm test` stays binary-free either way — hence `mongodb-memory-server-core`,
 * which has no postinstall download, rather than `mongodb-memory-server`, which
 * fetches the binary during `npm install`.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

import { composeRecommendation, RECO_WINDOW_DAYS } from '../priceIntelligence';
import { getListingFairness } from '../buyerFairness';
import PriceHistory from '@/lib/models/PriceHistory.model';
import MarketplaceListing from '@/lib/models/MarketplaceListing.model';
import { PriceHistorySource, ListingUnit, ListingStatus, ListingCategory } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;

// Left undefined when CI supplies a database; `MongoMemoryServer.create()` is
// what triggers the binary download, so not calling it is the whole point.
let mongod: MongoMemoryServer | undefined;

beforeAll(async () => {
  const suppliedUri = process.env['INTEGRATION_MONGODB_URI'];
  if (suppliedUri) {
    await mongoose.connect(suppliedUri);
  } else {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await PriceHistory.deleteMany({});
  await MarketplaceListing.deleteMany({});
});

interface RowOptions {
  cropName?: string;
  county?: string;
  unit?: string;
  daysAgo?: number;
  source?: PriceHistorySource;
  farmerId?: mongoose.Types.ObjectId;
}

function row(pricePerUnit: number, options: RowOptions = {}) {
  const {
    cropName = 'Maize',
    county = 'Kiambu',
    unit = 'KG',
    daysAgo = 5,
    source = PriceHistorySource.ORDER_COMPLETED,
    farmerId,
  } = options;
  return {
    cropName,
    county,
    pricePerUnit,
    unit,
    source,
    ...(farmerId ? { farmerId } : {}),
    recordedAt: new Date(Date.now() - daysAgo * DAY_MS),
  };
}

/**
 * Cache keys are crop:county:unit, and the in-memory store is module-scoped for
 * the whole file. Tests that must not share a cached view use their own county.
 */
let countySeq = 0;
function freshCounty(): string {
  countySeq += 1;
  return `Kiambu${countySeq}`;
}

describe('D1 — unit filtering against a real query', () => {
  it('draws a KG recommendation only from KG rows', async () => {
    // The defect, at the layer it actually lived in. Maize trades at ~KES 40/KG
    // and ~KES 3,600/BAG; before the fix a KG request returned 3,500.
    const county = freshCounty();
    await PriceHistory.insertMany([
      row(40, { county, unit: 'KG', daysAgo: 1 }),
      row(42, { county, unit: 'KG', daysAgo: 4 }),
      row(44, { county, unit: 'KG', daysAgo: 8 }),
      row(38, { county, unit: 'KG', daysAgo: 12 }),
      row(3600, { county, unit: 'BAG', daysAgo: 2 }),
      row(3500, { county, unit: 'BAG', daysAgo: 6 }),
      row(3700, { county, unit: 'BAG', daysAgo: 10 }),
    ]);

    const reco = await composeRecommendation({ crop: 'Maize', county, unit: 'KG' });

    expect(reco.basis.dataPointCount).toBe(4);
    expect(reco.recommendedPricePerUnit as number).toBeLessThan(100);
    expect(reco.range?.high as number).toBeLessThan(100);
  });

  it('draws a BAG recommendation only from BAG rows in the same collection', async () => {
    const county = freshCounty();
    await PriceHistory.insertMany([
      row(40, { county, unit: 'KG', daysAgo: 1 }),
      row(42, { county, unit: 'KG', daysAgo: 4 }),
      row(44, { county, unit: 'KG', daysAgo: 8 }),
      row(3600, { county, unit: 'BAG', daysAgo: 2 }),
      row(3500, { county, unit: 'BAG', daysAgo: 6 }),
      row(3700, { county, unit: 'BAG', daysAgo: 10 }),
    ]);

    const reco = await composeRecommendation({ crop: 'Maize', county, unit: 'BAG' });

    expect(reco.basis.dataPointCount).toBe(3);
    expect(reco.recommendedPricePerUnit as number).toBeGreaterThan(1000);
  });

  it('matches units case-insensitively, since unit is a plain String on the schema', async () => {
    const county = freshCounty();
    await PriceHistory.insertMany([
      row(40, { county, unit: 'kg', daysAgo: 1 }),
      row(42, { county, unit: 'KG', daysAgo: 4 }),
      row(44, { county, unit: 'Kg', daysAgo: 8 }),
    ]);

    const reco = await composeRecommendation({ crop: 'Maize', county, unit: 'KG' });

    expect(reco.basis.dataPointCount).toBe(3);
  });

  it('excludes observations older than the recommendation window', async () => {
    const county = freshCounty();
    await PriceHistory.insertMany([
      row(40, { county, daysAgo: 1 }),
      row(42, { county, daysAgo: 4 }),
      row(44, { county, daysAgo: 8 }),
      row(900, { county, daysAgo: RECO_WINDOW_DAYS + 30 }),
    ]);

    const reco = await composeRecommendation({ crop: 'Maize', county, unit: 'KG' });

    expect(reco.basis.dataPointCount).toBe(3);
    expect(reco.recommendedPricePerUnit as number).toBeLessThan(100);
  });
});

describe('D1 — the 3,000-row cap does not starve the requested unit', () => {
  it('still finds KG rows behind more than 3,000 newer BAG rows', async () => {
    // The cap is applied by the database, sorted newest-first. Without a unit
    // filter in the query, 3,000 BAG rows fill the entire result and the KG
    // request sees zero points — the recommendation silently empties out. This
    // is why D1 had to be fixed at the query and not only in the pure layer.
    const county = freshCounty();
    const bagRows = Array.from({ length: 3100 }, (_, i) =>
      row(3600, { county, unit: 'BAG', daysAgo: 1 + (i % 20) * 0.001 })
    );
    await PriceHistory.insertMany(bagRows);
    await PriceHistory.insertMany([
      row(40, { county, unit: 'KG', daysAgo: 40 }),
      row(42, { county, unit: 'KG', daysAgo: 45 }),
      row(44, { county, unit: 'KG', daysAgo: 50 }),
      row(41, { county, unit: 'KG', daysAgo: 55 }),
    ]);

    const reco = await composeRecommendation({ crop: 'Maize', county, unit: 'KG' });

    expect(reco.basis.dataPointCount).toBe(4);
    expect(reco.recommendedPricePerUnit as number).toBeLessThan(100);
  }, 60_000);
});

describe('D3 — one crop taxonomy across the platform', () => {
  it('resolves synonyms to the same crop as the canonical label', async () => {
    // The engine used an anchored regex while /api/prices and the alert cron
    // used exact equality, so the three disagreed about what "maize" matched.
    const county = freshCounty();
    await PriceHistory.insertMany([
      row(40, { cropName: 'Maize', county, daysAgo: 1 }),
      row(42, { cropName: 'Mahindi', county, daysAgo: 4 }),
      row(44, { cropName: 'White Maize', county, daysAgo: 8 }),
    ]);

    const reco = await composeRecommendation({ crop: 'Maize', county, unit: 'KG' });

    expect(reco.basis.dataPointCount).toBe(3);
  });

  it('does not let a superset pattern pull in a different crop', async () => {
    // cropNamePattern is a word-boundary alternation, so "beans" also matches
    // "French Beans" at the database. matchesCrop narrows it afterwards, where
    // alias precedence can be applied properly.
    const county = freshCounty();
    await PriceHistory.insertMany([
      row(100, { cropName: 'Beans', county, daysAgo: 1 }),
      row(102, { cropName: 'Beans', county, daysAgo: 3 }),
      row(104, { cropName: 'Beans', county, daysAgo: 5 }),
      row(400, { cropName: 'French Beans', county, daysAgo: 2 }),
      row(410, { cropName: 'French Beans', county, daysAgo: 4 }),
    ]);

    const reco = await composeRecommendation({ crop: 'Beans', county, unit: 'KG' });

    expect(reco.basis.dataPointCount).toBe(3);
    expect(reco.recommendedPricePerUnit as number).toBeLessThan(200);
  });
});

describe('D5 — caching through composeRecommendation', () => {
  it('serves the second call from cache rather than re-reading the database', async () => {
    const county = freshCounty();
    await PriceHistory.insertMany([
      row(40, { county, daysAgo: 1 }),
      row(42, { county, daysAgo: 4 }),
      row(44, { county, daysAgo: 8 }),
    ]);

    const first = await composeRecommendation({ crop: 'Maize', county, unit: 'KG' });
    expect(first.confidence).toBeGreaterThan(0);

    // Emptying the collection proves the second answer did not come from it.
    await PriceHistory.deleteMany({});
    const second = await composeRecommendation({ crop: 'Maize', county, unit: 'KG' });

    expect(second.recommendedPricePerUnit).toBe(first.recommendedPricePerUnit);
    expect(second.basis.dataPointCount).toBe(first.basis.dataPointCount);
  });

  it('does not pin a zero-confidence result', async () => {
    // shouldCache: confidence > 0. An empty answer is indistinguishable from one
    // produced during an outage, so caching it would turn a blip into a
    // ten-minute outage. The next call must see data that has since arrived.
    const county = freshCounty();

    const empty = await composeRecommendation({ crop: 'Maize', county, unit: 'KG' });
    expect(empty.confidence).toBe(0);
    expect(empty.recommendedPricePerUnit).toBeNull();

    await PriceHistory.insertMany([
      row(40, { county, daysAgo: 1 }),
      row(42, { county, daysAgo: 4 }),
      row(44, { county, daysAgo: 8 }),
    ]);

    const populated = await composeRecommendation({ crop: 'Maize', county, unit: 'KG' });

    expect(populated.confidence).toBeGreaterThan(0);
    expect(populated.recommendedPricePerUnit).not.toBeNull();
  });

  it('keeps different units in different cache entries', async () => {
    const county = freshCounty();
    await PriceHistory.insertMany([
      row(40, { county, unit: 'KG', daysAgo: 1 }),
      row(42, { county, unit: 'KG', daysAgo: 4 }),
      row(44, { county, unit: 'KG', daysAgo: 8 }),
      row(3600, { county, unit: 'BAG', daysAgo: 2 }),
      row(3500, { county, unit: 'BAG', daysAgo: 6 }),
      row(3700, { county, unit: 'BAG', daysAgo: 10 }),
    ]);

    const kg = await composeRecommendation({ crop: 'Maize', county, unit: 'KG' });
    const bag = await composeRecommendation({ crop: 'Maize', county, unit: 'BAG' });

    expect(kg.recommendedPricePerUnit as number).toBeLessThan(100);
    expect(bag.recommendedPricePerUnit as number).toBeGreaterThan(1000);
  });
});

describe('D14 — buyer fairness over a real listing', () => {
  async function seedListing(county: string, price: number) {
    const listing = await MarketplaceListing.create({
      farmerId: new mongoose.Types.ObjectId(),
      title: 'Maize for sale',
      cropName: 'Maize',
      category: ListingCategory.CEREALS,
      description: 'Clean dry maize, well graded and ready for collection.',
      quantityAvailable: 500,
      unit: ListingUnit.KG,
      currentPricePerUnit: price,
      pickupCounty: county,
      pickupDescription: 'Farm gate, off the main road.',
      imageUrls: [],
      listingStatus: ListingStatus.AVAILABLE,
    });
    return String(listing._id);
  }

  it('assesses a listing priced inside the market range', async () => {
    const county = freshCounty();
    await PriceHistory.insertMany([
      row(40, { county, daysAgo: 1 }),
      row(42, { county, daysAgo: 4 }),
      row(44, { county, daysAgo: 8 }),
      row(41, { county, daysAgo: 10 }),
    ]);
    const listingId = await seedListing(county, 42);

    const fairness = await getListingFairness(listingId);

    expect(fairness).not.toBeNull();
    expect(fairness?.assessment).toBe('IN_RANGE');
    expect(fairness?.basis).toBe('COUNTY');
    expect(fairness?.windowDays).toBe(RECO_WINDOW_DAYS);
  });

  it('flags a listing priced well above the market range', async () => {
    const county = freshCounty();
    await PriceHistory.insertMany([
      row(40, { county, daysAgo: 1 }),
      row(42, { county, daysAgo: 4 }),
      row(44, { county, daysAgo: 8 }),
      row(41, { county, daysAgo: 10 }),
    ]);
    const listingId = await seedListing(county, 200);

    const fairness = await getListingFairness(listingId);

    expect(fairness?.assessment).toBe('WELL_ABOVE');
  });

  it('returns an unjudgeable assessment when there is too little evidence', async () => {
    const county = freshCounty();
    const listingId = await seedListing(county, 42);

    const fairness = await getListingFairness(listingId);

    expect(fairness).not.toBeNull();
    expect(fairness?.assessment).toBeNull();
    expect(fairness?.confidenceBand).toBe('LOW');
  });

  it('returns null for a listing that does not exist', async () => {
    const fairness = await getListingFairness(String(new mongoose.Types.ObjectId()));

    expect(fairness).toBeNull();
  });
});

describe('D12 — excludeFarmerId through the real query', () => {
  it('drops the farmer’s own asking prices but keeps their completed sales', () => {
    return (async () => {
      const county = freshCounty();
      const owner = new mongoose.Types.ObjectId();
      const other = new mongoose.Types.ObjectId();

      await PriceHistory.insertMany([
        row(40, { county, farmerId: other, daysAgo: 1 }),
        row(42, { county, farmerId: other, daysAgo: 3 }),
        row(44, { county, farmerId: owner, daysAgo: 5 }),
        row(500, { county, farmerId: owner, daysAgo: 2, source: PriceHistorySource.LISTING_CREATED }),
        row(520, { county, farmerId: owner, daysAgo: 4, source: PriceHistorySource.LISTING_CREATED }),
      ]);

      const withOwn = await composeRecommendation({ crop: 'Maize', county, unit: 'KG' });
      const withoutOwn = await composeRecommendation({
        crop: 'Maize',
        county,
        unit: 'KG',
        excludeFarmerId: String(owner),
      });

      // Five points seen normally; the two own listings drop out, and the
      // owner's own COMPLETED sale (44) survives because it is a settled fact.
      expect(withOwn.basis.dataPointCount).toBe(5);
      expect(withoutOwn.basis.dataPointCount).toBe(3);
      expect(withoutOwn.recommendedPricePerUnit as number).toBeLessThan(100);
    })();
  });

  it('keys the cache on excludeFarmerId so the two views cannot collide', async () => {
    const county = freshCounty();
    const owner = new mongoose.Types.ObjectId();

    await PriceHistory.insertMany([
      row(40, { county, daysAgo: 1 }),
      row(42, { county, daysAgo: 3 }),
      row(44, { county, daysAgo: 5 }),
      row(900, { county, farmerId: owner, daysAgo: 2, source: PriceHistorySource.LISTING_CREATED }),
      row(920, { county, farmerId: owner, daysAgo: 4, source: PriceHistorySource.LISTING_CREATED }),
    ]);

    // Warm the unfiltered view first. If excludeFarmerId were absent from the
    // key, the filtered call would be served this cached answer.
    const unfiltered = await composeRecommendation({ crop: 'Maize', county, unit: 'KG' });
    const filtered = await composeRecommendation({
      crop: 'Maize',
      county,
      unit: 'KG',
      excludeFarmerId: String(owner),
    });

    expect(unfiltered.basis.dataPointCount).toBe(5);
    expect(filtered.basis.dataPointCount).toBe(3);
  });
});
