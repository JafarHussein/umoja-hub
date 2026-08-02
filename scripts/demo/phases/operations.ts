// Operations phase. Everything that makes the platform look *operated* rather
// than merely populated: the payment trail behind each paid order, the admin's
// audit history, the assistant conversations people have had, the price alerts
// farmers are watching, and the cooperative input orders they have grouped into.
//
// This phase derives from what the earlier phases created — it reads the run's
// own ledger rather than the whole database — so every record it writes is
// attached to a real order, a real farmer, a real engagement. Nothing here
// invents a counterparty.
//
// The shapes mirror what the live routes write, so an admin reading the audit
// trail or a buyer opening a receipt cannot tell these apart from real traffic.

import type { SimContext, World } from '../world';
import { createDoc } from '../helpers';
import { daysAgo, daysAfter, hoursAfter } from '../clock';
import { farmConversation, mentorConversation } from '../text';
import { CROPS } from '../dictionaries';
import {
  PaymentEventType,
  SimulatedOutcome,
  SimulatedPaymentStatus,
  PriceAlertNotificationMethod,
  GroupOrderStatus,
  OrderPaymentStatus,
  MediationRequestStatus,
  WithdrawalRequestStatus,
  VerificationStatus,
} from '../../../src/types';

const PROVIDER = 'simulation';

function clampPast(d: Date): Date {
  return new Date(Math.min(d.getTime(), Date.now() - 60_000));
}

