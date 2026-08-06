import React from 'react';
import { cn } from '@/lib/cn';
import { EscrowState } from '@/types';

// ---------------------------------------------------------------------------
// EscrowExplainer — what is happening to this money, and what governs it.
//
// The platform was already good at saying WHERE a buyer's money was. It never
// said what MOVES it. A buyer could see "held in escrow" and still not know
// what releases it, what happens if the produce never turns up, when UmojaHub
// steps in, or what follows a dispute — so escrow read as a status word rather
// than a promise anyone could rely on.
//
// One component, both sides, every state. The farmer's and the buyer's
// sentences differ because their exposure differs: the buyer's risk is paying
// for produce that never arrives, the farmer's is delivering and not being
// paid. Saying "your money is safe" to a farmer who has not been paid yet would
// be the wrong reassurance entirely.
//
// Language follows the house rule for money surfaces: say it the way M-Pesa
// says it. "Held by UmojaHub until you confirm" rather than "funds in escrow".
// ---------------------------------------------------------------------------

export type EscrowViewer = 'BUYER' | 'FARMER';

export interface IEscrowExplainerProps {
  escrowState: EscrowState;
  viewer: EscrowViewer;
  amountKES: number;
  /** The other party, named — "released to Kavata" reads better than "the farmer". */
  counterpartyName: string;
  className?: string;
}

interface Explanation {
  /** Where the money is, in one line. */
  headline: string;
  /** What moves it from here. */
  releasedBy: string;
  /** What happens if it goes wrong. */
  ifItGoesWrong: string;
}

function explain(
  state: EscrowState,
  viewer: EscrowViewer,
  amount: string,
  other: string
): Explanation {
  const buyer = viewer === 'BUYER';

  switch (state) {
    case EscrowState.NO_FUNDS:
      return {
        headline: buyer
          ? 'Nothing has been taken from your account yet.'
          : `No money is being held for this order yet.`,
        releasedBy: buyer
          ? 'Money only leaves your account once you enter your M-Pesa PIN.'
          : `Nothing is owed until ${other} has paid and UmojaHub is holding the money.`,
        ifItGoesWrong: buyer
          ? 'If the payment does not go through, the order closes and the produce goes back on sale. You can try again.'
          : 'If the payment does not go through, the order closes and your produce returns to the marketplace.',
      };

    case EscrowState.HELD:
      return {
        headline: buyer
          ? `UmojaHub is holding your KSh ${amount}. ${other} has not been paid.`
          : `UmojaHub is holding KSh ${amount} for you. It is not yours to spend yet.`,
        releasedBy: buyer
          ? `It is released to ${other} only when you confirm the produce reached you. Nobody else can release it.`
          : `It is released to you when ${other} confirms the produce reached them. Send it, then ask them to confirm.`,
        ifItGoesWrong: buyer
          ? `If it never arrives, ask UmojaHub to review the order and we can return your money.`
          : `If ${other} will not confirm after you have delivered, ask UmojaHub to review the order.`,
      };

    case EscrowState.HELD_DISPATCHED:
      return {
        headline: buyer
          ? `${other} has sent your order. Your KSh ${amount} is still held.`
          : `You have marked this sent. UmojaHub still holds the KSh ${amount}.`,
        releasedBy: buyer
          ? 'Confirm receipt once you have checked the produce, and the money goes to the farmer. Check before you confirm — this step is what pays them.'
          : `The money moves to you when ${other} confirms what arrived.`,
        ifItGoesWrong: buyer
          ? 'If what arrives is wrong, or nothing arrives, do not confirm. Ask UmojaHub to review it instead.'
          : `If ${other} does not confirm within a reasonable time, ask UmojaHub to review the order.`,
      };

    case EscrowState.HELD_UNDER_REVIEW:
      return {
        headline: `UmojaHub is holding the KSh ${amount} while this order is reviewed.`,
        releasedBy:
          'Nothing moves until the review is decided. An administrator reads both accounts and then either releases the money or returns it.',
        ifItGoesWrong: buyer
          ? 'You will be told the decision and what happens to your money. You do not need to do anything else for now.'
          : 'You will be told the decision. Adding your account of what happened is the most useful thing you can do now.',
      };

    case EscrowState.RELEASABLE:
      return {
        headline: buyer
          ? `You confirmed this order. The KSh ${amount} is ${other}'s now.`
          : `KSh ${amount} is yours. ${other} confirmed the produce arrived.`,
        releasedBy: buyer
          ? 'This is done — confirming receipt is what released it.'
          : 'Request a payout and an administrator will send it to your M-Pesa number.',
        ifItGoesWrong: buyer
          ? 'If something is wrong with an order you already confirmed, contact UmojaHub — but released money is much harder to recover.'
          : 'If a payout does not arrive after it is approved, contact UmojaHub with the order reference.',
      };

    case EscrowState.REFUNDED:
      return {
        headline: buyer
          ? `Your KSh ${amount} was returned to you.`
          : `The KSh ${amount} was returned to ${other} and this order is closed.`,
        releasedBy: 'This order is finished. No further money moves.',
        ifItGoesWrong: buyer
          ? 'If the refund has not reached your M-Pesa, contact UmojaHub with the order reference.'
          : 'The produce went back to the marketplace and can be sold again.',
      };
  }
}

export function EscrowExplainer({
  escrowState,
  viewer,
  amountKES,
  counterpartyName,
  className,
}: IEscrowExplainerProps): React.ReactElement {
  const e = explain(escrowState, viewer, amountKES.toLocaleString(), counterpartyName);

  return (
    <section
      aria-label="What is happening to this payment"
      className={cn(
        'rounded-app-card border border-app-brand-border bg-app-brand-surface p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="app-title leading-none text-app-brand" aria-hidden>
          🔒
        </span>
        <div className="space-y-3">
          <p className="app-body-strong text-app-ink">{e.headline}</p>

          <dl className="space-y-2">
            <div>
              <dt className="app-label text-app-muted">What moves it</dt>
              <dd className="app-meta text-app-muted">{e.releasedBy}</dd>
            </div>
            <div>
              <dt className="app-label text-app-muted">If something goes wrong</dt>
              <dd className="app-meta text-app-muted">{e.ifItGoesWrong}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
