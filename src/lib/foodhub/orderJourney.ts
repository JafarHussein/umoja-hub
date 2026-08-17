import { OrderFulfillmentStatus, OrderPaymentStatus } from '@/types';

// ---------------------------------------------------------------------------
// The order journey — one derivation, rendered three ways.
//
// The compact row, the detailed spine and the narrated payment session each
// worked out the stages of an order for themselves. They agreed on the shape
// and disagreed on everything else: the same moment was "Paid — held in escrow"
// in one and "Payment confirmed" in another, only one of them named the party
// an order was waiting on, and where a payment actually *was* — prompt sent,
// buyer not responding, outcome unknown — appeared solely on the screen the
// buyer watches while paying. A farmer chasing a stalled order, or an
// administrator reading one, saw "Awaiting M-Pesa confirmation" and nothing
// further, whatever had really happened.
//
// So the stages are derived here, once, and the renderers only draw. Every
// stage carries the five things a reader needs and no view may omit: what it
// is, when it happened, why it is where it is, who has to act, and whether it
// is done, current or still ahead.
//
// Pure — no DB, no React, no formatting. Timestamps stay ISO; each view
// formats to its own locale. Tested directly, which the two renderers'
// duplicated branches never were.
// ---------------------------------------------------------------------------

export type JourneyViewer = 'BUYER' | 'FARMER' | 'ADMIN';

export type JourneyStatus =
  /** Happened. */
  | 'DONE'
  /** Where the order is now — the stage someone is waiting on. */
  | 'CURRENT'
  /** Still ahead. */
  | 'UPCOMING'
  /** Reached, then stopped by something that needs deciding. */
  | 'BLOCKED';

export interface IJourneyStage {
  key: string;
  /** One vocabulary across every view. */
  label: string;
  /** Why this stage is where it is, addressed to the viewer. */
  explanation: string | null;
  /** Who the order is waiting on, or who acted. */
  actor: string;
  /** ISO instant, where one is known. */
  at: string | null;
  status: JourneyStatus;
  /** A branch off the happy path rather than a stage of it. */
  tone?: 'danger' | 'info';
}

