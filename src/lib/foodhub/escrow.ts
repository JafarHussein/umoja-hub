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
