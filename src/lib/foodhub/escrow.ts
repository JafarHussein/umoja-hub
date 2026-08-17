import mongoose from 'mongoose';
import {
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  MediationRequestStatus,
  WithdrawalRequestStatus,
} from '@/types';

// ---------------------------------------------------------------------------
// Escrow balance derivation — there is no stored wallet. A farmer's balance is
// always computed from the source-of-truth collections:
//   grossReceived = Σ totalAmountKES of their orders with paymentStatus PAID
//                   (the STK webhook is the only writer of PAID). This is the
//                   total the platform holds in custody on their behalf.
//   held          = Σ of PAID orders still IN_FULFILLMENT (buyer has not yet
//                   confirmed receipt) — received but NOT yet releasable.
//   inDispute     = Σ of PAID orders with an OPEN/IN_REVIEW mediation — a subset
//                   of held whose release is blocked pending admin resolution.
//   releasable    = Σ of orders the buyer has confirmed received (COMPLETED).
//                   This is the escrow condition: funds are released to the
//                   farmer's balance only on successful fulfilment, never merely
//                   on payment. grossReceived = held + releasable.
//   committed     = Σ amountKES of withdrawal requests REQUESTED|APPROVED|PAID
//                   (REJECTED frees the funds again).
//   available     = max(0, releasable − committed)
// Used by the payout-request API (BE-02) and the ledger view (BE-08).
// ---------------------------------------------------------------------------

export interface IEscrowBalance {
  /** Total received into platform custody (all PAID orders) = held + releasable. */
  grossReceivedKES: number;
  /** Paid but not yet confirmed received by the buyer — not releasable. */
  heldKES: number;
  /** Subset of held whose release is blocked by an open mediation. */
  inDisputeKES: number;
  /** Confirmed received (COMPLETED) — eligible to release to the farmer. */
  releasableKES: number;
  committedPayoutsKES: number;
  /** What the farmer may request a payout against right now. */
  availableKES: number;
}

const COMMITTED_STATUSES: string[] = [
  WithdrawalRequestStatus.REQUESTED,
  WithdrawalRequestStatus.APPROVED,
  WithdrawalRequestStatus.PAID,
];