export interface IOrderJourneyInput {
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt?: Date | string | null | undefined;
  paidAt?: Date | string | null | undefined;
  confirmedByFarmerAt?: Date | string | null | undefined;
  receivedByBuyerAt?: Date | string | null | undefined;
  /**
   * True while a mediation is OPEN or IN_REVIEW.
   *
   * Cannot be read off the order: `fulfillmentStatus === DISPUTED` is written
   * only when an administrator resolves a mediation *with a refund*, so it
   * records an outcome, not a review in progress. The live fact lives on
   * MediationRequest and the caller passes it.
   */
  hasOpenMediation?: boolean | undefined;
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** "You" where it applies, the party's role where it does not. */
function who(viewer: JourneyViewer | undefined, party: 'BUYER' | 'FARMER'): string {
  if (viewer === party) return 'You';
  return party === 'BUYER' ? 'The buyer' : 'The farmer';
}

/**
 * Where the payment itself has got to.
 *
 * The journey used to say only "Awaiting M-Pesa confirmation" for every state
 * that was not PAID, which put a payment the buyer had cancelled, one the
 * network had killed, and one whose outcome we genuinely do not know behind a
 * single sentence that implied all three were still in progress.
 */
function paymentExplanation(paymentStatus: string, viewer: JourneyViewer | undefined): string {
  const buyer = viewer === 'BUYER';
  switch (paymentStatus) {
    case OrderPaymentStatus.PAID:
      return 'Held by UmojaHub until the produce is confirmed received.';
    case OrderPaymentStatus.FAILED:
      return buyer
        ? 'The payment did not go through. Nothing left your account — you can try again from this order.'
        : 'The payment did not go through, so no money is being held for this order.';
    case OrderPaymentStatus.UNRESOLVED:
      // The one state where the platform must not claim to know.
      return buyer
        ? 'M-Pesa could not tell us whether you were charged. UmojaHub is checking by hand — please do not pay again yet.'
        : 'M-Pesa could not confirm whether the buyer was charged. UmojaHub is checking by hand.';
    case OrderPaymentStatus.REFUNDED:
      return 'The payment was made and has since been returned to the buyer.';
    default:
      return buyer
        ? 'Enter your M-Pesa PIN on the prompt sent to your phone.'
        : 'Waiting for the buyer to authorise the payment on their handset.';
  }
}

export function buildOrderJourney(
  order: IOrderJourneyInput,
  viewer?: JourneyViewer
): IJourneyStage[] {
  const underReview = order.hasOpenMediation === true;
  const isPaid = order.paymentStatus === OrderPaymentStatus.PAID;
  const isRefunded = order.paymentStatus === OrderPaymentStatus.REFUNDED;

  const isInFulfillment = (
    [
      OrderFulfillmentStatus.IN_FULFILLMENT,
      OrderFulfillmentStatus.RECEIVED,
      OrderFulfillmentStatus.COMPLETED,
    ] as string[]
  ).includes(order.fulfillmentStatus);

  const isReceived = (
    [OrderFulfillmentStatus.RECEIVED, OrderFulfillmentStatus.COMPLETED] as string[]
  ).includes(order.fulfillmentStatus);

  const isCompleted = order.fulfillmentStatus === OrderFulfillmentStatus.COMPLETED;

  const stages: IJourneyStage[] = [
    {
      key: 'placed',
      label: 'Order placed',
      explanation: null,
      actor: who(viewer, 'BUYER'),
      at: iso(order.createdAt),
      status: 'DONE',
    },
    {
      key: 'paid',
      label: 'Payment confirmed',
      explanation: paymentExplanation(order.paymentStatus, viewer),
      // Whoever the order is waiting on. Before payment that is the buyer, at
      // their handset; after it, UmojaHub, holding the money.
      actor: isPaid || isRefunded ? 'UmojaHub holds the funds' : who(viewer, 'BUYER'),
      at: iso(order.paidAt),
      status: isPaid || isRefunded ? 'DONE' : isFailedish(order.paymentStatus) ? 'BLOCKED' : 'CURRENT',
      ...(isFailedish(order.paymentStatus) ? { tone: 'danger' as const } : {}),
    },
    {
      key: 'dispatched',
      label: 'Farmer dispatched',
      explanation: order.confirmedByFarmerAt
        ? null
        : viewer === 'FARMER'
          ? 'Confirm dispatch as soon as you hand the produce to the carrier.'
          : 'Waiting for the farmer to confirm the produce is on its way.',
      actor: who(viewer, 'FARMER'),
      at: iso(order.confirmedByFarmerAt),
      status: isInFulfillment ? (isReceived ? 'DONE' : 'CURRENT') : 'UPCOMING',
    },
    {
      key: 'received',
      label: 'Buyer received',
      explanation: order.receivedByBuyerAt
        ? null
        : viewer === 'BUYER'
          ? 'Check the produce, then confirm receipt — that is what pays the farmer.'
          : 'Waiting for the buyer to confirm the produce reached them.',
      actor: who(viewer, 'BUYER'),
      at: iso(order.receivedByBuyerAt),
      status: isReceived ? (isCompleted ? 'DONE' : 'CURRENT') : 'UPCOMING',
    },
  ];

  // A review is a stage of this order, not a replacement for it. Both this and
  // the refund below once swapped the whole journey for a single banner — so at
  // the one moment someone most needs to see where their money is and what has
  // happened to it, the record vanished and left a sentence behind.
  if (underReview) {
    stages.push({
      key: 'review',
      label: 'Under review',
      explanation:
        'An administrator is reading both accounts. The money stays where it is until they decide.',
      actor: 'UmojaHub',
      at: null,
      status: 'BLOCKED',
      tone: 'danger',
    });
  }

  if (isRefunded) {
    stages.push({
      key: 'refunded',
      label: 'Payment refunded',
      explanation: 'Returned to the buyer from escrow following the review decision.',
      actor: 'UmojaHub',
      at: null,
      status: 'DONE',
      tone: 'info',
    });
  } else {
    stages.push({
      key: 'released',
      label: 'Payment released',
      explanation: isCompleted
        ? 'Released to the farmer. It has cleared, and they can now request a payout.'
        : underReview
          ? 'On hold until the review concludes.'
          : // Addressed to whoever is reading. This stage and "Buyer received"
            // describe the same act by the same person, and naming them two
            // different ways made one journey sound like two.
            viewer === 'BUYER'
            ? 'Held by UmojaHub until you confirm receipt.'
            : 'Held by UmojaHub until the buyer confirms receipt.',
      actor: 'UmojaHub',
      at: null,
      status: isCompleted ? 'DONE' : 'UPCOMING',
    });
  }

  return stages;
}

/** Payment states where the money stopped rather than progressed. */
function isFailedish(paymentStatus: string): boolean {
  return (
    paymentStatus === OrderPaymentStatus.FAILED ||
    paymentStatus === OrderPaymentStatus.UNRESOLVED
  );
}

/**
 * The one-line answer to "where is this order?" — the stage a reader would
 * point at. Used by list rows and notifications, which have space for a
 * sentence but not for the whole journey.
 */
export function currentJourneyStage(stages: IJourneyStage[]): IJourneyStage | null {
  return (
    stages.find((s) => s.status === 'BLOCKED') ??
    stages.find((s) => s.status === 'CURRENT') ??
    [...stages].reverse().find((s) => s.status === 'DONE') ??
    null
  );
}
