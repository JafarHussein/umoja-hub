import { payoutRequestSchema, adminPayoutDecisionSchema } from '../payoutSchema';

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

describe('adminPayoutDecisionSchema', () => {
  const REQUEST_ID = '64a1b2c3d4e5f6a7b8c9d0e1';

  it('accepts APPROVED without a note', () => {
    expect(
      adminPayoutDecisionSchema.safeParse({ requestId: REQUEST_ID, decision: 'APPROVED' }).success
    ).toBe(true);
  });

  it('accepts PAID with a payment reference note', () => {
    expect(
      adminPayoutDecisionSchema.safeParse({
        requestId: REQUEST_ID,
        decision: 'PAID',
        note: 'M-Pesa ref QFX12ABC34',
      }).success
    ).toBe(true);
  });

  it('accepts REJECTED with a reason note', () => {
    expect(
      adminPayoutDecisionSchema.safeParse({
        requestId: REQUEST_ID,
        decision: 'REJECTED',
        note: 'Amount does not match recent order activity',
      }).success
    ).toBe(true);
  });

  it('rejects REJECTED without a note', () => {
    expect(
      adminPayoutDecisionSchema.safeParse({ requestId: REQUEST_ID, decision: 'REJECTED' }).success
    ).toBe(false);
  });

  it('rejects an unknown decision value', () => {
    expect(
      adminPayoutDecisionSchema.safeParse({ requestId: REQUEST_ID, decision: 'CANCELLED' }).success
    ).toBe(false);
  });

  it('rejects a missing requestId', () => {
    expect(adminPayoutDecisionSchema.safeParse({ decision: 'APPROVED' }).success).toBe(false);
  });

  it('rejects a note over 500 characters', () => {
    expect(
      adminPayoutDecisionSchema.safeParse({
        requestId: REQUEST_ID,
        decision: 'APPROVED',
        note: 'x'.repeat(501),
      }).success
    ).toBe(false);
  });
});
