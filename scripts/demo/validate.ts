// Validation. Asserts the simulated ecosystem is internally consistent: every
// per-role population exists, there are no impossible states, derived escrow and
// trust reconcile with the underlying records, and analytics have populated.
// Read-only — it never writes. Exits non-zero if any check fails so it can gate.
//
// Every record check is scoped to the latest run's tracked manifest, so the
// simulator's output is validated in isolation from any pre-existing seed or
// genuine data sharing the database. (Analytics are global aggregates, so those
// two checks read the singleton/insight collections directly.)

import mongoose from 'mongoose';
import './registry';
import { log } from './db';
import {
  Role,
  UserStatus,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  EscrowEventType,
  FarmerTrustTier,
} from '../../src/types';

interface Check {
  name: string;
  pass: boolean;
  detail: string;
}

// The tier bands the real calculator assigns (assignTier in farmerTrustCalculator)
// — encoded here as the test oracle to confirm stored tiers match their score.
function expectedTier(score: number): FarmerTrustTier {
  if (score >= 80) return FarmerTrustTier.PREMIUM;
  if (score >= 60) return FarmerTrustTier.TRUSTED;
  if (score >= 40) return FarmerTrustTier.ESTABLISHED;
  return FarmerTrustTier.NEW;
}

export async function validate(): Promise<boolean> {
  const checks: Check[] = [];
  const ok = (name: string, pass: boolean, detail: string): void => {
    checks.push({ name, pass, detail });
  };

  const { default: SimulationRun } = await import('../../src/lib/models/SimulationRun.model');
  const { default: User } = await import('../../src/lib/models/User.model');
  const { default: Order } = await import('../../src/lib/models/Order.model');
  const { default: MarketplaceListing } = await import('../../src/lib/models/MarketplaceListing.model');
  const { default: Rating } = await import('../../src/lib/models/Rating.model');
  const { default: EscrowEventLog } = await import('../../src/lib/models/EscrowEventLog.model');
  const { default: FarmerTrustScore } = await import('../../src/lib/models/FarmerTrustScore.model');
  const { default: PlatformImpactSummary } = await import('../../src/lib/models/PlatformImpactSummary.model');
  const { default: MarketInsight } = await import('../../src/lib/models/MarketInsight.model');
  const { default: Notification } = await import('../../src/lib/models/Notification.model');
  const { default: KnowledgeArticle } = await import('../../src/lib/models/KnowledgeArticle.model');
  const { default: AdminAuditLog } = await import('../../src/lib/models/AdminAuditLog.model');
  const { default: SimulatedPayment } = await import('../../src/lib/models/SimulatedPayment.model');
  const { default: PaymentEventLog } = await import('../../src/lib/models/PaymentEventLog.model');
  const { computeEscrowBalance } = await import('../../src/lib/foodhub/escrow');

  // Scope everything to the latest run's manifest.
  const run = await SimulationRun.findOne().sort({ createdAt: -1 }).lean();
  if (!run) {
    log('no demo world found — nothing to validate. Run npm run demo first.');
    return false;
  }
  log(`validating run ${run.runId} (${run.entities.length} tracked documents)`);
  const idsOf = (collection: string): mongoose.Types.ObjectId[] =>
    run.entities.filter((e) => e.collection === collection).map((e) => e.id);
  const userIds = idsOf('User');
  const orderIds = idsOf('Order');
  const listingIds = idsOf('MarketplaceListing');
  const ratingIds = idsOf('Rating');
  const escrowIds = idsOf('EscrowEventLog');

  // ---- Per-role population ----
  for (const role of [Role.FARMER, Role.BUYER, Role.STUDENT, Role.LECTURER, Role.EMPLOYER, Role.NGO, Role.INSTITUTION]) {
    const count = await User.countDocuments({ _id: { $in: userIds }, role });
    ok(`role ${role} populated`, count > 0, `${count} users`);
  }

  // ---- No impossible states ----
  const badCompleted = await Order.countDocuments({
    _id: { $in: orderIds },
    fulfillmentStatus: OrderFulfillmentStatus.COMPLETED,
    $or: [{ paidAt: null }, { paidAt: { $exists: false } }, { receivedByBuyerAt: null }, { receivedByBuyerAt: { $exists: false } }],
  });
  ok('COMPLETED orders all have paidAt + receivedByBuyerAt', badCompleted === 0, `${badCompleted} violations`);

  const paidNoPaidAt = await Order.countDocuments({
    _id: { $in: orderIds },
    paymentStatus: OrderPaymentStatus.PAID,
    $or: [{ paidAt: null }, { paidAt: { $exists: false } }],
  });
  ok('PAID orders all have paidAt', paidNoPaidAt === 0, `${paidNoPaidAt} violations`);

  const negInventory = await MarketplaceListing.countDocuments({ _id: { $in: listingIds }, quantityAvailable: { $lt: 0 } });
  ok('no negative inventory', negInventory === 0, `${negInventory} listings < 0`);

  const ratedOrderIds = await Rating.distinct('orderId', { _id: { $in: ratingIds } });
  const ratingsOnNonCompleted = await Order.countDocuments({
    _id: { $in: ratedOrderIds },
    fulfillmentStatus: { $ne: OrderFulfillmentStatus.COMPLETED },
  });
  ok('ratings only on COMPLETED orders', ratingsOnNonCompleted === 0, `${ratingsOnNonCompleted} ratings on non-completed`);

  // Every RELEASED / REFUND_ISSUED escrow event must have a prior HELD for the order.
  const heldOrderIds = new Set(
    (await EscrowEventLog.distinct('orderId', { _id: { $in: escrowIds }, eventType: EscrowEventType.HELD })).map(String)
  );
  const releasedOrderIds = await EscrowEventLog.distinct('orderId', {
    _id: { $in: escrowIds },
    eventType: { $in: [EscrowEventType.RELEASED, EscrowEventType.REFUND_ISSUED] },
  });
  const releasedWithoutHeld = releasedOrderIds.filter((id) => !heldOrderIds.has(String(id)));
  ok('no escrow RELEASED/REFUNDED without HELD', releasedWithoutHeld.length === 0, `${releasedWithoutHeld.length} orphaned releases`);

  // ---- Derived-state reconciliation (sampled run farmers) ----
  const farmerIds = await User.find({ _id: { $in: userIds }, role: Role.FARMER }).distinct('_id');
  const trustScores = await FarmerTrustScore.find({ farmerId: { $in: farmerIds } }).limit(8).lean();
  let escrowReconciled = 0;
  let tierReconciled = 0;
  for (const ts of trustScores) {
    const balance = await computeEscrowBalance(String(ts.farmerId));
    const sums = balance.grossReceivedKES === balance.heldKES + balance.releasableKES;
    const nonNeg =
      balance.heldKES >= 0 && balance.releasableKES >= 0 && balance.availableKES >= 0 && balance.grossReceivedKES >= 0;
    if (sums && nonNeg) escrowReconciled++;
    if (expectedTier(ts.compositeScore) === ts.tier) tierReconciled++;
  }
  ok(
    'escrow reconciles (gross = held + releasable, all ≥ 0)',
    escrowReconciled === trustScores.length,
    `${escrowReconciled}/${trustScores.length} farmers`
  );
  ok('trust tier matches composite-score band', tierReconciled === trustScores.length, `${tierReconciled}/${trustScores.length} farmers`);

  // ---- Demo accounts can actually sign in ----
  // The single most demo-fatal failure mode: a beautiful world nobody can log
  // into. Check every canonical account exists, is ACTIVE, and has a password.
  const { DEMO_ACCOUNTS } = await import('./content/accounts');
  const loginable = await User.countDocuments({
    email: { $in: DEMO_ACCOUNTS.map((a) => a.email) },
    status: UserStatus.ACTIVE,
    hashedPassword: { $exists: true, $ne: null },
  });
  ok(
    'every demo account exists, is active and has a password',
    loginable === DEMO_ACCOUNTS.length,
    `${loginable}/${DEMO_ACCOUNTS.length} accounts`
  );

  const noPassword = await User.countDocuments({
    _id: { $in: userIds },
    role: { $ne: Role.ADMIN },
    $or: [{ hashedPassword: { $exists: false } }, { hashedPassword: null }],
  });
  ok('no generated user is left unable to sign in', noPassword === 0, `${noPassword} without a password`);

  // ---- Dashboards are not empty ----
  // "Nothing should feel empty" is a requirement, so it gets a check rather than
  // a hope. Each role's landing surface needs at least one record behind it.
  const listingCount = await MarketplaceListing.countDocuments({ _id: { $in: listingIds } });
  ok('marketplace has listings', listingCount >= 20, `${listingCount} listings`);

  const notificationCount = await Notification.countDocuments({ _id: { $in: idsOf('Notification') } });
  ok('notifications exist', notificationCount > 0, `${notificationCount} notifications`);

  const unreadCount = await Notification.countDocuments({
    _id: { $in: idsOf('Notification') },
    readAt: null,
  });
  ok('some notifications are unread', unreadCount > 0, `${unreadCount} unread`);

  const knowledgeCount = await KnowledgeArticle.countDocuments({ isPublished: true });
  ok('knowledge hub is published', knowledgeCount > 0, `${knowledgeCount} published articles`);

  const auditCount = await AdminAuditLog.countDocuments({ _id: { $in: idsOf('AdminAuditLog') } });
  ok('admin has an audit history', auditCount > 0, `${auditCount} audit entries`);

  // ---- Order lifecycle coverage ----
  // The brief asks for every stage to exist somewhere. Report which do.
  const presentStages: string[] = [];
  for (const stage of Object.values(OrderFulfillmentStatus)) {
    const n = await Order.countDocuments({ _id: { $in: orderIds }, fulfillmentStatus: stage });
    if (n > 0) presentStages.push(`${stage}(${n})`);
  }
  ok(
    'orders span multiple fulfilment stages',
    presentStages.length >= 3,
    presentStages.join(' ') || 'none'
  );

  const refundedCount = await Order.countDocuments({
    _id: { $in: orderIds },
    paymentStatus: OrderPaymentStatus.REFUNDED,
  });
  ok('at least one refunded order exists', refundedCount > 0, `${refundedCount} refunded`);

  // ---- Payment trail ----
  // Every paid order must have a receipt behind it, or the payment demo shows a
  // blank. This is the check that would have caught an invisible M-Pesa receipt.
  const paidOrderIds = (await Order.distinct('_id', {
    _id: { $in: orderIds },
    paymentStatus: { $in: [OrderPaymentStatus.PAID, OrderPaymentStatus.REFUNDED] },
  })) as mongoose.Types.ObjectId[];
  const withReceipt = await SimulatedPayment.countDocuments({
    orderId: { $in: paidOrderIds },
    mpesaReceiptNumber: { $exists: true, $ne: null },
  });
  ok(
    'every settled order has an M-Pesa receipt',
    withReceipt === paidOrderIds.length,
    `${withReceipt}/${paidOrderIds.length} orders`
  );

  const eventedOrders = await PaymentEventLog.distinct('orderId', { _id: { $in: idsOf('PaymentEventLog') } });
  ok(
    'every settled order has a payment event trail',
    paidOrderIds.every((id) => eventedOrders.some((e) => String(e) === String(id))),
    `${eventedOrders.length} orders with events`
  );

  // ---- No orphans ----
  // Every listing, order and engagement must point at a user that exists.
  const allUserIds = new Set((await User.find({}).distinct('_id')).map(String));
  const orphanListings = (await MarketplaceListing.find({ _id: { $in: listingIds } }).distinct('farmerId')).filter(
    (id) => !allUserIds.has(String(id))
  );
  ok('no listing references a missing farmer', orphanListings.length === 0, `${orphanListings.length} orphans`);

  const orphanOrderBuyers = (await Order.find({ _id: { $in: orderIds } }).distinct('buyerId')).filter(
    (id) => !allUserIds.has(String(id))
  );
  ok('no order references a missing buyer', orphanOrderBuyers.length === 0, `${orphanOrderBuyers.length} orphans`);

  // ---- No impossible timelines ----
  const futureOrders = await Order.countDocuments({ _id: { $in: orderIds }, createdAt: { $gt: new Date() } });
  ok('no order is dated in the future', futureOrders === 0, `${futureOrders} future-dated`);

  // Both fields must be present before the comparison means anything: in Mongo a
  // missing or null field sorts BELOW any date, so an unpaid order would look
  // like it was "paid before it was placed". Guard with $ifNull rather than a
  // bare $lt.
  const orderedBeforePlaced = await Order.countDocuments({
    _id: { $in: orderIds },
    paidAt: { $ne: null, $exists: true },
    $expr: { $lt: ['$paidAt', '$createdAt'] },
  });
  ok('no order was paid before it was placed', orderedBeforePlaced === 0, `${orderedBeforePlaced} violations`);

  const receivedBeforePaid = await Order.countDocuments({
    _id: { $in: orderIds },
    paidAt: { $ne: null, $exists: true },
    receivedByBuyerAt: { $ne: null, $exists: true },
    $expr: { $lt: ['$receivedByBuyerAt', '$paidAt'] },
  });
  ok('no order was received before it was paid', receivedBeforePaid === 0, `${receivedBeforePaid} violations`);

  // An order that reports itself received must actually have been paid.
  const receivedWithoutPayment = await Order.countDocuments({
    _id: { $in: orderIds },
    receivedByBuyerAt: { $ne: null, $exists: true },
    $or: [{ paidAt: null }, { paidAt: { $exists: false } }],
  });
  ok('no order was received without being paid', receivedWithoutPayment === 0, `${receivedWithoutPayment} violations`);

  // ---- Every listing has an image ----
  const imagelessListings = await MarketplaceListing.countDocuments({
    _id: { $in: listingIds },
    $or: [{ imageUrls: { $size: 0 } }, { imageUrls: { $exists: false } }],
  });
  ok('every listing has an image', imagelessListings === 0, `${imagelessListings} without images`);

  // ---- No placeholder text ----
  // A guard against exactly the thing the demo must never show a panel.
  const placeholder = /lorem ipsum|TODO|FIXME|John Doe|Jane Smith|test test|xxx+|placeholder/i;
  const sampleListings = await MarketplaceListing.find({ _id: { $in: listingIds } })
    .select('title description')
    .lean();
  const placeholderHits = sampleListings.filter(
    (l) => placeholder.test(l.title ?? '') || placeholder.test(l.description ?? '')
  );
  ok('no placeholder text in listings', placeholderHits.length === 0, `${placeholderHits.length} hits`);

  // ---- Analytics populated ----
  const impact = await PlatformImpactSummary.findOne().lean();
  ok(
    'PlatformImpactSummary populated',
    !!impact && (impact.food?.verifiedFarmerCount ?? 0) > 0 && (impact.food?.completedOrderCount ?? 0) > 0,
    impact ? `${impact.food?.verifiedFarmerCount} farmers, ${impact.food?.completedOrderCount} completed orders` : 'missing'
  );
  const insightCount = await MarketInsight.countDocuments();
  ok('MarketInsight populated', insightCount > 0, `${insightCount} crop-county insights`);

  // ---- Report ----
  log('validation results:');
  let failed = 0;
  for (const c of checks) {
    log(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name} — ${c.detail}`);
    if (!c.pass) failed++;
  }
  log(failed === 0 ? `all ${checks.length} checks passed.` : `${failed}/${checks.length} checks FAILED.`);
  return failed === 0;
}
