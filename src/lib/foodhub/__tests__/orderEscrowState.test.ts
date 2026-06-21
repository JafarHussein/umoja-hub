import { orderEscrowState } from '../orderEscrowState';
import {
  EscrowState,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
} from '@/types';

describe('orderEscrowState', () => {
  it('returns NO_FUNDS for an unpaid order', () => {
    expect(
      orderEscrowState({
        paymentStatus: OrderPaymentStatus.PENDING_PAYMENT,
        fulfillmentStatus: OrderFulfillmentStatus.AWAITING_PAYMENT,
      })
    ).toBe(EscrowState.NO_FUNDS);
  });

  it('returns NO_FUNDS for a failed payment', () => {
    expect(
      orderEscrowState({
        paymentStatus: OrderPaymentStatus.FAILED,
        fulfillmentStatus: OrderFulfillmentStatus.AWAITING_PAYMENT,
      })
    ).toBe(EscrowState.NO_FUNDS);
  });

  it('returns HELD for a paid order the farmer has not yet dispatched', () => {
    expect(
      orderEscrowState({
        paymentStatus: OrderPaymentStatus.PAID,
        fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
      })
    ).toBe(EscrowState.HELD);
  });

  it('returns HELD_DISPATCHED once the farmer confirms handover', () => {
    expect(
      orderEscrowState({
        paymentStatus: OrderPaymentStatus.PAID,
        fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
        confirmedByFarmerAt: new Date(),
      })
    ).toBe(EscrowState.HELD_DISPATCHED);
  });

  it('returns HELD_UNDER_REVIEW when a mediation is open, even after dispatch', () => {
    expect(
      orderEscrowState(
        {
          paymentStatus: OrderPaymentStatus.PAID,
          fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
          confirmedByFarmerAt: new Date(),
        },
        true
      )
    ).toBe(EscrowState.HELD_UNDER_REVIEW);
  });

  it('returns RELEASABLE once the buyer confirms receipt (COMPLETED)', () => {
    expect(
      orderEscrowState({
        paymentStatus: OrderPaymentStatus.PAID,
        fulfillmentStatus: OrderFulfillmentStatus.COMPLETED,
      })
    ).toBe(EscrowState.RELEASABLE);
  });

  it('returns REFUNDED whenever the payment was refunded, taking precedence', () => {
    expect(
      orderEscrowState(
        {
          paymentStatus: OrderPaymentStatus.REFUNDED,
          fulfillmentStatus: OrderFulfillmentStatus.DISPUTED,
        },
        true
      )
    ).toBe(EscrowState.REFUNDED);
  });
});
