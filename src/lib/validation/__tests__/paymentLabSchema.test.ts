import { paymentLabActionSchema, PAYMENT_LAB_ACTIONS } from '../paymentLabSchema';

describe('paymentLabActionSchema', () => {
  it('accepts every supported action with an order id', () => {
    for (const action of PAYMENT_LAB_ACTIONS) {
      expect(
        paymentLabActionSchema.safeParse({ orderId: 'order-1', action }).success
      ).toBe(true);
    }
  });

  it('rejects an unknown action', () => {
    expect(
      paymentLabActionSchema.safeParse({ orderId: 'order-1', action: 'explode' }).success
    ).toBe(false);
  });

  it('rejects a missing order id', () => {
    expect(paymentLabActionSchema.safeParse({ action: 'success' }).success).toBe(false);
  });

  it('rejects an empty order id', () => {
    expect(
      paymentLabActionSchema.safeParse({ orderId: '', action: 'success' }).success
    ).toBe(false);
  });
});
