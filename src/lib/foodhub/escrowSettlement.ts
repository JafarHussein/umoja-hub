import { sendSMS } from '@/lib/integrations/smsService';
import { notify } from '@/lib/notifications/notify';
import { logger } from '@/lib/utils';
import {
  EscrowEventType,
  ListingStatus,
  MediationOutcome,
  NotificationType,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  Role,
} from '@/types';

// ---------------------------------------------------------------------------
// Escrow settlement — the single implementation of moving held funds.
//
// There are exactly two real outcomes for money the platform is holding:
// RELEASE it to the farmer, or REFUND it to the buyer. Both are administrative
// decisions over custodial funds, and both must land the same way regardless of
// where the decision was taken — resolving a dispute, or acting directly on the
// escrow ledger. This module is that shared landing.
//
// Invariants:
//   - The held guard (PAID + IN_FULFILLMENT) is applied atomically as part of
//     the state write, so two concurrent decisions cannot both settle an order.
//   - A refund returns the produce to the marketplace, mirroring the
//     failed-payment path in processCallback.
//   - Every settlement appends an EscrowEventLog row naming the acting admin.
//   - Notifications are best-effort and never block the settlement.
// ---------------------------------------------------------------------------

/** Where the decision was taken — changes only the wording sent to users. */
export type SettlementContext = 'MEDIATION' | 'ADMIN_DIRECT';

export type SettlementResult =
  | {
      applied: true;
      orderId: string;
      orderReferenceId: string;
      amountKES: number;
      outcome: MediationOutcome.RELEASE | MediationOutcome.REFUND;
    }
  | { applied: false; reason: 'NOT_HELD' };

export interface SettleEscrowParams {
  orderId: string;
  outcome: MediationOutcome.RELEASE | MediationOutcome.REFUND;
  /** Free-text rationale — stored on the escrow event and, for a refund, the order. */
  note?: string | undefined;
  adminId: string;
  context: SettlementContext;
  requestId?: string | undefined;
}

function preamble(context: SettlementContext): string {
  return context === 'MEDIATION' ? 'Following mediation, ' : 'Following a UmojaHub review, ';
}

export async function settleEscrow(params: SettleEscrowParams): Promise<SettlementResult> {
  const { orderId, outcome, note, adminId, context, requestId } = params;

  const [{ default: Order }, { default: EscrowEventLog }] = await Promise.all([
    import('@/lib/models/Order.model'),
    import('@/lib/models/EscrowEventLog.model'),
  ]);

  // Only funds actually in custody can be settled. Applying this as the filter
  // of the update (not a prior read) makes the transition compare-and-swap.
  const heldGuard = {
    _id: orderId,
    paymentStatus: OrderPaymentStatus.PAID,
    fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
  } as object;

  const update =
    outcome === MediationOutcome.REFUND
      ? {
          $set: {
            paymentStatus: OrderPaymentStatus.REFUNDED,
            fulfillmentStatus: OrderFulfillmentStatus.DISPUTED,
            disputeFlaggedAt: new Date(),
            ...(note !== undefined && { disputeReason: note }),
          },
        }
      : { $set: { fulfillmentStatus: OrderFulfillmentStatus.COMPLETED } };

  const order = await Order.findOneAndUpdate(heldGuard, update, { new: true }).lean();

  if (!order) {
    logger.warn('escrow', 'Settlement skipped — order not in a held state', {
      requestId,
      orderId,
      outcome,
    });
    return { applied: false, reason: 'NOT_HELD' };
  }

  const amount = order.totalAmountKES.toLocaleString();
  const ref = order.orderReferenceId;

  if (outcome === MediationOutcome.REFUND) {
    // Return the produce to the marketplace, mirroring the failed-payment path.
    const { default: MarketplaceListing } = await import('@/lib/models/MarketplaceListing.model');
    await MarketplaceListing.findByIdAndUpdate(order.listingId, {
      $inc: { quantityAvailable: order.quantityOrdered },
      listingStatus: ListingStatus.AVAILABLE,
    });
  }

  await EscrowEventLog.create({
    eventType:
      outcome === MediationOutcome.REFUND
        ? EscrowEventType.REFUND_ISSUED
        : EscrowEventType.RELEASED,
    orderId: order._id,
    buyerId: order.buyerId,
    farmerId: order.farmerId,
    amountKES: order.totalAmountKES,
    actorId: adminId,
    actorRole: Role.ADMIN,
    ...(note !== undefined && { note }),
    occurredAt: new Date(),
  });

  const beneficiaryId =
    outcome === MediationOutcome.REFUND ? String(order.buyerId) : String(order.farmerId);
  const beneficiarySms =
    outcome === MediationOutcome.REFUND
      ? `UmojaHub: ${preamble(context)}your KSh ${amount} for order ${ref} has been refunded from escrow.`
      : `UmojaHub: ${preamble(context)}KSh ${amount} for order ${ref} has been released from escrow and is available to request as a payout.`;

  // Best-effort SMS to whoever received the money.
  (async () => {
    const { default: User } = await import('@/lib/models/User.model');
    const user = await User.findById(beneficiaryId).select('phoneNumber').lean();
    if (user?.phoneNumber) await sendSMS(user.phoneNumber, beneficiarySms);
  })().catch(() => {});

  if (outcome === MediationOutcome.REFUND) {
    void notify({
      userId: String(order.buyerId),
      type: NotificationType.ESCROW_UPDATE,
      title: 'Funds refunded',
      body: `${preamble(context)}your KSh ${amount} for order ${ref} has been refunded from escrow.`,
      relatedEntity: { kind: 'Order', id: String(order._id) },
    });
    void notify({
      userId: String(order.farmerId),
      type: NotificationType.ORDER_UPDATE,
      title: 'Order closed — buyer refunded',
      body: `${preamble(context)}order ${ref} was closed, the buyer was refunded and the produce returned to the marketplace.`,
      relatedEntity: { kind: 'Order', id: String(order._id) },
    });
  } else {
    void notify({
      userId: String(order.farmerId),
      type: NotificationType.ESCROW_UPDATE,
      title: 'Funds released to you',
      body: `${preamble(context)}KSh ${amount} for order ${ref} has been released from escrow and is available to request as a payout.`,
      relatedEntity: { kind: 'Order', id: String(order._id) },
    });
    void notify({
      userId: String(order.buyerId),
      type: NotificationType.ORDER_UPDATE,
      title: 'Order closed',
      body: `${preamble(context)}order ${ref} was closed and the payment released to the farmer.`,
      relatedEntity: { kind: 'Order', id: String(order._id) },
    });
  }

  logger.info('escrow', 'Escrow settled', {
    requestId,
    orderId: String(order._id),
    outcome,
    context,
    amountKES: order.totalAmountKES,
    adminId,
  });

  return {
    applied: true,
    orderId: String(order._id),
    orderReferenceId: ref,
    amountKES: order.totalAmountKES,
    outcome,
  };
}
