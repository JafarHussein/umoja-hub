import {
  createOrderSchema,
  updateOrderStatusSchema,
  darajaCallbackSchema,
} from '../orderSchema';

// ---------------------------------------------------------------------------
// createOrderSchema
// ---------------------------------------------------------------------------

describe('createOrderSchema', () => {
  const valid = {
    listingId: '507f1f77bcf86cd799439011',
    quantityOrdered: 10,
    fulfillmentType: 'PICKUP' as const,
    buyerPhone: '0712345678',
  };

  it('accepts a valid order', () => {
    expect(createOrderSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts DELIVERY fulfillment type', () => {
    expect(
      createOrderSchema.safeParse({ ...valid, fulfillmentType: 'DELIVERY' }).success
    ).toBe(true);
  });

  it('accepts +254 phone format', () => {
    expect(
      createOrderSchema.safeParse({ ...valid, buyerPhone: '+254712345678' }).success
    ).toBe(true);
  });

  it('rejects invalid phone format', () => {
    expect(
      createOrderSchema.safeParse({ ...valid, buyerPhone: '0612345678' }).success
    ).toBe(false);
  });

  it('rejects missing listingId', () => {
    expect(
      createOrderSchema.safeParse({ ...valid, listingId: '' }).success
    ).toBe(false);
  });

  it('rejects zero quantity', () => {
    expect(
      createOrderSchema.safeParse({ ...valid, quantityOrdered: 0 }).success
    ).toBe(false);
  });

  it('rejects negative quantity', () => {
    expect(
      createOrderSchema.safeParse({ ...valid, quantityOrdered: -5 }).success
    ).toBe(false);
  });

  it('rejects non-integer quantity', () => {
    expect(
      createOrderSchema.safeParse({ ...valid, quantityOrdered: 2.5 }).success
    ).toBe(false);
  });

  it('rejects invalid fulfillment type', () => {
    expect(
      createOrderSchema.safeParse({ ...valid, fulfillmentType: 'EXPRESS' }).success
    ).toBe(false);
  });

  it('rejects missing required field buyerPhone', () => {
    const { buyerPhone: _, ...noPhone } = valid;
    expect(createOrderSchema.safeParse(noPhone).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateOrderStatusSchema
// ---------------------------------------------------------------------------

describe('updateOrderStatusSchema', () => {
  it('accepts IN_FULFILLMENT status', () => {
    expect(
      updateOrderStatusSchema.safeParse({ fulfillmentStatus: 'IN_FULFILLMENT' }).success
    ).toBe(true);
  });

  it('accepts RECEIVED status', () => {
    expect(
      updateOrderStatusSchema.safeParse({ fulfillmentStatus: 'RECEIVED' }).success
    ).toBe(true);
  });

  it('accepts DISPUTED status with reason', () => {
    expect(
      updateOrderStatusSchema.safeParse({
        fulfillmentStatus: 'DISPUTED',
        disputeReason: 'Farmer delivered fewer bags than agreed.',
      }).success
    ).toBe(true);
  });

  it('rejects invalid fulfillment status', () => {
    expect(
      updateOrderStatusSchema.safeParse({ fulfillmentStatus: 'COMPLETED' }).success
    ).toBe(false);
  });

  it('rejects missing fulfillmentStatus', () => {
    expect(updateOrderStatusSchema.safeParse({}).success).toBe(false);
  });

  it('rejects disputeReason exceeding 500 characters', () => {
    expect(
      updateOrderStatusSchema.safeParse({
        fulfillmentStatus: 'DISPUTED',
        disputeReason: 'x'.repeat(501),
      }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// darajaCallbackSchema
// ---------------------------------------------------------------------------

describe('darajaCallbackSchema', () => {
  const validCallback = {
    Body: {
      stkCallback: {
        MerchantRequestID: 'merchant-123',
        CheckoutRequestID: 'checkout-456',
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        CallbackMetadata: {
          Item: [
            { Name: 'Amount', Value: 500 },
            { Name: 'MpesaReceiptNumber', Value: 'LGR7IQ8I9J' },
            { Name: 'TransactionDate', Value: 20241201120000 },
            { Name: 'PhoneNumber', Value: 254712345678 },
          ],
        },
      },
    },
  };

  it('accepts a valid successful Daraja callback', () => {
    expect(darajaCallbackSchema.safeParse(validCallback).success).toBe(true);
  });

  it('accepts a failed callback (non-zero ResultCode) without metadata', () => {
    const failedCallback = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'merchant-123',
          CheckoutRequestID: 'checkout-456',
          ResultCode: 1032,
          ResultDesc: 'Request cancelled by user.',
        },
      },
    };
    expect(darajaCallbackSchema.safeParse(failedCallback).success).toBe(true);
  });

  it('rejects missing Body', () => {
    expect(darajaCallbackSchema.safeParse({}).success).toBe(false);
  });

  it('rejects missing stkCallback', () => {
    expect(darajaCallbackSchema.safeParse({ Body: {} }).success).toBe(false);
  });

  it('rejects missing ResultCode', () => {
    expect(
      darajaCallbackSchema.safeParse({
        Body: {
          stkCallback: {
            MerchantRequestID: 'merchant-123',
            CheckoutRequestID: 'checkout-456',
            ResultDesc: 'Success',
          },
        },
      }).success
    ).toBe(false);
  });
});
