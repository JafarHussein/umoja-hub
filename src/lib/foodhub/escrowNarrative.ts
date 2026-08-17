import { EscrowState, OrderPaymentStatus } from '@/types';
import type { MoneyTone } from '@/components/foodhub/MoneyStatement';

// ---------------------------------------------------------------------------
// What is happening to this money, said in one sentence, then two more.
//
// This was a component — a bordered panel with a padlock, sitting a third of the
// way down the order screen among nine other bordered panels. The sentences were
// right and the placement was wrong: "UmojaHub is holding your KSh 13,812" is
// the answer to the question the screen exists to answer, and it was ranked
// level with the rating form.
//
// So the narrative is pure now, and the screens place its three parts by
// importance rather than rendering them as a block:
//
//   headline      → under the amount, as the status of the money
//   releasedBy    → the next-step zone, as the consequence of the action
//   ifItGoesWrong → behind the "If something goes wrong" disclosure
//
// The farmer's sentences differ from the buyer's because their exposure differs:
// the buyer risks paying for produce that never arrives, the farmer risks
// delivering and not being paid. Telling a farmer "your money is safe" before
// they have been paid would be the wrong reassurance entirely.
//
// Language follows the house rule for money surfaces: say it the way M-Pesa says
// it. "Held by UmojaHub until you confirm" rather than "escrow state HELD".
// ---------------------------------------------------------------------------

export type EscrowViewer = 'BUYER' | 'FARMER';

export interface IEscrowNarrative {
  /** Which figure this is, above the amount. */
  label: string;
  /** Where the money is, in one line. */
  headline: string;
  /** What moves it from here. */
  releasedBy: string;
  /** What happens if it goes wrong. */
  ifItGoesWrong: string;
  tone: MoneyTone;
}

export function escrowNarrative(
  state: EscrowState,
  viewer: EscrowViewer,
  amountKES: number,
  counterpartyName: string,
  /**
   * Disambiguates NO_FUNDS, which covers two different facts: a payment that
   * has not happened yet, and one that has been established not to have
   * happened. "Nothing has been taken from your account yet" is true of the
   * first and wrong about the second, where there is no "yet" left.
   */
  paymentStatus?: string
): IEscrowNarrative {
  const buyer = viewer === 'BUYER';
  const amount = amountKES.toLocaleString();
  const other = counterpartyName;

  switch (state) {
    case EscrowState.NO_FUNDS: {
      const failed = paymentStatus === OrderPaymentStatus.FAILED;
      return {
        label: failed ? 'Payment not completed' : 'Order total',
        headline: failed
          ? buyer
            ? 'This payment did not go through. Nothing left your account.'
            : `${other} did not complete this payment, so no money is being held.`
          : buyer
            ? 'Nothing has been taken from your account yet.'
            : 'No money is being held for this order yet.',
        releasedBy: failed
          ? buyer
            ? `You can pay for this order again at the same price, as long as ${other} still has the stock.`
            : 'The produce has gone back to the marketplace and can be sold to someone else.'
          : buyer
            ? 'Money only leaves your account once you enter your M-Pesa PIN.'
            : `Nothing is owed until ${other} has paid and UmojaHub is holding the money.`,
        ifItGoesWrong: buyer
          ? 'If money did leave your account for this order, contact UmojaHub with the order reference and we will trace it.'
          : 'If the payment does not go through, the order closes and your produce returns to the marketplace.',
        tone: failed ? 'stopped' : 'neutral',
      };
    }

    case EscrowState.UNKNOWN:
      return {
        label: 'Payment being checked',
        // Says nothing about where the money is, because we do not know. Every
        // sentence here is written to survive being wrong in either direction.
        headline: buyer
          ? 'We could not confirm this payment either way. Check your M-Pesa messages.'
          : `We could not confirm whether ${other} was charged.`,
        releasedBy: buyer
          ? 'If the money left your account, UmojaHub will complete this order. Please do not pay again in the meantime. If it did not, we will close the order and put the produce back on sale.'
          : `The produce stays reserved for this order while UmojaHub checks the M-Pesa record. Do not dispatch it until this order shows as paid.`,
        ifItGoesWrong: buyer
          ? 'Someone at UmojaHub is checking this by hand and you will be told the outcome. If you were charged, you will not lose the money.'
          : `You will be told the outcome. If ${other} was charged, the order continues as normal from there.`,
        tone: 'checking',
      };

    case EscrowState.HELD:
      return {
        label: buyer ? 'Amount paid' : 'Held for you',
        headline: buyer
          ? `Held by UmojaHub until you confirm the produce arrived. ${other} has not been paid.`
          : `${other} has paid. UmojaHub is holding the money until they confirm the produce arrived.`,
        releasedBy: buyer
          ? `It is released to ${other} only when you confirm the produce reached you. Nobody else can release it.`
          : `Send the produce, then ask ${other} to confirm. Their confirmation is what releases the money to you.`,
        ifItGoesWrong: buyer
          ? 'If it never arrives, ask UmojaHub to review the order and we can return your money.'
          : `If ${other} will not confirm after you have delivered, ask UmojaHub to review the order.`,
        tone: 'held',
      };

    case EscrowState.HELD_DISPATCHED:
      return {
        label: buyer ? 'Amount paid' : 'Held for you',
        headline: buyer
          ? `${other} has sent your order. The money is still held.`
          : `You marked this sent. UmojaHub still holds the money until ${other} confirms.`,
        releasedBy: buyer
          ? 'Check the produce, then confirm receipt. Confirming is what pays the farmer, so check before you do it.'
          : `The money moves to you when ${other} confirms what arrived.`,
        ifItGoesWrong: buyer
          ? 'If what arrives is wrong, or nothing arrives, do not confirm. Ask UmojaHub to review it instead.'
          : `If ${other} does not confirm within a reasonable time, ask UmojaHub to review the order.`,
        tone: 'held',
      };

    case EscrowState.HELD_UNDER_REVIEW:
      return {
        label: buyer ? 'Amount paid' : 'Held for you',
        headline: 'Held by UmojaHub while this order is reviewed.',
        releasedBy:
          'Nothing moves until the review is decided. An administrator reads both accounts and then either releases the money or returns it.',
        ifItGoesWrong: buyer
          ? 'You will be told the decision and what happens to your money. There is nothing else you need to do for now.'
          : 'You will be told the decision. Adding your account of what happened is the most useful thing you can do now.',
        tone: 'checking',
      };

    case EscrowState.RELEASABLE:
      return {
        label: buyer ? 'Amount paid' : 'Cleared for you',
        headline: buyer
          ? `You confirmed this order. The KSh ${amount} is ${other}'s now.`
          : `${other} confirmed the produce arrived, so this money has cleared and is yours.`,
        releasedBy: buyer
          ? 'This is done. Confirming receipt is what released it.'
          : 'Request a payout and an administrator will send it to your M-Pesa number.',
        ifItGoesWrong: buyer
          ? 'If something is wrong with an order you already confirmed, contact UmojaHub. Released money is much harder to recover.'
          : 'If a payout does not arrive after it is approved, contact UmojaHub with the order reference.',
        tone: 'settled',
      };

    case EscrowState.REFUNDED:
      return {
        label: 'Amount refunded',
        headline: buyer
          ? 'This money was returned to you.'
          : `The money was returned to ${other} and this order is closed.`,
        releasedBy: 'This order is finished. No further money moves.',
        ifItGoesWrong: buyer
          ? 'If the refund has not reached your M-Pesa, contact UmojaHub with the order reference.'
          : 'The produce went back to the marketplace and can be sold again.',
        tone: 'settled',
      };
  }
}
