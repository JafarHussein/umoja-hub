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
  const { computeEscrowBalance } = await import('../../src/lib/foodhub/escrow');

  // Scope everything to the latest run's manifest.
  const run = await SimulationRun.findOne().sort({ createdAt: -1 }).lean();
  if (!run) {
    log('no simulation run found — nothing to validate. Run seed:demo first.');
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
