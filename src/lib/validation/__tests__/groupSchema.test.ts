import { groupCreationSchema, groupMemberSchema, groupOrderSchema } from '../groupSchema';

// ---------------------------------------------------------------------------
// groupCreationSchema
// ---------------------------------------------------------------------------

describe('groupCreationSchema', () => {
  const valid = {
    groupName: 'Limuru Dairy Farmers Cooperative',
    county: 'Kiambu' as const,
  };

  it('accepts a valid group creation', () => {
    expect(groupCreationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects group name shorter than 3 characters', () => {
    expect(groupCreationSchema.safeParse({ ...valid, groupName: 'Hi' }).success).toBe(false);
  });

  it('rejects group name longer than 100 characters', () => {
    expect(
      groupCreationSchema.safeParse({ ...valid, groupName: 'x'.repeat(101) }).success
    ).toBe(false);
  });

  it('rejects invalid county', () => {
    expect(
      groupCreationSchema.safeParse({ ...valid, county: 'NotACounty' }).success
    ).toBe(false);
  });

  it('rejects missing county', () => {
    const { county: _, ...noCounty } = valid;
    expect(groupCreationSchema.safeParse(noCounty).success).toBe(false);
  });

  it('rejects missing groupName', () => {
    const { groupName: _, ...noName } = valid;
    expect(groupCreationSchema.safeParse(noName).success).toBe(false);
  });

  it('accepts Nakuru as a valid county', () => {
    expect(
      groupCreationSchema.safeParse({ ...valid, county: 'Nakuru' }).success
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// groupMemberSchema
// ---------------------------------------------------------------------------

describe('groupMemberSchema', () => {
  it('accepts ADD action', () => {
    expect(
      groupMemberSchema.safeParse({ action: 'ADD', userId: '507f1f77bcf86cd799439011' }).success
    ).toBe(true);
  });

  it('accepts REMOVE action', () => {
    expect(
      groupMemberSchema.safeParse({ action: 'REMOVE', userId: '507f1f77bcf86cd799439011' }).success
    ).toBe(true);
  });

  it('rejects invalid action', () => {
    expect(
      groupMemberSchema.safeParse({ action: 'INVITE', userId: '507f1f77bcf86cd799439011' }).success
    ).toBe(false);
  });

  it('rejects empty userId', () => {
    expect(
      groupMemberSchema.safeParse({ action: 'ADD', userId: '' }).success
    ).toBe(false);
  });

  it('rejects missing action', () => {
    expect(
      groupMemberSchema.safeParse({ userId: '507f1f77bcf86cd799439011' }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// groupOrderSchema
// ---------------------------------------------------------------------------

describe('groupOrderSchema', () => {
  const valid = {
    supplierId: '507f1f77bcf86cd799439011',
    inputType: 'CAN Fertilizer 50kg',
    quantityPerMember: 2,
    pricePerMember: 3500,
    joiningDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    minimumMembers: 5,
  };

  it('accepts a valid group order', () => {
    expect(groupOrderSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects minimumMembers below 5', () => {
    expect(
      groupOrderSchema.safeParse({ ...valid, minimumMembers: 4 }).success
    ).toBe(false);
  });

  it('accepts minimumMembers of exactly 5', () => {
    expect(
      groupOrderSchema.safeParse({ ...valid, minimumMembers: 5 }).success
    ).toBe(true);
  });

  it('accepts minimumMembers of 50 (max group size)', () => {
    expect(
      groupOrderSchema.safeParse({ ...valid, minimumMembers: 50 }).success
    ).toBe(true);
  });

  it('rejects minimumMembers above 50', () => {
    expect(
      groupOrderSchema.safeParse({ ...valid, minimumMembers: 51 }).success
    ).toBe(false);
  });

  it('rejects zero quantityPerMember', () => {
    expect(
      groupOrderSchema.safeParse({ ...valid, quantityPerMember: 0 }).success
    ).toBe(false);
  });

  it('rejects negative pricePerMember', () => {
    expect(
      groupOrderSchema.safeParse({ ...valid, pricePerMember: -100 }).success
    ).toBe(false);
  });

  it('rejects zero pricePerMember', () => {
    expect(
      groupOrderSchema.safeParse({ ...valid, pricePerMember: 0 }).success
    ).toBe(false);
  });

  it('rejects empty supplierId', () => {
    expect(
      groupOrderSchema.safeParse({ ...valid, supplierId: '' }).success
    ).toBe(false);
  });

  it('rejects inputType shorter than 3 characters', () => {
    expect(
      groupOrderSchema.safeParse({ ...valid, inputType: 'Hi' }).success
    ).toBe(false);
  });

  it('rejects inputType longer than 100 characters', () => {
    expect(
      groupOrderSchema.safeParse({ ...valid, inputType: 'x'.repeat(101) }).success
    ).toBe(false);
  });

  it('rejects invalid ISO datetime for joiningDeadline', () => {
    expect(
      groupOrderSchema.safeParse({ ...valid, joiningDeadline: '2024-13-45' }).success
    ).toBe(false);
  });

  it('rejects non-integer minimumMembers', () => {
    expect(
      groupOrderSchema.safeParse({ ...valid, minimumMembers: 5.5 }).success
    ).toBe(false);
  });
});
