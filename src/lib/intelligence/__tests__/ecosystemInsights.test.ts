/**
 * @jest-environment node
 *
 * Unit tests for the pure cooperative + NGO insight assemblers.
 */

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

import { aggregateMemberCrops } from '../cooperativeInsights';
import type { MemberOrder } from '../cooperativeInsights';
import { assembleNgoMarketHealth } from '../ngoMarketHealth';
import type { NgoListing, NgoPoint } from '../ngoMarketHealth';
import { PriceHistorySource } from '@/types';

const NOW = new Date('2026-04-15T00:00:00Z'); // April → coffee is OFF_SEASON

describe('aggregateMemberCrops', () => {
  const orders: MemberOrder[] = [
    { crop: 'tomatoes', unit: 'KG', pricePerUnit: 75, totalAmountKES: 1500, farmerId: 'A', recordedAt: NOW },
    { crop: 'tomatoes', unit: 'KG', pricePerUnit: 80, totalAmountKES: 1600, farmerId: 'B', recordedAt: NOW },
    { crop: 'maize', unit: 'BAG', pricePerUnit: 3500, totalAmountKES: 7000, farmerId: 'A', recordedAt: NOW },
  ];
  const rows = aggregateMemberCrops(orders, NOW);

  it('sorts crops by completed-sale value', () => {
    expect(rows[0]?.crop).toBe('maize'); // 7000 > 3100
  });

  it('aggregates value, sales and active members per crop', () => {
    const tomatoes = rows.find((r) => r.crop === 'tomatoes');
    expect(tomatoes?.completedSales).toBe(2);
    expect(tomatoes?.completedValueKES).toBe(3100);
    expect(tomatoes?.activeMembers).toBe(2);
    expect(tomatoes?.memberMedianPrice).toBe(78); // median(75,80)=77.5 → 78
  });

  it('returns [] for no orders', () => {
    expect(aggregateMemberCrops([], NOW)).toEqual([]);
  });
});

describe('assembleNgoMarketHealth', () => {
  const completed = (crop: string, county: string, price: number): NgoPoint => ({
    crop,
    county,
    unit: 'KG',
    pricePerUnit: price,
    source: PriceHistorySource.ORDER_COMPLETED,
    recordedAt: new Date(NOW.getTime() - 5 * 86400000),
  });

  const points: NgoPoint[] = [
    completed('coffee', 'Kiambu', 380),
    completed('coffee', 'Kiambu', 390),
    completed('coffee', 'Kiambu', 400),
    completed('kale', 'Kiambu', 30),
    completed('kale', 'Kiambu', 32),
    completed('kale', 'Kiambu', 34),
  ];
  const listings: NgoListing[] = [
    { crop: 'coffee', county: 'Kiambu', quantityAvailable: 50 }, // thin supply (1)
    ...Array.from({ length: 5 }, () => ({ crop: 'kale', county: 'Kiambu', quantityAvailable: 100 })),
  ];

  const result = assembleNgoMarketHealth(['Kiambu'], listings, points, NOW);

  it('summarises served counties and supply', () => {
    expect(result.summary.servedCounties).toBe(1);
    expect(result.summary.activeListings).toBe(6);
    expect(result.summary.completedSales30d).toBe(6);
  });

  it('lists food availability per crop', () => {
    expect(result.cropAvailability.find((c) => c.crop === 'coffee')).toBeDefined();
    expect(result.cropAvailability.find((c) => c.crop === 'kale')?.activeListings).toBe(5);
  });

  it('flags a shortage for an off-season crop with thin supply', () => {
    const coffee = result.shortageAlerts.find((s) => s.crop === 'coffee');
    expect(coffee).toBeDefined();
    expect(coffee?.seasonPhase).toBe('OFF_SEASON');
    // kale is in-season with ample supply → not a shortage
    expect(result.shortageAlerts.find((s) => s.crop === 'kale')).toBeUndefined();
  });

  it('reports price stability per crop', () => {
    const coffee = result.priceStability.find((p) => p.crop === 'coffee');
    expect(coffee?.medianPrice).not.toBeNull();
    expect(coffee?.volatilityPct).not.toBeNull();
  });

  it('returns empty structures for no served counties', () => {
    const empty = assembleNgoMarketHealth([], [], [], NOW);
    expect(empty.cropAvailability).toEqual([]);
    expect(empty.shortageAlerts).toEqual([]);
    expect(empty.summary.servedCounties).toBe(0);
  });
});
