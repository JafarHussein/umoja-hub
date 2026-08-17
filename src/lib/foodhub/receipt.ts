import {
  PaymentEventActor,
  EscrowEventType,
  FULFILLMENT_STAGE_LABEL,
  FulfillmentStage,
  OrderPaymentStatus,
  PaymentEventType,
  Role,
  type EscrowState,
} from '@/types';

// ---------------------------------------------------------------------------
// Receipt + transaction-trail derivation.
//
// A receipt is not stored — like the escrow balance, it is always derived from
// the order plus the append-only PaymentEventLog / EscrowEventLog rows. That
// keeps a receipt incapable of drifting from the facts it attests to.
//
// The escrow reference is derived deterministically from the order reference
// (UMJ-2026-000123 → ESC-2026-000123) so it is stable across reads and needs no
// counter or schema field of its own.
//
// Wording follows Kenyan payment convention: "M-PESA" as the method, the
// 10-character receipt as the transaction reference, KSh amounts, and the
// order reference as the account reference — the same identifiers a Safaricom
// confirmation SMS would carry.
// ---------------------------------------------------------------------------

/** Turns UMJ-2026-000123 into ESC-2026-000123. Stable, derived, never stored. */
export function escrowReferenceFor(orderReferenceId: string): string {
  return orderReferenceId.replace(/^UMJ-/, 'ESC-');
}

export interface IReceiptParty {
  name: string;
  phone?: string | undefined;
}

export interface IPaymentReceipt {
  /** The M-Pesa receipt number. Null until the payment is confirmed. */
  receiptNumber: string | null;
  orderReferenceId: string;
  escrowReference: string;
  paymentMethod: 'M-PESA';
  /** Active payment provider — 'simulation' or a daraja-* variant. */
  provider: string;
  /** True when this receipt was produced by the payment simulator. */
  isSimulated: boolean;
  buyer: IReceiptParty;
  farmer: IReceiptParty;
  cropName: string;
  quantityOrdered: number;
  unit: string;
  pricePerUnit: number;
  totalAmountKES: number;
  fulfillmentType: string;
  paymentStatus: string;
  escrowState: EscrowState;
  paidAt: string | null;
  /** When this receipt view was generated. */
  issuedAt: string;
}

export interface IReceiptEventInput {
  eventType: string;
  occurredAt: Date | string;
  amount?: number | null | undefined;
  amountKES?: number | null | undefined;
  paymentReference?: string | null | undefined;
  resultCode?: number | null | undefined;
  actorRole?: string | null | undefined;
  note?: string | null | undefined;
  /** PaymentEventActor, where the row recorded one. Absent on rows written
   *  before the field existed — the trail falls back to inferring from kind. */
  actor?: string | null | undefined;
  /** The reason the writer recorded. Preferred over any derived detail: it is
   *  the explanation of the event given by the code that caused it. */
  reason?: string | null | undefined;
}

export interface IReceiptEvent {
  kind: 'PAYMENT' | 'ESCROW' | 'FULFILMENT';
  type: string;
  label: string;
  detail: string | null;
  /** Who caused the event, in words a non-technical reader understands. */
  actor: string;
  occurredAt: string;
  reference: string | null;
}

export const PAYMENT_LABEL: Record<string, string> = {
  [PaymentEventType.INITIATED]: 'Payment request sent',
  [PaymentEventType.CALLBACK_RECEIVED]: 'M-Pesa responded',
  [PaymentEventType.SUCCESS]: 'Payment received',
  [PaymentEventType.FAILED]: 'Payment failed',
  [PaymentEventType.TIMEOUT]: 'Payment request timed out',
  [PaymentEventType.DUPLICATE]: 'Duplicate confirmation ignored',
  [PaymentEventType.LOST]: 'No response from M-Pesa',
  [PaymentEventType.RECONCILED]: 'Payment reconciled',
  // Was missing, so the one event that says we do not know whether the buyer
  // was charged rendered on their receipt as the raw string "UNRESOLVED".
  [PaymentEventType.UNRESOLVED]: 'Payment could not be confirmed',
};

// Result codes Safaricom actually returns — surfaced so the trail explains
// *why* a payment failed rather than just that it did.
export const RESULT_CODE_DETAIL: Record<number, string> = {
  0: 'Processed successfully',
  1: 'Insufficient M-Pesa balance',
  1001: 'Another transaction is already in process on this line',
  1025: 'M-Pesa could not process the request',
  1032: 'Cancelled by the buyer on their handset',
  1037: 'Buyer could not be reached — the prompt expired',
};

// The farmer's ledger names three distinct states — held in escrow, cleared,
// available to withdraw — and is careful about the difference, because money
// that has cleared is the farmer's but is not yet in their hands. This trail
// used to call the same moment "funds released to the farmer", which reads as
// paid out. A farmer who saw that on a receipt and then found nothing on their
// handset would have been misled by us. The vocabulary is now the ledger's.
const ESCROW_LABEL: Record<string, string> = {
  [EscrowEventType.HELD]: 'Funds secured in escrow',
  [EscrowEventType.RELEASED]: 'Funds cleared for the farmer',
  [EscrowEventType.REFUND_ISSUED]: 'Funds refunded to the buyer',
};

const ESCROW_DETAIL: Record<string, string> = {
  [EscrowEventType.HELD]: 'UmojaHub is holding the payment until the buyer confirms receipt.',
  [EscrowEventType.RELEASED]:
    'Receipt confirmed — the funds have cleared and the farmer can now request a payout.',
  [EscrowEventType.REFUND_ISSUED]: 'The held funds were returned to the buyer.',
};

