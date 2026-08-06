import { orderStatusPill, paymentPill, fulfillmentPill } from '../orderPill';
import { OrderFulfillmentStatus, OrderPaymentStatus } from '@/types';

// These assert the WORDING as well as the state. Every defect this module was
// written for was a true value carrying a false sentence, so a test that only
// checked the state would have passed throughout.

describe('paymentPill', () => {
  it('treats a refund as concluded, not as something still pending', () => {
    // Regression: the buyer detail screen resolved payment state with an
    // if-chain that had no REFUNDED branch, so a completed refund fell through
    // the catch-all and showed as amber "pending".
    const pill = paymentPill(OrderPaymentStatus.REFUNDED);
    expect(pill.state).toBe('denied');
    expect(pill.label).toBe('Refunded');
    expect(pill.state).not.toBe('pending');
  });

  it('names a failed payment as failed', () => {
    expect(paymentPill(OrderPaymentStatus.FAILED)).toEqual({
      state: 'denied',
      label: 'Payment failed',
    });
  });

  it('marks a settled payment complete', () => {
    expect(paymentPill(OrderPaymentStatus.PAID).state).toBe('completed');
  });
});

describe('fulfillmentPill', () => {
  it('calls a DISPUTED order refunded, because that is the only way it is written', () => {
    // escrowSettlement sets DISPUTED only when a mediation is resolved WITH a
    // refund. Labelling it "Disputed" told the buyer who had won that their
    // order was still contested.
    expect(fulfillmentPill(OrderFulfillmentStatus.DISPUTED)).toEqual({
      state: 'denied',
      label: 'Refunded',
    });
  });
});

describe('orderStatusPill', () => {
  it('reports a refunded order as refunded, not as disputed', () => {
    const pill = orderStatusPill({
      paymentStatus: OrderPaymentStatus.REFUNDED,
      fulfillmentStatus: OrderFulfillmentStatus.DISPUTED,
    });
    expect(pill.label).toBe('Refunded');
    expect(pill.label).not.toBe('Disputed');
  });

  it('surfaces a live escalation that the order state machine deliberately hides', () => {
    // Filing a mediation does not mutate the order, so without the mediation
    // fact an order under review rendered as "Being prepared".
    const pill = orderStatusPill({
      paymentStatus: OrderPaymentStatus.PAID,
      fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
      hasOpenMediation: true,
    });
    expect(pill.label).toBe('Under review');
  });

  it('does not call a failed payment "awaiting payment"', () => {
    // processCallback sets only paymentStatus on failure and leaves fulfilment
    // at AWAITING_PAYMENT, so a fulfilment-only pill told a buyer whose payment
    // had failed that their order was still progressing.
    const pill = orderStatusPill({
      paymentStatus: OrderPaymentStatus.FAILED,
      fulfillmentStatus: OrderFulfillmentStatus.AWAITING_PAYMENT,
    });
    expect(pill.label).toBe('Payment failed');
    expect(pill.state).toBe('denied');
  });

  it('lets a settled delivery outrank a stale escalation flag', () => {
    // Mirrors orderEscrowState, where COMPLETED (RELEASABLE) is checked before
    // hasOpenMediation. The two projections must not disagree.
    const pill = orderStatusPill({
      paymentStatus: OrderPaymentStatus.PAID,
      fulfillmentStatus: OrderFulfillmentStatus.COMPLETED,
      hasOpenMediation: true,
    });
    expect(pill.state).toBe('completed');
  });

  it('describes an ordinary order in progress', () => {
    const pill = orderStatusPill({
      paymentStatus: OrderPaymentStatus.PAID,
      fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
    });
    expect(pill).toEqual({ state: 'in-transit', label: 'Being prepared' });
  });

  it('says nothing about a review when there is no mediation', () => {
    const pill = orderStatusPill({
      paymentStatus: OrderPaymentStatus.PAID,
      fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
      hasOpenMediation: false,
    });
    expect(pill.label).not.toBe('Under review');
  });
});
