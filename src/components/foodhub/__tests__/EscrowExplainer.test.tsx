import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EscrowExplainer } from '../EscrowExplainer';
import { EscrowState } from '@/types';

// These assert sentences, not props. The whole point of this component is what
// it SAYS: the platform was already able to state where a buyer's money was,
// and could not state what moved it.

const base = { amountKES: 5896, counterpartyName: 'Kavata' } as const;

describe('EscrowExplainer — the buyer', () => {
  it('says the farmer has not been paid while funds are held', () => {
    render(<EscrowExplainer {...base} escrowState={EscrowState.HELD} viewer="BUYER" />);
    expect(screen.getByText(/UmojaHub is holding your KSh 5,896/)).toBeInTheDocument();
    expect(screen.getByText(/Kavata has not been paid/)).toBeInTheDocument();
  });

  it('names confirmation as the thing that releases the money', () => {
    render(<EscrowExplainer {...base} escrowState={EscrowState.HELD} viewer="BUYER" />);
    expect(screen.getByText(/only when you confirm the produce reached you/)).toBeInTheDocument();
  });

  it('warns before confirming once the produce is on its way', () => {
    // Confirming is irreversible in practice — released money is much harder to
    // recover than held money — so the warning belongs before the act.
    render(<EscrowExplainer {...base} escrowState={EscrowState.HELD_DISPATCHED} viewer="BUYER" />);
    expect(screen.getByText(/Check before you confirm/)).toBeInTheDocument();
  });

  it('tells a buyer under review that nothing moves and they need do nothing', () => {
    render(
      <EscrowExplainer {...base} escrowState={EscrowState.HELD_UNDER_REVIEW} viewer="BUYER" />
    );
    expect(screen.getByText(/while this order is reviewed/)).toBeInTheDocument();
    expect(screen.getByText(/Nothing moves until the review is decided/)).toBeInTheDocument();
  });

  it('promises nothing about money that has not left the account yet', () => {
    render(<EscrowExplainer {...base} escrowState={EscrowState.NO_FUNDS} viewer="BUYER" />);
    expect(screen.getByText(/Nothing has been taken from your account yet/)).toBeInTheDocument();
  });

  it('closes the story on a refund', () => {
    render(<EscrowExplainer {...base} escrowState={EscrowState.REFUNDED} viewer="BUYER" />);
    expect(screen.getByText(/Your KSh 5,896 was returned to you/)).toBeInTheDocument();
  });
});

describe('EscrowExplainer — the farmer', () => {
  it('does not tell a farmer their money is safe before it is theirs', () => {
    // The buyer's reassurance is the farmer's warning. A farmer reading "your
    // money is being held safely" while unpaid would be the wrong sentence
    // entirely — this is why the component takes a viewer.
    render(<EscrowExplainer {...base} escrowState={EscrowState.HELD} viewer="FARMER" />);
    expect(screen.getByText(/It is not yours to spend yet/)).toBeInTheDocument();
  });

  it('tells the farmer what to do about a buyer who will not confirm', () => {
    // The seller's classic exposure in a buyer-confirmation escrow.
    render(<EscrowExplainer {...base} escrowState={EscrowState.HELD} viewer="FARMER" />);
    expect(screen.getByText(/will not confirm after you have delivered/)).toBeInTheDocument();
  });

  it('points the farmer at a payout once the money is theirs', () => {
    render(<EscrowExplainer {...base} escrowState={EscrowState.RELEASABLE} viewer="FARMER" />);
    expect(screen.getByText(/KSh 5,896 is yours/)).toBeInTheDocument();
    expect(screen.getByText(/Request a payout/)).toBeInTheDocument();
  });
});

describe('EscrowExplainer — every state answers both questions', () => {
  it.each(Object.values(EscrowState))('%s explains what moves it and what if it fails', (state) => {
    const { unmount } = render(
      <EscrowExplainer {...base} escrowState={state} viewer="BUYER" />
    );
    expect(screen.getByText('What moves it')).toBeInTheDocument();
    expect(screen.getByText('If something goes wrong')).toBeInTheDocument();
    unmount();

    render(<EscrowExplainer {...base} escrowState={state} viewer="FARMER" />);
    expect(screen.getByText('What moves it')).toBeInTheDocument();
    expect(screen.getByText('If something goes wrong')).toBeInTheDocument();
  });
});

describe('EscrowExplainer — a payment nobody can confirm', () => {
  // The single most important thing this component must never do. UNRESOLVED
  // used to project to NO_FUNDS, whose buyer copy reads "Nothing has been taken
  // from your account yet" — stated on the same order whose notification told
  // the buyer to check their M-Pesa messages because the money may well have
  // gone. Every sentence in this state has to survive being wrong either way.
  it('does not tell the buyer their money is safe, or that it is gone', () => {
    render(<EscrowExplainer {...base} escrowState={EscrowState.UNKNOWN} viewer="BUYER" />);

    expect(screen.getByText(/could not confirm your payment of KSh 5,896/i)).toBeInTheDocument();
    expect(screen.getByText(/Check your M-Pesa messages/)).toBeInTheDocument();
    expect(screen.queryByText(/Nothing has been taken/)).not.toBeInTheDocument();
  });

  it('tells the buyer not to pay twice while we are checking', () => {
    // Paying again is the expensive mistake available to a buyer here, and the
    // only one they can make on their own.
    render(<EscrowExplainer {...base} escrowState={EscrowState.UNKNOWN} viewer="BUYER" />);
    expect(screen.getByText(/do not pay again/i)).toBeInTheDocument();
  });

  it('tells the farmer to hold the produce rather than dispatch on an unpaid order', () => {
    render(<EscrowExplainer {...base} escrowState={EscrowState.UNKNOWN} viewer="FARMER" />);
    expect(screen.getByText(/stays reserved/)).toBeInTheDocument();
    expect(screen.getByText(/Do not dispatch it until this order shows as paid/)).toBeInTheDocument();
  });
});
