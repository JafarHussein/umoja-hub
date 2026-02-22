import { priceAlertSchema } from '../priceSchema';

describe('priceAlertSchema', () => {
  const valid = {
    cropName: 'maize',
    county: 'Nakuru' as const,
    targetPricePerUnit: 35,
    unit: 'KG' as const,
    notificationMethod: 'SMS' as const,
  };

  it('accepts a valid price alert', () => {
    expect(priceAlertSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts EMAIL notification method', () => {
    expect(
      priceAlertSchema.safeParse({ ...valid, notificationMethod: 'EMAIL' }).success
    ).toBe(true);
  });

  it('accepts BOTH notification method', () => {
    expect(
      priceAlertSchema.safeParse({ ...valid, notificationMethod: 'BOTH' }).success
    ).toBe(true);
  });

  it('accepts all valid unit types', () => {
    for (const unit of ['KG', 'BAG', 'CRATE', 'LITRE', 'PIECE'] as const) {
      expect(priceAlertSchema.safeParse({ ...valid, unit }).success).toBe(true);
    }
  });

  it('rejects target price of 0', () => {
    expect(
      priceAlertSchema.safeParse({ ...valid, targetPricePerUnit: 0 }).success
    ).toBe(false);
  });

  it('rejects negative target price', () => {
    expect(
      priceAlertSchema.safeParse({ ...valid, targetPricePerUnit: -10 }).success
    ).toBe(false);
  });

  it('rejects empty crop name', () => {
    expect(
      priceAlertSchema.safeParse({ ...valid, cropName: '' }).success
    ).toBe(false);
  });

  it('rejects crop name exceeding 50 characters', () => {
    expect(
      priceAlertSchema.safeParse({ ...valid, cropName: 'x'.repeat(51) }).success
    ).toBe(false);
  });

  it('rejects invalid county', () => {
    expect(
      priceAlertSchema.safeParse({ ...valid, county: 'FakeCounty' }).success
    ).toBe(false);
  });

  it('rejects invalid unit', () => {
    expect(
      priceAlertSchema.safeParse({ ...valid, unit: 'TONNE' }).success
    ).toBe(false);
  });

  it('rejects invalid notification method', () => {
    expect(
      priceAlertSchema.safeParse({ ...valid, notificationMethod: 'WHATSAPP' }).success
    ).toBe(false);
  });

  it('rejects missing required fields', () => {
    expect(priceAlertSchema.safeParse({}).success).toBe(false);
  });

  it('rejects missing notificationMethod', () => {
    const { notificationMethod: _, ...noMethod } = valid;
    expect(priceAlertSchema.safeParse(noMethod).success).toBe(false);
  });
});
