import {
  ORDER_FULFILLMENT_LABEL,
  ORDER_PAYMENT_LABEL,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
} from '@/types';
import type { StatusState } from '@/components/app';

// ---------------------------------------------------------------------------
// How an order describes itself in a pill.
//
// This existed three times over — once in the buyer's order list, once on the
// buyer's order detail screen, once on the farmer's — and each copy was written
// as an if-chain over ONE status field with a catch-all `return 'pending'` at
// the bottom. That shape is why the same three lies kept reappearing:
//
//   - `fulfillmentStatus === DISPUTED` read as an unresolved "Disputed".
//     escrowSettlement writes it only when a mediation is resolved WITH A
//     REFUND, so the only buyer who ever saw that red pill was the buyer who
//     had won the dispute and already had their money back.
//   - A live escalation showed nothing, because filing one deliberately does
//     not touch the order state machine (see MediationRequest.model). An order
//     under review was indistinguishable from an untroubled one.
//   - `REFUNDED` matched no branch and fell through the catch-all to amber
//     "pending" — a concluded refund shown as something still in progress.
//
// The fix is the shape, not the branches. States are resolved through
// exhaustive `Record<Enum, …>` maps, so adding a status to either enum is a
// compile error here rather than a silent fall-through to "pending".
// ---------------------------------------------------------------------------

export interface OrderPill {
  state: StatusState;
  label: string;
}

/** The money axis on its own. Exhaustive: a new payment status will not compile. */
const PAYMENT_STATE: Record<OrderPaymentStatus, StatusState> = {
  [OrderPaymentStatus.PAID]: 'completed',
  [OrderPaymentStatus.PENDING_PAYMENT]: 'pending',
  [OrderPaymentStatus.FAILED]: 'denied',
  // A refund is terminal, not pending. `denied` is the established pill for a
  // terminal non-success outcome — the admin escrow screen already labels a
  // refunded order this way, and the wording carries the meaning.
  [OrderPaymentStatus.REFUNDED]: 'denied',
};

/** The delivery axis on its own. Exhaustive for the same reason. */
const FULFILLMENT_STATE: Record<OrderFulfillmentStatus, StatusState> = {
  [OrderFulfillmentStatus.AWAITING_PAYMENT]: 'pending',
  [OrderFulfillmentStatus.IN_FULFILLMENT]: 'in-transit',
  [OrderFulfillmentStatus.RECEIVED]: 'completed',
  [OrderFulfillmentStatus.COMPLETED]: 'completed',
  // Only ever reached via a refund resolution, which the composite pill below
  // catches first on the money axis. Kept honest for any caller reading
  // fulfilment alone.
  [OrderFulfillmentStatus.DISPUTED]: 'denied',
};

export function paymentPill(status: OrderPaymentStatus): OrderPill {
  return { state: PAYMENT_STATE[status], label: ORDER_PAYMENT_LABEL[status] };
}

export function fulfillmentPill(status: OrderFulfillmentStatus): OrderPill {
  return {
    state: FULFILLMENT_STATE[status],
    // DISPUTED is only ever written by a refund settlement, so name the outcome
    // rather than the argument that produced it.
    label:
      status === OrderFulfillmentStatus.DISPUTED
        ? 'Refunded'
        : ORDER_FULFILLMENT_LABEL[status],
  };
}

export interface OrderPillInput {
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  /**
   * True while an OPEN or IN_REVIEW mediation sits on this order. Not derivable
   * from the order itself — it lives on MediationRequest and is projected per
   * row by GET /api/orders.
   */
  hasOpenMediation?: boolean | undefined;
}

/**
 * The single pill that answers "where is this order?".
 *
 * Precedence mirrors `orderEscrowState`, so the pill and the escrow projection
 * can never disagree about the same order: settled money first and terminal,
 * then a finished delivery, then a live review, then progress.
 */
export function orderStatusPill(order: OrderPillInput): OrderPill {
  if (
    order.paymentStatus === OrderPaymentStatus.REFUNDED ||
    order.paymentStatus === OrderPaymentStatus.FAILED
  ) {
    return paymentPill(order.paymentStatus);
  }

  if (
    order.fulfillmentStatus === OrderFulfillmentStatus.COMPLETED ||
    order.fulfillmentStatus === OrderFulfillmentStatus.RECEIVED
  ) {
    return fulfillmentPill(order.fulfillmentStatus);
  }

  if (order.hasOpenMediation === true) {
    return { state: 'pending', label: 'Under review' };
  }

  return fulfillmentPill(order.fulfillmentStatus);
}
