import { payoutRequestSchema } from '../payoutSchema';

describe('payoutRequestSchema', () => {
  it('accepts a valid positive amount', () => {
    expect(payoutRequestSchema.safeParse({ amountKES: 4500 }).success).toBe(true);
  });

  it('accepts fractional amounts', () => {
    expect(payoutRequestSchema.safeParse({ amountKES: 1250.5 }).success).toBe(true);
  });

  it('rejects zero', () => {
    expect(payoutRequestSchema.safeParse({ amountKES: 0 }).success).toBe(false);
  });

  it('rejects negative amounts', () => {
    expect(payoutRequestSchema.safeParse({ amountKES: -100 }).success).toBe(false);
  });

  it('rejects amounts above the KES 10M sanity cap', () => {
    expect(payoutRequestSchema.safeParse({ amountKES: 10_000_001 }).success).toBe(false);
  });

  it('rejects non-numeric amounts', () => {
    expect(payoutRequestSchema.safeParse({ amountKES: '4500' }).success).toBe(false);
  });

  it('rejects Infinity', () => {
    expect(payoutRequestSchema.safeParse({ amountKES: Infinity }).success).toBe(false);
  });

  it('rejects a missing amount', () => {
    expect(payoutRequestSchema.safeParse({}).success).toBe(false);
  });
});
