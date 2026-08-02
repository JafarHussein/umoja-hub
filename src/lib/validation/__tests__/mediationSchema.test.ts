import {
  mediationRequestSchema,
  adminMediationDecisionSchema,
  mediationResponseSchema,
} from '../mediationSchema';

describe('mediationResponseSchema', () => {
  const statement = 'I delivered this order on Tuesday and the buyer signed for it at their shop.';

  it('accepts a substantive statement', () => {
    expect(mediationResponseSchema.safeParse({ statement }).success).toBe(true);
  });

  it('rejects a statement that says nothing', () => {
    expect(mediationResponseSchema.safeParse({ statement: 'nope' }).success).toBe(false);
  });

  it('accepts up to five photos', () => {
    const evidence = Array.from({ length: 5 }, (_, i) => ({
      url: `https://res.cloudinary.com/x/${i}.jpg`,
      publicId: String(i),
    }));
    expect(mediationResponseSchema.safeParse({ statement, evidence }).success).toBe(true);
  });

  it('rejects more than five photos — a case must stay reviewable', () => {
    const evidence = Array.from({ length: 6 }, (_, i) => ({
      url: `https://res.cloudinary.com/x/${i}.jpg`,
      publicId: String(i),
    }));
    expect(mediationResponseSchema.safeParse({ statement, evidence }).success).toBe(false);
  });

  it('rejects evidence that is not a real URL', () => {
    expect(
      mediationResponseSchema.safeParse({
        statement,
        evidence: [{ url: 'not-a-url', publicId: 'a' }],
      }).success
    ).toBe(false);
  });
});

describe('mediationRequestSchema — farmer ground', () => {
  it('accepts the farmer’s receipt-not-confirmed category', () => {
    expect(
      mediationRequestSchema.safeParse({
        category: 'RECEIPT_NOT_CONFIRMED',
        description: 'The buyer collected this over a week ago and has never confirmed receipt.',
      }).success
    ).toBe(true);
  });
});

describe('mediationRequestSchema', () => {
  const valid = {
    category: 'NOT_DELIVERED',
    description: 'Order was paid five days ago and the farmer has stopped responding to calls.',
  };

  it('accepts a valid escalation', () => {
    expect(mediationRequestSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts every defined category', () => {
    for (const category of ['NOT_DELIVERED', 'QUALITY_ISSUE', 'WRONG_QUANTITY', 'OTHER']) {
      expect(mediationRequestSchema.safeParse({ ...valid, category }).success).toBe(true);
    }
  });

  it('rejects an unknown category', () => {
    expect(mediationRequestSchema.safeParse({ ...valid, category: 'FRAUD' }).success).toBe(false);
  });

  it('rejects a description under 20 characters', () => {
    expect(mediationRequestSchema.safeParse({ ...valid, description: 'too short' }).success).toBe(
      false
    );
  });

  it('rejects a description over 1000 characters', () => {
    expect(
      mediationRequestSchema.safeParse({ ...valid, description: 'x'.repeat(1001) }).success
    ).toBe(false);
  });

  it('rejects a missing category', () => {
    expect(
      mediationRequestSchema.safeParse({ description: valid.description }).success
    ).toBe(false);
  });
});

describe('adminMediationDecisionSchema', () => {
  const REQUEST_ID = '64a1b2c3d4e5f6a7b8c9d0e1';

  it('accepts IN_REVIEW without a note', () => {
    expect(
      adminMediationDecisionSchema.safeParse({ requestId: REQUEST_ID, status: 'IN_REVIEW' }).success
    ).toBe(true);
  });

  it('accepts RESOLVED with a resolution note', () => {
    expect(
      adminMediationDecisionSchema.safeParse({
        requestId: REQUEST_ID,
        status: 'RESOLVED',
        resolutionNote: 'Farmer refunded the buyer directly; both parties confirmed by phone.',
      }).success
    ).toBe(true);
  });

  it('rejects RESOLVED without a resolution note', () => {
    expect(
      adminMediationDecisionSchema.safeParse({ requestId: REQUEST_ID, status: 'RESOLVED' }).success
    ).toBe(false);
  });

  it('rejects an unknown status', () => {
    expect(
      adminMediationDecisionSchema.safeParse({ requestId: REQUEST_ID, status: 'OPEN' }).success
    ).toBe(false);
  });

  it('rejects a missing requestId', () => {
    expect(adminMediationDecisionSchema.safeParse({ status: 'IN_REVIEW' }).success).toBe(false);
  });

  it('rejects a note over 500 characters', () => {
    expect(
      adminMediationDecisionSchema.safeParse({
        requestId: REQUEST_ID,
        status: 'RESOLVED',
        resolutionNote: 'x'.repeat(501),
      }).success
    ).toBe(false);
  });
});
