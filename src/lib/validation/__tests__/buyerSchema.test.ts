import { adminVerifyBuyerSchema } from '../buyerSchema';

// ---------------------------------------------------------------------------
// adminVerifyBuyerSchema
// ---------------------------------------------------------------------------

describe('adminVerifyBuyerSchema', () => {
  const buyerId = '507f1f77bcf86cd799439011';

  it('accepts an APPROVED decision without a reason', () => {
    expect(
      adminVerifyBuyerSchema.safeParse({ buyerId, decision: 'APPROVED' }).success
    ).toBe(true);
  });

  it('accepts a REJECTED decision with a reason', () => {
    expect(
      adminVerifyBuyerSchema.safeParse({
        buyerId,
        decision: 'REJECTED',
        rejectionReason: 'Certificate is expired',
      }).success
    ).toBe(true);
  });

  it('rejects an invalid decision', () => {
    expect(
      adminVerifyBuyerSchema.safeParse({ buyerId, decision: 'PENDING' }).success
    ).toBe(false);
  });

  it('rejects an empty buyerId', () => {
    expect(
      adminVerifyBuyerSchema.safeParse({ buyerId: '', decision: 'APPROVED' }).success
    ).toBe(false);
  });

  it('rejects a missing decision', () => {
    expect(adminVerifyBuyerSchema.safeParse({ buyerId }).success).toBe(false);
  });

  it('trims the rejection reason', () => {
    const result = adminVerifyBuyerSchema.safeParse({
      buyerId,
      decision: 'REJECTED',
      rejectionReason: '  bad doc  ',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rejectionReason).toBe('bad doc');
  });
});