// PaymentEventActor, in the words a receipt should use. Kept separate from the
// escrow mapping below because they answer different questions: this one is who
// caused a payment event, that one is which party an escrow action was taken by.
const PAYMENT_ACTOR_LABEL: Record<string, string> = {
  [PaymentEventActor.BUYER]: 'Buyer',
  [PaymentEventActor.PROVIDER]: 'M-Pesa',
  [PaymentEventActor.SYSTEM]: 'UmojaHub',
  [PaymentEventActor.ADMIN]: 'UmojaHub administrator',
};

function actorFor(
  kind: IReceiptEvent['kind'],
  actorRole?: string | null,
  paymentActor?: string | null
): string {
  if (kind === 'PAYMENT') {
    // Every payment event used to be attributed to M-Pesa. That was never true
    // of all of them — the buyer opens the session and retries it, and
    // reconciliation closes it out on nobody's instruction — so a trail read
    // back to a panel or an auditor credited M-Pesa with our decisions and the
    // buyer's. The row now says who acted; only rows predating the field fall
    // back, and for those the old attribution is the best available guess.
    return (paymentActor && PAYMENT_ACTOR_LABEL[paymentActor]) ?? 'M-Pesa';
  }
  if (kind === 'FULFILMENT') return 'Farmer';
  switch (actorRole) {
    case Role.BUYER:
      return 'Buyer';
    case Role.FARMER:
      return 'Farmer';
    case Role.ADMIN:
      return 'UmojaHub administrator';
    default:
      return 'UmojaHub';
  }
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/**
 * Merge the payment and escrow logs into one chronological trail. Both stores
 * are append-only, so the trail is a faithful replay — nothing is inferred from
 * the order's current status.
 */
export interface IStageEventInput {
  stage: string;
  at: Date | string;
  note?: string | null | undefined;
}

export function buildTransactionTrail(
  paymentEvents: IReceiptEventInput[],
  escrowEvents: IReceiptEventInput[],
  stageEvents: IStageEventInput[] = []
): IReceiptEvent[] {
  const payment: IReceiptEvent[] = paymentEvents.map((e) => {
    const codeDetail =
      typeof e.resultCode === 'number' ? RESULT_CODE_DETAIL[e.resultCode] : undefined;
    return {
      kind: 'PAYMENT' as const,
      type: e.eventType,
      label: PAYMENT_LABEL[e.eventType] ?? e.eventType,
      // The recorded reason first: it was written by the code that caused the
      // event and says why, where a result code only says what. The code
      // gloss and the amount remain the fallback for rows written before the
      // field existed.
      detail:
        e.reason ??
        codeDetail ??
        (typeof e.amount === 'number' ? `KSh ${e.amount.toLocaleString()}` : null),
      actor: actorFor('PAYMENT', null, e.actor),
      occurredAt: toIso(e.occurredAt),
      reference: e.paymentReference ?? null,
    };
  });

  const escrow: IReceiptEvent[] = escrowEvents.map((e) => ({
    kind: 'ESCROW' as const,
    type: e.eventType,
    label: ESCROW_LABEL[e.eventType] ?? e.eventType,
    detail: e.note ?? ESCROW_DETAIL[e.eventType] ?? null,
    actor: actorFor('ESCROW', e.actorRole),
    occurredAt: toIso(e.occurredAt),
    reference: typeof e.amountKES === 'number' ? `KSh ${e.amountKES.toLocaleString()}` : null,
  }));

  // Fulfilment progress the farmer reported. It moves no money, but it is what
  // explains the gap between "paid" and "released" on the timeline.
  const fulfilment: IReceiptEvent[] = stageEvents.map((e) => ({
    kind: 'FULFILMENT' as const,
    type: e.stage,
    label: FULFILLMENT_STAGE_LABEL[e.stage as FulfillmentStage] ?? e.stage,
    detail: e.note ?? null,
    actor: actorFor('FULFILMENT'),
    occurredAt: toIso(e.at),
    reference: null,
  }));

  return [...payment, ...escrow, ...fulfilment].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );
}

export interface IReceiptOrderInput {
  orderReferenceId: string;
  mpesaTransactionId?: string | null | undefined;
  cropName: string;
  quantityOrdered: number;
  unit: string;
  pricePerUnit: number;
  totalAmountKES: number;
  fulfillmentType: string;
  paymentStatus: string;
  paidAt?: Date | string | null | undefined;
}

export function buildOrderReceipt(params: {
  order: IReceiptOrderInput;
  buyer: IReceiptParty;
  farmer: IReceiptParty;
  escrowState: EscrowState;
  provider: string;
  isSimulated: boolean;
}): IPaymentReceipt {
  const { order, buyer, farmer, escrowState, provider, isSimulated } = params;
  return {
    receiptNumber: order.mpesaTransactionId ?? null,
    orderReferenceId: order.orderReferenceId,
    escrowReference: escrowReferenceFor(order.orderReferenceId),
    paymentMethod: 'M-PESA',
    provider,
    isSimulated,
    buyer,
    farmer,
    cropName: order.cropName,
    quantityOrdered: order.quantityOrdered,
    unit: order.unit,
    pricePerUnit: order.pricePerUnit,
    totalAmountKES: order.totalAmountKES,
    fulfillmentType: order.fulfillmentType,
    paymentStatus: order.paymentStatus,
    escrowState,
    paidAt: order.paidAt ? toIso(order.paidAt) : null,
    issuedAt: new Date().toISOString(),
  };
}

/**
 * A receipt only means anything once money has actually moved. Callers use this
 * to 404 rather than render an empty document for an unpaid order.
 */
export function hasReceipt(paymentStatus: string): boolean {
  return (
    paymentStatus === OrderPaymentStatus.PAID || paymentStatus === OrderPaymentStatus.REFUNDED
  );
}
