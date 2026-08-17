import { escrowNarrative } from '../escrowNarrative';
import { EscrowState, OrderPaymentStatus } from '@/types';

// These assert sentences, not props. The whole point of this module is what it
// SAYS about someone's money: the platform was already good at stating where
// the money was, and could not state what moved it.
//
// Previously tested through the EscrowExplainer component. The sentences moved
// out of the card so the screens could rank them (headline into the statement,
// releasedBy onto the action, ifItGoesWrong behind disclosure), and the tests
// followed them to where they now live.

const AMOUNT = 5896;
const OTHER = 'Kavata';

describe('escrowNarrative — the buyer', () => {
  it('says the farmer has not been paid while funds are held', () => {
    const n = escrowNarrative(EscrowState.HELD, 'BUYER', AMOUNT, OTHER);
    expect(n.headline).toMatch(/Held by UmojaHub until you confirm/);
    expect(n.headline).toMatch(/Kavata has not been paid/);
  });

  it('names confirmation as the thing that releases the money', () => {
    const n = escrowNarrative(EscrowState.HELD, 'BUYER', AMOUNT, OTHER);
    expect(n.releasedBy).toMatch(/only when you confirm/);
    expect(n.releasedBy).toMatch(/Nobody else can release it/);
  });

  it('warns the buyer to check before confirming, because confirming pays', () => {
    const n = escrowNarrative(EscrowState.HELD_DISPATCHED, 'BUYER', AMOUNT, OTHER);
    expect(n.releasedBy).toMatch(/check before you do it/i);
  });

  it('tells a buyer under review that nothing moves until it is decided', () => {
    const n = escrowNarrative(EscrowState.HELD_UNDER_REVIEW, 'BUYER', AMOUNT, OTHER);
    expect(n.releasedBy).toMatch(/Nothing moves until the review is decided/);
  });

  it('states plainly that nothing has been taken before a payment happens', () => {
    const n = escrowNarrative(
      EscrowState.NO_FUNDS,
      'BUYER',
      AMOUNT,
      OTHER,
      OrderPaymentStatus.PENDING_PAYMENT
    );
    expect(n.headline).toMatch(/Nothing has been taken from your account yet/);
  });

  it('closes the refund rather than leaving it sounding in progress', () => {
    const n = escrowNarrative(EscrowState.REFUNDED, 'BUYER', AMOUNT, OTHER);
    expect(n.label).toBe('Amount refunded');
    expect(n.releasedBy).toMatch(/No further money moves/);
  });
});

describe('escrowNarrative — the farmer', () => {
  it('does not tell a farmer their money is safe before it is theirs', () => {
    // The buyer's reassurance is the farmer's warning. "Your money is being
    // held safely" to an unpaid farmer would be the wrong sentence entirely.
    const n = escrowNarrative(EscrowState.HELD, 'FARMER', AMOUNT, OTHER);
    expect(n.headline).toMatch(/Kavata has paid/);
    expect(n.releasedBy).toMatch(/Their confirmation is what releases the money to you/);
  });

  it('tells the farmer their money has cleared once the buyer confirms', () => {
    const n = escrowNarrative(EscrowState.RELEASABLE, 'FARMER', AMOUNT, OTHER);
    expect(n.headline).toMatch(/cleared and is yours/);
    expect(n.releasedBy).toMatch(/Request a payout/);
  });

  it('gives every state a label, a headline, a release and a recourse, for both readers', () => {
    // A money surface that falls silent in a state is the failure this replaces:
    // the farmer's old screen said nothing at all about an order under review or
    // one whose money had cleared.
    for (const state of Object.values(EscrowState)) {
      for (const viewer of ['BUYER', 'FARMER'] as const) {
        const n = escrowNarrative(state, viewer, AMOUNT, OTHER);
        expect(n.label.trim()).not.toBe('');
        expect(n.headline.trim()).not.toBe('');
        expect(n.releasedBy.trim()).not.toBe('');
        expect(n.ifItGoesWrong.trim()).not.toBe('');
      }
    }
  });
});

describe('escrowNarrative — a payment nobody can confirm', () => {
  // The single most important thing this module must never do. UNRESOLVED used
  // to project to NO_FUNDS, whose buyer copy reads "Nothing has been taken from
  // your account yet" — stated on the same order whose notification told the
  // buyer to check their M-Pesa messages because the money may well have gone.
  it('does not tell the buyer their money is safe, or that it is gone', () => {
    const n = escrowNarrative(EscrowState.UNKNOWN, 'BUYER', AMOUNT, OTHER);
    expect(n.headline).toMatch(/could not confirm this payment either way/i);
    expect(n.headline).not.toMatch(/Nothing has been taken/);
  });

  it('tells the buyer not to pay twice while we are checking', () => {
    // The expensive mistake available to a buyer here, and the only one they
    // can make on their own.
    const n = escrowNarrative(EscrowState.UNKNOWN, 'BUYER', AMOUNT, OTHER);
    expect(n.releasedBy).toMatch(/do not pay again/i);
  });

  it('tells the farmer to hold the produce rather than dispatch on an unpaid order', () => {
    const n = escrowNarrative(EscrowState.UNKNOWN, 'FARMER', AMOUNT, OTHER);
    expect(n.releasedBy).toMatch(/stays reserved/);
    expect(n.releasedBy).toMatch(/Do not dispatch it until this order shows as paid/);
  });
});

describe('escrowNarrative — a payment that failed', () => {
  it('stops saying "yet" about a payment that has already been settled as failed', () => {
    // NO_FUNDS covers two different facts: a payment that has not happened, and
    // one established not to have happened. "Nothing has been taken from your
    // account yet" is true of the first and wrong about the second.
    const n = escrowNarrative(
      EscrowState.NO_FUNDS,
      'BUYER',
      AMOUNT,
      OTHER,
      OrderPaymentStatus.FAILED
    );
    expect(n.headline).toMatch(/did not go through/);
    expect(n.headline).not.toMatch(/yet/);
    expect(n.tone).toBe('stopped');
  });

  it('offers the buyer the way forward, and the farmer the consequence', () => {
    const buyer = escrowNarrative(
      EscrowState.NO_FUNDS,
      'BUYER',
      AMOUNT,
      OTHER,
      OrderPaymentStatus.FAILED
    );
    const farmer = escrowNarrative(
      EscrowState.NO_FUNDS,
      'FARMER',
      AMOUNT,
      OTHER,
      OrderPaymentStatus.FAILED
    );
    expect(buyer.releasedBy).toMatch(/pay for this order again/i);
    expect(farmer.releasedBy).toMatch(/back to the marketplace/);
  });
});
