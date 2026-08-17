import { EscrowState, OrderPaymentStatus, OrderFulfillmentStatus } from '@/types';

// ---------------------------------------------------------------------------
// Per-order escrow projection. Pure — no DB access. Maps the facts the order
// already records (payment status, fulfilment status, dispatch attestation) plus
// whether an escalation is open into the single escrow state surfaced to the
// farmer, buyer, and admin. There is no stored escrow field; this is always
// derived. See EscrowState in src/types and the state machine in
// context/ESCROW_ARCHITECTURE_REPORT.md (Deliverable 4).
// ---------------------------------------------------------------------------

export interface OrderEscrowInput {
  paymentStatus: string;
  fulfillmentStatus: string;
  /** Set when the farmer has confirmed carrier handover. */
  confirmedByFarmerAt?: Date | string | null;
}

/**
 * @param order            minimal order shape (payment + fulfilment + dispatch)
 * @param hasOpenMediation true when an OPEN or IN_REVIEW mediation exists for it
 */
export function orderEscrowState(
  order: OrderEscrowInput,
  hasOpenMediation = false
): EscrowState {
  // A refund is terminal and takes precedence over everything else.
  if (order.paymentStatus === OrderPaymentStatus.REFUNDED) {
    return EscrowState.REFUNDED;
  }

  // We asked M-Pesa and could not find out. Distinct from NO_FUNDS, which is a
  // claim that nothing was taken — a claim we are in no position to make here,
  // and one the buyer's own order page used to make on this exact state while
  // the notification beside it said to go and check their M-Pesa messages.
  if (order.paymentStatus === OrderPaymentStatus.UNRESOLVED) {
    return EscrowState.UNKNOWN;
  }

  // Funds only ever enter escrow on a confirmed payment.
  if (order.paymentStatus !== OrderPaymentStatus.PAID) {
    return EscrowState.NO_FUNDS;
  }

  // Buyer confirmed receipt — funds are releasable to the farmer.
  if (order.fulfillmentStatus === OrderFulfillmentStatus.COMPLETED) {
    return EscrowState.RELEASABLE;
  }

  // Paid, not yet completed — funds are held. A live escalation blocks release.
  if (hasOpenMediation) {
    return EscrowState.HELD_UNDER_REVIEW;
  }

  return order.confirmedByFarmerAt ? EscrowState.HELD_DISPATCHED : EscrowState.HELD;
}
