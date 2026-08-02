import { adminEscrowSettlementSchema } from '../escrowSchema';
import { paymentActionSchema } from '../paymentActionSchema';
import { MediationOutcome } from '@/types';

describe('adminEscrowSettlementSchema', () => {
  it('accepts a release with a substantive reason', () => {
    const parsed = adminEscrowSettlementSchema.safeParse({
      outcome: MediationOutcome.RELEASE,
      reason: 'Buyer confirmed receipt by phone but never closed the order.',
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts a refund with a substantive reason', () => {
    const parsed = adminEscrowSettlementSchema.safeParse({
      outcome: MediationOutcome.REFUND,
      reason: 'Farmer confirmed they cannot fulfil this order.',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects NONE — a settlement must move the money somewhere', () => {
    const parsed = adminEscrowSettlementSchema.safeParse({
      outcome: MediationOutcome.NONE,
      reason: 'No decision taken on these funds yet.',
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a token reason — the justification is recorded permanently', () => {
    const parsed = adminEscrowSettlementSchema.safeParse({
      outcome: MediationOutcome.RELEASE,
      reason: 'ok',
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a reason over 500 characters', () => {
    const parsed = adminEscrowSettlementSchema.safeParse({
      outcome: MediationOutcome.RELEASE,
      reason: 'x'.repeat(501),
    });
    expect(parsed.success).toBe(false);
  });

  it('trims surrounding whitespace before measuring the reason', () => {
    const parsed = adminEscrowSettlementSchema.safeParse({
      outcome: MediationOutcome.RELEASE,
      reason: '        short        ',
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a missing outcome', () => {
    const parsed = adminEscrowSettlementSchema.safeParse({
      reason: 'Buyer confirmed receipt by phone but never closed the order.',
    });
    expect(parsed.success).toBe(false);
  });
});

describe('paymentActionSchema', () => {
  it.each(['RETRY', 'CANCEL'])('accepts %s', (action) => {
    expect(paymentActionSchema.safeParse({ action }).success).toBe(true);
  });

  it('rejects an unknown action', () => {
    expect(paymentActionSchema.safeParse({ action: 'REFUND' }).success).toBe(false);
  });

  it('rejects a missing action', () => {
    expect(paymentActionSchema.safeParse({}).success).toBe(false);
  });
});
