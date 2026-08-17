import { buildOrderJourney, currentJourneyStage } from '../orderJourney';
import { OrderFulfillmentStatus, OrderPaymentStatus } from '@/types';

// The journey is a custody record for someone else's money, and it is now the
// single source both timeline views draw from. These pin the properties that
// must hold whoever is reading and whatever has gone wrong.

const PAID = {
  paymentStatus: OrderPaymentStatus.PAID,
  fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
  createdAt: '2026-08-01T09:00:00Z',
  paidAt: '2026-08-01T10:00:00Z',
};

describe('buildOrderJourney', () => {
  it('gives every stage an actor, so no stage leaves the reader guessing who acts next', () => {
    const stages = buildOrderJourney(PAID, 'BUYER');
    expect(stages.length).toBeGreaterThan(0);
    for (const stage of stages) {
      expect(stage.actor.trim()).not.toBe('');
    }
  });

  it('names the reader as the party where the reader is the party', () => {
    const asBuyer = buildOrderJourney(PAID, 'BUYER');
    const asFarmer = buildOrderJourney(PAID, 'FARMER');

    expect(asBuyer.find((s) => s.key === 'received')?.actor).toBe('You');
    expect(asFarmer.find((s) => s.key === 'received')?.actor).toBe('The buyer');
    expect(asFarmer.find((s) => s.key === 'dispatched')?.actor).toBe('You');
  });

  it('keeps custody of the money with the platform, never with either party', () => {
    for (const viewer of ['BUYER', 'FARMER', 'ADMIN'] as const) {
      const stages = buildOrderJourney(PAID, viewer);
      expect(stages.find((s) => s.key === 'paid')?.actor).toBe('UmojaHub holds the funds');
      expect(stages.find((s) => s.key === 'released')?.actor).toBe('UmojaHub');
    }
  });

  it('marks a failed payment as stopped rather than still in progress', () => {
    const stages = buildOrderJourney(
      {
        paymentStatus: OrderPaymentStatus.FAILED,
        fulfillmentStatus: OrderFulfillmentStatus.AWAITING_PAYMENT,
      },
      'BUYER'
    );
    const paid = stages.find((s) => s.key === 'paid');
    expect(paid?.status).toBe('BLOCKED');
    expect(paid?.tone).toBe('danger');
  });

  it('never resolves an unresolved payment either way', () => {
    // The whole point of UNRESOLVED: we do not know. A journey that guessed
    // would be making a claim about money we cannot support.
    const stages = buildOrderJourney(
      {
        paymentStatus: OrderPaymentStatus.UNRESOLVED,
        fulfillmentStatus: OrderFulfillmentStatus.AWAITING_PAYMENT,
      },
      'BUYER'
    );
    const explanation = stages.find((s) => s.key === 'paid')?.explanation ?? '';
    expect(explanation).toMatch(/could not tell us/i);
    expect(explanation).not.toMatch(/did not go through/i);
    expect(stages.find((s) => s.key === 'paid')?.status).not.toBe('DONE');
  });

  it('keeps the whole journey when an order goes under review', () => {
    // A review used to replace the timeline with a banner, so the record of
    // where the money was vanished exactly when it was most needed.
    const stages = buildOrderJourney({ ...PAID, hasOpenMediation: true }, 'BUYER');
    expect(stages.map((s) => s.key)).toEqual(
      expect.arrayContaining(['placed', 'paid', 'dispatched', 'received', 'review'])
    );
    expect(stages.find((s) => s.key === 'review')?.status).toBe('BLOCKED');
  });

  it('ends a refunded order with the refund and never with a release', () => {
    const stages = buildOrderJourney(
      { ...PAID, paymentStatus: OrderPaymentStatus.REFUNDED },
      'BUYER'
    );
    expect(stages.some((s) => s.key === 'refunded')).toBe(true);
    expect(stages.some((s) => s.key === 'released')).toBe(false);
  });

  it('does not read a concluded dispute as a review still under way', () => {
    // fulfillmentStatus DISPUTED is written only when a mediation is resolved
    // WITH a refund — an outcome, not an open review.
    const stages = buildOrderJourney(
      {
        paymentStatus: OrderPaymentStatus.REFUNDED,
        fulfillmentStatus: OrderFulfillmentStatus.DISPUTED,
      },
      'BUYER'
    );
    expect(stages.some((s) => s.key === 'review')).toBe(false);
  });

  it('carries timestamps as ISO instants for each view to format itself', () => {
    const stages = buildOrderJourney(PAID, 'BUYER');
    expect(stages.find((s) => s.key === 'paid')?.at).toBe('2026-08-01T10:00:00.000Z');
    expect(stages.find((s) => s.key === 'placed')?.at).toBe('2026-08-01T09:00:00.000Z');
    // Not yet reached — an absent instant, not a fabricated one.
    expect(stages.find((s) => s.key === 'received')?.at).toBeNull();
  });
});

describe('currentJourneyStage', () => {
  it('points at what is blocking before what is merely in progress', () => {
    const stages = buildOrderJourney({ ...PAID, hasOpenMediation: true }, 'BUYER');
    expect(currentJourneyStage(stages)?.key).toBe('review');
  });

  it('points at the stage being waited on when nothing is blocked', () => {
    expect(currentJourneyStage(buildOrderJourney(PAID, 'BUYER'))?.key).toBe('dispatched');
  });

  it('points at the last thing that happened once the order is finished', () => {
    const stages = buildOrderJourney(
      { ...PAID, fulfillmentStatus: OrderFulfillmentStatus.COMPLETED },
      'BUYER'
    );
    expect(currentJourneyStage(stages)?.key).toBe('released');
  });
});