export async function computeEscrowBalance(farmerId: string): Promise<IEscrowBalance> {
  const farmerObjectId = new mongoose.Types.ObjectId(farmerId);

  const [{ default: Order }, { default: WithdrawalRequest }, { default: MediationRequest }] =
    await Promise.all([
      import('@/lib/models/Order.model'),
      import('@/lib/models/WithdrawalRequest.model'),
      import('@/lib/models/MediationRequest.model'),
    ]);

  // Orders with a live escalation — their held funds are blocked from release.
  const disputedOrderIds = await MediationRequest.distinct('orderId', {
    farmerId: farmerObjectId,
    status: { $in: [MediationRequestStatus.OPEN, MediationRequestStatus.IN_REVIEW] },
  });

  const [grossAgg, heldAgg, releasableAgg, inDisputeAgg, payoutAgg] = await Promise.all([
    // Total in custody — every PAID order regardless of fulfilment.
    Order.aggregate<{ total: number }>([
      { $match: { farmerId: farmerObjectId, paymentStatus: OrderPaymentStatus.PAID } },
      { $group: { _id: null, total: { $sum: '$totalAmountKES' } } },
    ]),
    // Held — PAID and still in fulfilment (buyer has not confirmed receipt).
    Order.aggregate<{ total: number }>([
      {
        $match: {
          farmerId: farmerObjectId,
          paymentStatus: OrderPaymentStatus.PAID,
          fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmountKES' } } },
    ]),
    // Releasable — buyer confirmed receipt (COMPLETED). The escrow release gate.
    Order.aggregate<{ total: number }>([
      {
        $match: {
          farmerId: farmerObjectId,
          fulfillmentStatus: OrderFulfillmentStatus.COMPLETED,
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmountKES' } } },
    ]),
    // In dispute — held funds blocked by an open mediation.
    disputedOrderIds.length
      ? Order.aggregate<{ total: number }>([
          {
            $match: {
              _id: { $in: disputedOrderIds },
              paymentStatus: OrderPaymentStatus.PAID,
            },
          },
          { $group: { _id: null, total: { $sum: '$totalAmountKES' } } },
        ])
      : Promise.resolve([]),
    WithdrawalRequest.aggregate<{ total: number }>([
      { $match: { farmerId: farmerObjectId, status: { $in: COMMITTED_STATUSES } } },
      { $group: { _id: null, total: { $sum: '$amountKES' } } },
    ]),
  ]);

  const grossReceivedKES = grossAgg[0]?.total ?? 0;
  const heldKES = heldAgg[0]?.total ?? 0;
  const releasableKES = releasableAgg[0]?.total ?? 0;
  const inDisputeKES = inDisputeAgg[0]?.total ?? 0;
  const committedPayoutsKES = payoutAgg[0]?.total ?? 0;

  return {
    grossReceivedKES,
    heldKES,
    inDisputeKES,
    releasableKES,
    committedPayoutsKES,
    availableKES: Math.max(0, releasableKES - committedPayoutsKES),
  };
}

// ---------------------------------------------------------------------------
// The same question asked of the whole platform rather than one farmer.
//
// An operator running an escrow needs to be able to answer "how much of other
// people's money are we holding right now, and against how many orders?" —
// which is the first question an auditor asks and the number a float has to
// cover. It was derivable, one farmer at a time, and so in practice unanswerable.
//
// Deliberately the same definitions as computeEscrowBalance above, computed the
// same way from the same collections. A separate reading of "held" that drifted
// from the farmer-facing one would be worse than not having this at all.
// ---------------------------------------------------------------------------

export interface IPlatformEscrowPosition {
  /** Paid, not yet confirmed received — the platform's live custody obligation. */
  heldKES: number;
  heldOrders: number;
  /** Subset of held whose release is blocked by a live escalation. */
  underReviewKES: number;
  underReviewOrders: number;
  /** Confirmed received: the farmer's money, not yet requested or paid out. */
  clearedKES: number;
  clearedOrders: number;
}

export async function computePlatformEscrowPosition(): Promise<IPlatformEscrowPosition> {
  const [{ default: Order }, { default: MediationRequest }] = await Promise.all([
    import('@/lib/models/Order.model'),
    import('@/lib/models/MediationRequest.model'),
  ]);

  const disputedOrderIds = await MediationRequest.distinct('orderId', {
    status: { $in: [MediationRequestStatus.OPEN, MediationRequestStatus.IN_REVIEW] },
  });

  const sum = { _id: null, total: { $sum: '$totalAmountKES' }, count: { $sum: 1 } };

  const [heldAgg, releasableAgg, underReviewAgg] = await Promise.all([
    Order.aggregate<{ total: number; count: number }>([
      {
        $match: {
          paymentStatus: OrderPaymentStatus.PAID,
          fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
        },
      },
      { $group: sum },
    ]),
    Order.aggregate<{ total: number; count: number }>([
      { $match: { fulfillmentStatus: OrderFulfillmentStatus.COMPLETED } },
      { $group: sum },
    ]),
    disputedOrderIds.length
      ? Order.aggregate<{ total: number; count: number }>([
          { $match: { _id: { $in: disputedOrderIds }, paymentStatus: OrderPaymentStatus.PAID } },
          { $group: sum },
        ])
      : Promise.resolve([]),
  ]);

  return {
    heldKES: heldAgg[0]?.total ?? 0,
    heldOrders: heldAgg[0]?.count ?? 0,
    underReviewKES: underReviewAgg[0]?.total ?? 0,
    underReviewOrders: underReviewAgg[0]?.count ?? 0,
    clearedKES: releasableAgg[0]?.total ?? 0,
    clearedOrders: releasableAgg[0]?.count ?? 0,
  };
}
