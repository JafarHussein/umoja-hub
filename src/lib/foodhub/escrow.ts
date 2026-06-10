import mongoose from 'mongoose';
import { OrderPaymentStatus, WithdrawalRequestStatus } from '@/types';

// ---------------------------------------------------------------------------
// Escrow balance derivation — there is no stored wallet. A farmer's balance
// is always computed from the two source-of-truth collections:
//   gross    = Σ totalAmountKES of their orders with paymentStatus PAID
//              (the Daraja webhook is the only writer of PAID)
//   committed = Σ amountKES of their withdrawal requests that are REQUESTED,
//              APPROVED, or PAID (REJECTED frees the funds again)
//   available = max(0, gross − committed)
// Used by the payout-request API (BE-02) and the ledger view (BE-08).
// ---------------------------------------------------------------------------

export interface IEscrowBalance {
  grossReceivedKES: number;
  committedPayoutsKES: number;
  availableKES: number;
}

const COMMITTED_STATUSES: string[] = [
  WithdrawalRequestStatus.REQUESTED,
  WithdrawalRequestStatus.APPROVED,
  WithdrawalRequestStatus.PAID,
];

export async function computeEscrowBalance(farmerId: string): Promise<IEscrowBalance> {
  const farmerObjectId = new mongoose.Types.ObjectId(farmerId);

  const [{ default: Order }, { default: WithdrawalRequest }] = await Promise.all([
    import('@/lib/models/Order.model'),
    import('@/lib/models/WithdrawalRequest.model'),
  ]);

  const [orderAgg, payoutAgg] = await Promise.all([
    Order.aggregate<{ total: number }>([
      { $match: { farmerId: farmerObjectId, paymentStatus: OrderPaymentStatus.PAID } },
      { $group: { _id: null, total: { $sum: '$totalAmountKES' } } },
    ]),
    WithdrawalRequest.aggregate<{ total: number }>([
      { $match: { farmerId: farmerObjectId, status: { $in: COMMITTED_STATUSES } } },
      { $group: { _id: null, total: { $sum: '$amountKES' } } },
    ]),
  ]);

  const grossReceivedKES = orderAgg[0]?.total ?? 0;
  const committedPayoutsKES = payoutAgg[0]?.total ?? 0;

  return {
    grossReceivedKES,
    committedPayoutsKES,
    availableKES: Math.max(0, grossReceivedKES - committedPayoutsKES),
  };
}