export async function generateOperations(ctx: SimContext, world: World): Promise<void> {
  const { rng, ledger, batcher } = ctx;

  const { default: Order } = await import('../../../src/lib/models/Order.model');
  const { default: PaymentEventLog } = await import('../../../src/lib/models/PaymentEventLog.model');
  const { default: SimulatedPayment } = await import('../../../src/lib/models/SimulatedPayment.model');
  const { default: AdminAuditLog } = await import('../../../src/lib/models/AdminAuditLog.model');
  const { default: ChatSession } = await import('../../../src/lib/models/ChatSession.model');
  const { default: MentorSession } = await import('../../../src/lib/models/MentorSession.model');
  const { default: PriceAlert } = await import('../../../src/lib/models/PriceAlert.model');
  const { default: GroupOrder } = await import('../../../src/lib/models/GroupOrder.model');
  const { default: FarmerGroup } = await import('../../../src/lib/models/FarmerGroup.model');
  const { default: VerifiedSupplier } = await import('../../../src/lib/models/VerifiedSupplier.model');
  const { default: MediationRequest } = await import('../../../src/lib/models/MediationRequest.model');
  const { default: WithdrawalRequest } = await import('../../../src/lib/models/WithdrawalRequest.model');
  const { default: ProjectEngagement } = await import('../../../src/lib/models/ProjectEngagement.model');

  const admin = world.admin;
  if (!admin) throw new Error('operations: the world has no admin');

  // -------------------------------------------------------------------------
  // Payment trail — one per order that reached a payment attempt
  // -------------------------------------------------------------------------
  // Every order the commerce phase created carries an mpesaCheckoutRequestId,
  // which is the point at which the real flow starts writing payment events.
  // We reconstruct that flow: INITIATED on checkout, then either the successful
  // callback pair or the failure, at the timestamps the order already records.

  const orders = await Order.find({ _id: { $in: ledger.idsFor('Order') } })
    .select(
      '_id orderReferenceId buyerId farmerId totalAmountKES paymentStatus mpesaCheckoutRequestId mpesaTransactionId paidAt createdAt'
    )
    .lean();

  let merchantSeq = rng.int(10000, 90000);

  for (const order of orders) {
    if (!order.mpesaCheckoutRequestId) continue;
    merchantSeq++;

    const initiatedAt = clampPast(order.createdAt);
    const paid = order.paymentStatus === OrderPaymentStatus.PAID;
    const refunded = order.paymentStatus === OrderPaymentStatus.REFUNDED;
    const settledAt = clampPast(order.paidAt ?? hoursAfter(initiatedAt, rng.float(0.05, 0.6)));
    const succeeded = paid || refunded;

    // The STK push going out.
    batcher.add(PaymentEventLog, 'PaymentEventLog', {
        provider: PROVIDER,
        eventType: PaymentEventType.INITIATED,
        orderId: order._id,
        buyerId: order.buyerId,
        farmerId: order.farmerId,
        amount: order.totalAmountKES,
        paymentReference: order.orderReferenceId,
        checkoutRequestId: order.mpesaCheckoutRequestId,
        occurredAt: initiatedAt,
    });

    // The callback coming back.
    batcher.add(PaymentEventLog, 'PaymentEventLog', {
        provider: PROVIDER,
        eventType: PaymentEventType.CALLBACK_RECEIVED,
        orderId: order._id,
        buyerId: order.buyerId,
        farmerId: order.farmerId,
        amount: order.totalAmountKES,
        paymentReference: order.mpesaTransactionId ?? order.orderReferenceId,
        checkoutRequestId: order.mpesaCheckoutRequestId,
        resultCode: succeeded ? 0 : 1032,
        processingTimeMs: rng.int(180, 1400),
        occurredAt: settledAt,
    });

    // The outcome.
    const failureOutcome = rng.weighted<SimulatedOutcome>([
      [SimulatedOutcome.INSUFFICIENT_FUNDS, 4],
      [SimulatedOutcome.USER_CANCELLED, 3],
      [SimulatedOutcome.TIMEOUT, 2],
      [SimulatedOutcome.PHONE_UNREACHABLE, 1],
    ]);
    batcher.add(PaymentEventLog, 'PaymentEventLog', {
        provider: PROVIDER,
        eventType: succeeded ? PaymentEventType.SUCCESS : PaymentEventType.FAILED,
        orderId: order._id,
        buyerId: order.buyerId,
        farmerId: order.farmerId,
        amount: order.totalAmountKES,
        paymentReference: order.mpesaTransactionId ?? order.orderReferenceId,
        checkoutRequestId: order.mpesaCheckoutRequestId,
        resultCode: succeeded ? 0 : 1032,
        processingTimeMs: rng.int(180, 1400),
        occurredAt: settledAt,
    });

    // The simulator's own record — this is what backs the M-Pesa receipt the
    // buyer sees, so a successful order must carry a receipt number.
    batcher.add(SimulatedPayment, 'SimulatedPayment', {
        orderId: order._id,
        checkoutRequestId: order.mpesaCheckoutRequestId,
        merchantRequestId: `${merchantSeq}-${rng.int(1000000, 9999999)}-1`,
        outcome: succeeded ? SimulatedOutcome.SUCCESS : failureOutcome,
        resultCode: succeeded ? 0 : 1032,
        mpesaReceiptNumber: succeeded ? order.mpesaTransactionId : undefined,
        amount: order.totalAmountKES,
        buyerId: order.buyerId,
        farmerId: order.farmerId,
        deliverAt: settledAt,
        deliveredAt: settledAt,
        status: SimulatedPaymentStatus.DELIVERED,
        duplicate: false,
        deliveryAttempts: 1,
        processingTimeMs: rng.int(180, 1400),
        createdAt: initiatedAt,
        updatedAt: settledAt,
    });
  }

  // -------------------------------------------------------------------------
  // Admin audit trail
  // -------------------------------------------------------------------------
  // Reconstructed from the decisions that were actually taken in this world, so
  // every audit line points at a record the admin can open and check.

  const auditEntries: Array<{
    action: string;
    targetId: import('mongoose').Types.ObjectId;
    targetType: string;
    details: Record<string, unknown>;
    createdAt: Date;
  }> = [];

  const { default: User } = await import('../../../src/lib/models/User.model');

  // Farmer and buyer verification decisions.
  const runUserIds = ledger.idsFor('User');
  const verifiedFarmers = await User.find({
    _id: { $in: runUserIds },
    'farmerData.verificationStatus': VerificationStatus.APPROVED,
  })
    .select('_id createdAt county')
    .lean();
  for (const f of verifiedFarmers) {
    auditEntries.push({
      action: 'FARMER_APPROVED',
      targetId: f._id,
      targetType: 'User',
      details: { county: f.county, documentType: 'NATIONAL_ID' },
      createdAt: clampPast(daysAfter(f.createdAt, rng.int(1, 4))),
    });
  }

  const verifiedBuyers = await User.find({
    _id: { $in: runUserIds },
    'buyerData.verificationStatus': VerificationStatus.APPROVED,
  })
    .select('_id createdAt')
    .lean();
  for (const b of verifiedBuyers) {
    auditEntries.push({
      action: 'BUYER_APPROVED',
      targetId: b._id,
      targetType: 'User',
      details: { basis: 'Business registration verified' },
      createdAt: clampPast(daysAfter(b.createdAt, rng.int(1, 5))),
    });
  }

  for (const lecturer of world.lecturers) {
    auditEntries.push({
      action: 'LECTURER_VERIFIED',
      targetId: lecturer.id,
      targetType: 'User',
      details: { basis: 'Academic staff ID confirmed with the institution' },
      createdAt: clampPast(daysAfter(lecturer.joinedAt, rng.int(1, 6))),
    });
  }

  // Supplier verification.
  for (const supplierId of ledger.idsFor('VerifiedSupplier')) {
    auditEntries.push({
      action: 'SUPPLIER_VERIFIED',
      targetId: supplierId,
      targetType: 'VerifiedSupplier',
      details: { basis: 'KEBS and PCPB registrations checked' },
      createdAt: clampPast(daysAgo(rng.int(30, 200))),
    });
  }

  // Escrow settlement decisions the admin actually made (refunds after
  // mediation), and the mediation resolutions themselves.
  const resolvedMediations = await MediationRequest.find({
    _id: { $in: ledger.idsFor('MediationRequest') },
    status: MediationRequestStatus.RESOLVED,
  })
    .select('_id orderId resolvedAt')
    .lean();
  for (const m of resolvedMediations) {
    const at = clampPast(m.resolvedAt ?? daysAgo(rng.int(2, 40)));
    auditEntries.push({
      action: 'MEDIATION_RESOLVED',
      targetId: m._id,
      targetType: 'MediationRequest',
      details: { outcome: 'Refund issued to buyer' },
      createdAt: at,
    });
    auditEntries.push({
      action: 'ESCROW_REFUND_ISSUED',
      targetId: m.orderId,
      targetType: 'Order',
      details: { reason: 'Resolved in the buyer’s favour after mediation' },
      createdAt: at,
    });
  }

  // Payout decisions.
  const settledPayouts = await WithdrawalRequest.find({
    _id: { $in: ledger.idsFor('WithdrawalRequest') },
    status: { $in: [WithdrawalRequestStatus.APPROVED, WithdrawalRequestStatus.PAID, WithdrawalRequestStatus.REJECTED] },
  })
    .select('_id status amountKES resolvedAt')
    .lean();
  for (const w of settledPayouts) {
    auditEntries.push({
      action: w.status === WithdrawalRequestStatus.REJECTED ? 'PAYOUT_REJECTED' : 'PAYOUT_APPROVED',
      targetId: w._id,
      targetType: 'WithdrawalRequest',
      details: { amountKES: w.amountKES, status: w.status },
      createdAt: clampPast(w.resolvedAt ?? daysAgo(rng.int(1, 40))),
    });
  }

  if (auditEntries.length > 0) {
    ledger.trackMany(
      'AdminAuditLog',
      await AdminAuditLog.insertMany(auditEntries.map((e) => ({ ...e, adminId: admin.id })))
    );
  }

  // -------------------------------------------------------------------------
  // Farm Assistant history
  // -------------------------------------------------------------------------
  // Sessions carry a TTL index, so expiresAt must be in the future or Mongo will
  // reap them — the conversation is backdated, the expiry is not.

  const chatFarmers = rng.sample(world.farmers, Math.min(7, world.farmers.length));
  for (const farmer of chatFarmers) {
    const turns = farmConversation(rng);
    const startedAt = clampPast(daysAgo(rng.int(1, 40)));
    const messages = turns.map((t, i) => ({
      role: t.role,
      content: t.content,
      timestamp: new Date(startedAt.getTime() + i * rng.int(20, 90) * 1000),
    }));
    const lastActivityAt = messages[messages.length - 1]?.timestamp ?? startedAt;
    ledger.track(
      'ChatSession',
      await createDoc(ChatSession, {
        farmerId: farmer.id,
        messages,
        weatherContextUsed: rng.bool(0.4),
        lastActivityAt,
        expiresAt: daysAfter(new Date(), 30),
        createdAt: startedAt,
        updatedAt: lastActivityAt,
      })
    );
  }

  // -------------------------------------------------------------------------
  // AI Mentor history — attached to real engagements
  // -------------------------------------------------------------------------

  const engagements = await ProjectEngagement.find({ _id: { $in: ledger.idsFor('ProjectEngagement') } })
    .select('_id studentId createdAt')
    .lean();
  for (const engagement of rng.sample(engagements, Math.min(8, engagements.length))) {
    const turns = mentorConversation(rng);
    const startedAt = clampPast(daysAfter(engagement.createdAt, rng.int(1, 6)));
    const messages = turns.map((t, i) => ({
      role: t.role,
      content: t.content,
      timestamp: new Date(startedAt.getTime() + i * rng.int(30, 180) * 1000),
      autoLogged: true,
    }));
    const lastActivityAt = messages[messages.length - 1]?.timestamp ?? startedAt;
    ledger.track(
      'MentorSession',
      await createDoc(MentorSession, {
        studentId: engagement.studentId,
        engagementId: engagement._id,
        messages,
        lastActivityAt,
        expiresAt: daysAfter(new Date(), 30),
        createdAt: startedAt,
        updatedAt: lastActivityAt,
      })
    );
  }

  // -------------------------------------------------------------------------
  // Price alerts — farmers watching for a price worth selling at
  // -------------------------------------------------------------------------

  for (const farmer of rng.sample(world.farmers, Math.min(9, world.farmers.length))) {
    if (farmer.archetype === 'new') continue;
    const crop = rng.pick(CROPS);
    // A target a little above today's range — the price they are holding out for.
    const target = Math.round(crop.priceMax * rng.float(1.02, 1.18));
    const triggered = rng.bool(0.35);
    const createdAt = clampPast(daysAgo(rng.int(5, 120)));
    ledger.track(
      'PriceAlert',
      await createDoc(PriceAlert, {
        farmerId: farmer.id,
        cropName: crop.name,
        county: farmer.county,
        targetPricePerUnit: target,
        unit: crop.unit,
        notificationMethod: rng.weighted<string>([
          [PriceAlertNotificationMethod.SMS, 5],
          [PriceAlertNotificationMethod.BOTH, 3],
          [PriceAlertNotificationMethod.EMAIL, 2],
        ]),
        isActive: true,
        lastTriggeredAt: triggered ? clampPast(daysAgo(rng.int(1, 20))) : undefined,
        createdAt,
        updatedAt: createdAt,
      })
    );
  }

  // -------------------------------------------------------------------------
  // Cooperative input orders — the reason the cooperatives exist
  // -------------------------------------------------------------------------

  const groups = await FarmerGroup.find({ _id: { $in: ledger.idsFor('FarmerGroup') } })
    .select('_id createdBy members county')
    .lean();
  const suppliers = await VerifiedSupplier.find({ _id: { $in: ledger.idsFor('VerifiedSupplier') } })
    .select('_id')
    .lean();

  const INPUTS: Array<[string, number, number]> = [
    ['CAN Fertilizer (50kg)', 2, 7400],
    ['DAP Fertilizer (50kg)', 2, 8600],
    ['Certified Maize Seed (10kg)', 3, 4200],
    ['Knapsack Sprayer', 1, 3800],
  ];

  for (const group of groups) {
    if (suppliers.length === 0) break;
    const nOrders = rng.int(1, 2);
    for (let i = 0; i < nOrders; i++) {
      const [inputType, quantityPerMember, pricePerMember] = rng.pick(INPUTS);
      const proposedAt = clampPast(daysAgo(rng.int(3, 90)));
      const deadline = daysAfter(proposedAt, rng.int(7, 21));
      const closed = deadline.getTime() < Date.now();
      const memberIds = (group.members ?? []).slice(0, rng.int(2, Math.max(2, (group.members ?? []).length)));
      const minimumMembers = Math.max(2, Math.min(5, memberIds.length));

      // Participation and status have to agree: a fulfilled order needs enough
      // paid members to have met its own minimum.
      const status = closed
        ? rng.weighted<string>([
            [GroupOrderStatus.FULFILLED, 5],
            [GroupOrderStatus.CLOSED, 2],
            [GroupOrderStatus.CANCELLED, 1],
          ])
        : memberIds.length >= minimumMembers
          ? GroupOrderStatus.MINIMUM_MET
          : GroupOrderStatus.OPEN;
      const allPaid = status === GroupOrderStatus.FULFILLED;

      ledger.track(
        'GroupOrder',
        await createDoc(GroupOrder, {
          groupId: group._id,
          proposedBy: group.createdBy,
          supplierId: rng.pick(suppliers)._id,
          inputType,
          quantityPerMember,
          pricePerMember,
          joiningDeadline: deadline,
          minimumMembers,
          status,
          participatingMembers: memberIds.map((userId, idx) => {
            const hasPaid = allPaid || (status !== GroupOrderStatus.CANCELLED && idx % 2 === 0);
            const paidAt = hasPaid ? clampPast(daysAfter(proposedAt, rng.int(1, 6))) : undefined;
            return {
              userId,
              paymentStatus: hasPaid ? 'PAID' : 'PENDING',
              mpesaTransactionId: hasPaid ? `SIM${rng.int(1000000, 9999999)}` : undefined,
              paidAt,
            };
          }),
          createdAt: proposedAt,
          updatedAt: closed ? clampPast(deadline) : proposedAt,
        })
      );
    }
  }
}
