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
import { CROPS_BY_ID, type SeedCropId } from './dictionaries';
import { cropImageUrls } from './images';
import { resolveCrop } from '../../src/lib/taxonomy/crops';
import {
  Role,
  UserStatus,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  EscrowEventType,
  FarmerTrustTier,
  ProjectTrack,
  ProjectStatus,
  PeerReviewStatus,
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
  for (const role of [Role.FARMER, Role.BUYER, Role.STUDENT, Role.LECTURER, Role.INSTITUTION]) {
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

  // ---- Marketplace data is believable ----
  // A lecturer looking at this feed judges it on whether the photograph matches
  // the produce and the produce matches the place. These four checks encode that
  // judgement, because a run can otherwise stay green while showing a plate of
  // food under "Fresh Carrots" — which is exactly what it once did.
  const allListings = await MarketplaceListing.find({ _id: { $in: listingIds } })
    .select('cropName category imageUrls pickupCounty farmerId unit currentPricePerUnit')
    .lean();

  // Every image must come from the audited set — one verified photograph per
  // crop — rather than from any keyword-resolved host.
  const wrongImage = allListings.filter((l) => {
    const crop = resolveCrop(l.cropName ?? '');
    if (!crop || !(crop in CROPS_BY_ID)) return true;
    const audited = new Set(cropImageUrls(crop as SeedCropId));
    const urls = l.imageUrls ?? [];
    return urls.length === 0 || !urls.every((url) => audited.has(url));
  });
  ok(
    'every listing image is the audited photograph for its crop',
    wrongImage.length === 0,
    `${wrongImage.length} mismatched`
  );

  // Without a category the listing exists but cannot be browsed to.
  const uncategorised = allListings.filter((l) => !l.category);
  ok('every listing has a category', uncategorised.length === 0, `${uncategorised.length} uncategorised`);

  // A category tab that opens onto nothing reads as a broken marketplace, so
  // coverage of everything the catalogue can produce is asserted rather than
  // left to a weighted draw over sixteen farmers.
  const seededCategories = new Set(Object.values(CROPS_BY_ID).map((c) => c.category));
  const listedCategories = new Set(allListings.map((l) => String(l.category)));
  const emptyCategories = [...seededCategories].filter((c) => !listedCategories.has(String(c)));
  ok(
    'every category the catalogue sells has listings behind it',
    emptyCategories.length === 0,
    emptyCategories.length > 0 ? `empty: ${emptyCategories.join(', ')}` : `${listedCategories.size} categories`
  );

  // Produce has to come from somewhere that grows it.
  const wrongCounty = allListings.filter((l) => {
    const crop = resolveCrop(l.cropName ?? '');
    if (!crop || !(crop in CROPS_BY_ID)) return true;
    return !CROPS_BY_ID[crop as SeedCropId].grownIn.includes(l.pickupCounty ?? '');
  });
  ok(
    'every listing is grown in a county that grows it',
    wrongCounty.length === 0,
    `${wrongCounty.length} out of region`
  );

  // A farmer selling produce they never claimed to grow reads as generated.
  const farmersById = new Map(
    (await User.find({ _id: { $in: allListings.map((l) => l.farmerId) } })
      .select('farmerData.cropsGrown')
      .lean()
    ).map((u) => [String(u._id), (u.farmerData?.cropsGrown ?? []) as string[]])
  );
  const offProfile = allListings.filter((l) => {
    const grown = farmersById.get(String(l.farmerId)) ?? [];
    const crop = resolveCrop(l.cropName ?? '');
    return !grown.some((name) => resolveCrop(name) === crop);
  });
  ok(
    'every listing is a crop its farmer declares they grow',
    offProfile.length === 0,
    `${offProfile.length} off-profile`
  );

  // Prices are per the listing's own unit, so a crate price must not be checked
  // against a kilo band. Both bounds come from the seed catalogue.
  const offPrice = allListings.filter((l) => {
    const crop = resolveCrop(l.cropName ?? '');
    if (!crop || !(crop in CROPS_BY_ID)) return true;
    const c = CROPS_BY_ID[crop as SeedCropId];
    const price = l.currentPricePerUnit ?? 0;
    return l.unit !== c.unit || price < c.priceMin || price > c.priceMax;
  });
  ok(
    'every listing is priced in its trading unit, within the Kenyan market band',
    offPrice.length === 0,
    `${offPrice.length} out of band`
  );

  // ---- Education Hub ----
  // The brief is a Mixed column, so Mongoose validates nothing about it. It is
  // checked here against the one contract the app renders — the disagreement
  // between seeder and app is what crashed the student workspace on every
  // seeded project, silently, while every other check passed.
  const { default: ProjectEngagement } = await import('../../src/lib/models/ProjectEngagement.model');
  const { default: PeerReview } = await import('../../src/lib/models/PeerReview.model');
  const { default: LecturerReview } = await import('../../src/lib/models/LecturerReview.model');
  const { isValidBrief } = await import('../../src/lib/education/brief');

  const engagementIds = idsOf('ProjectEngagement');
  const engagements = await ProjectEngagement.find({ _id: { $in: engagementIds } })
    .select('track status brief peerReviewId studentId')
    .lean();
  const badBriefs = engagements.filter((e) => !isValidBrief(e.track as ProjectTrack, e.brief));
  ok(
    'every engagement brief matches the brief contract',
    badBriefs.length === 0,
    `${engagements.length - badBriefs.length}/${engagements.length} valid`
  );

  // A queue with nothing in it cannot be demonstrated, and the lecturer review
  // is the centrepiece of the Hub.
  const queued = engagements.filter((e) => e.status === ProjectStatus.UNDER_LECTURER_REVIEW);
  ok('the lecturer review queue has work in it', queued.length > 0, `${queued.length} awaiting review`);

  const queuedIds = queued.map((e) => e._id);
  const queuedWithPeer = queued.filter((e) => Boolean(e.peerReviewId)).length;
  ok(
    'every queued engagement has been through peer review',
    queuedWithPeer === queued.length,
    `${queuedWithPeer}/${queued.length}`
  );
  const submittedPeer = await PeerReview.countDocuments({
    engagementId: { $in: queuedIds },
    status: PeerReviewStatus.SUBMITTED,
  });
  ok(
    'the peer review on a queued engagement is submitted, not just assigned',
    submittedPeer === queued.length,
    `${submittedPeer}/${queued.length} submitted`
  );
  const prematureReviews = await LecturerReview.countDocuments({ engagementId: { $in: queuedIds } });
  ok(
    'nothing awaiting review has already been judged',
    prematureReviews === 0,
    `${prematureReviews} contradictions`
  );

  // Who belongs to which institution — the fact both remaining checks turn on,
  // now that a lecturer is scoped to their own students.
  const institutionOf = new Map<string, string>();
  for (const u of await User.find({ _id: { $in: userIds } })
    .select('role studentData.institutionId lecturerData.institutionId')
    .lean()) {
    const institutionId =
      u.role === Role.LECTURER ? u.lecturerData?.institutionId : u.studentData?.institutionId;
    if (institutionId) institutionOf.set(String(u._id), String(institutionId));
  }

  // "The queue has work in it" is no longer one fact but one per lecturer: a
  // verified lecturer whose own students have nothing pending opens an empty
  // screen, which is what a presenter would discover in front of the panel.
  const verifiedLecturers = await User.find({
    _id: { $in: userIds },
    role: Role.LECTURER,
    'lecturerData.isVerified': true,
  })
    .select('email lecturerData.institutionId')
    .lean();
  const queuedInstitutions = new Set(
    queued.map((e) => institutionOf.get(String(e.studentId))).filter(Boolean) as string[]
  );
  const lecturersWithEmptyQueue = verifiedLecturers.filter(
    (l) =>
      !l.lecturerData?.institutionId ||
      !queuedInstitutions.has(String(l.lecturerData.institutionId))
  );
  ok(
    'every verified lecturer has work waiting in their own queue',
    lecturersWithEmptyQueue.length === 0,
    lecturersWithEmptyQueue.length === 0
      ? `${verifiedLecturers.length} lecturers`
      : `empty for ${lecturersWithEmptyQueue.map((l) => l.email).join(', ')}`
  );

  // A lecturer may only review their own institution's students. Seeded data
  // that crosses institutions would be work the application itself would never
  // have put in front of that lecturer.
  const lecturerReviews = await LecturerReview.find({ _id: { $in: idsOf('LecturerReview') } })
    .select('engagementId lecturerId')
    .lean();
  const studentOfEngagement = new Map(
    (
      await ProjectEngagement.find({ _id: { $in: engagementIds } })
        .select('studentId')
        .lean()
    ).map((e) => [String(e._id), String(e.studentId)])
  );
  const crossInstitution = lecturerReviews.filter((r) => {
    const studentId = studentOfEngagement.get(String(r.engagementId));
    const studentInstitution = studentId ? institutionOf.get(studentId) : undefined;
    const lecturerInstitution = institutionOf.get(String(r.lecturerId));
    return !studentInstitution || !lecturerInstitution || studentInstitution !== lecturerInstitution;
  });
  ok(
    'every lecturer review was written by a lecturer at the student’s institution',
    crossInstitution.length === 0,
    `${lecturerReviews.length - crossInstitution.length}/${lecturerReviews.length} in institution`
  );

  // Nothing may display commit evidence: the platform has no GitHub API
  // integration, so any commit count on screen would have been invented here.
  const fabricatedCommits = await ProjectEngagement.countDocuments({
    _id: { $in: engagementIds },
    'githubSnapshot.commitCount': { $gt: 0 },
  } as object);
  ok(
    'no engagement claims commit evidence the platform cannot gather',
    fabricatedCommits === 0,
    `${fabricatedCommits} fabricated snapshots`
  );

  // ---- Academic context ----
  // The Hub's whole claim is that the work comes from what the student is
  // studying, so a seeded student with no coursework on record is a student the
  // product cannot serve — and would be discovered on the day, not before it.
  const { default: StudentEnrolment } = await import('../../src/lib/models/StudentEnrolment.model');
  const { default: AcademicProgramme } = await import('../../src/lib/models/AcademicProgramme.model');
  const { default: CurriculumUnit } = await import('../../src/lib/models/CurriculumUnit.model');
  const { toAcademicContext } = await import('../../src/lib/education/academicContext');
  const { AcademicProvenance } = await import('../../src/types');

  const seededStudentIds = (
    await User.find({ _id: { $in: userIds }, role: Role.STUDENT }).select('_id').lean()
  ).map((u) => u._id);
  const enrolments = await StudentEnrolment.find({
    studentId: { $in: seededStudentIds },
  } as object).lean();

  ok(
    'every student has recorded what they are studying',
    enrolments.length === seededStudentIds.length,
    `${enrolments.length}/${seededStudentIds.length} enrolled`
  );

  // Reads the enrolment exactly as the application does — a record the domain
  // layer refuses to interpret is a record no brief can be written from.
  const unreadable = enrolments.filter((e) => toAcademicContext(e) === null);
  ok(
    'every enrolment resolves to knowledge areas the Hub can reason with',
    unreadable.length === 0,
    `${enrolments.length - unreadable.length}/${enrolments.length} readable`
  );

  // Both rungs of the ladder must be present. If the demo world only ever shows
  // institution-published coursework, the path most Kenyan students will take
  // is the one nobody looks at.
  const declaredCount = enrolments.filter(
    (e) => e.provenance === AcademicProvenance.SELF_DECLARED
  ).length;
  const publishedCount = enrolments.length - declaredCount;
  ok(
    'both self-declared and institution-published coursework exist',
    declaredCount > 0 && publishedCount > 0,
    `${publishedCount} published, ${declaredCount} self-declared`
  );

  // An institution-published enrolment must actually cite the institution's own
  // units; otherwise the provenance label on screen is a claim, not a fact.
  const publishedUnitIds = new Set(
    (await CurriculumUnit.find({ _id: { $in: idsOf('CurriculumUnit') } }).select('_id').lean()).map(
      (u) => String(u._id)
    )
  );
  const unbacked = enrolments.filter(
    (e) =>
      e.provenance === AcademicProvenance.INSTITUTION_CURRICULUM &&
      !e.currentUnits.every((u) => u.unitId && publishedUnitIds.has(String(u.unitId)))
  );
  ok(
    'every institution-published enrolment cites real curriculum units',
    unbacked.length === 0,
    `${publishedCount - unbacked.length}/${publishedCount} backed`
  );

  // A brief with no coursework link is a brief the Hub cannot justify. The
  // contract now requires the anchor, so an engagement that lost it would fail
  // the brief-parse check above too — this names the reason directly.
  const anchorless = (
    await ProjectEngagement.find({ _id: { $in: engagementIds } })
      .select('brief.academicAnchor')
      .lean()
  ).filter((e) => {
    const anchor = (e.brief as { academicAnchor?: { units?: string[] } } | undefined)
      ?.academicAnchor;
    return !anchor?.units?.length;
  });
  ok(
    'every project records the coursework it was set against',
    anchorless.length === 0,
    `${engagementIds.length - anchorless.length}/${engagementIds.length} anchored`
  );

  const programmeCount = await AcademicProgramme.countDocuments({
    _id: { $in: idsOf('AcademicProgramme') },
  } as object);
  const unmappedUnits = await CurriculumUnit.countDocuments({
    _id: { $in: idsOf('CurriculumUnit') },
    knowledgeAreas: { $size: 0 },
  } as object);
  ok(
    'the published curriculum maps every unit onto the taxonomy',
    programmeCount > 0 && unmappedUnits === 0,
    `${programmeCount} programmes, ${publishedUnitIds.size} units, ${unmappedUnits} unmapped`
  );

// ---- Work a lecturer set ----
  // The Hub's second way in. A generated brief is the platform's guess at what
  // a student should build; a lecturer's project is the judgement of the person
  // who teaches them, and none of it was checked before.
  const { default: ProjectAssignment } = await import('../../src/lib/models/ProjectAssignment.model');
  const { isEligible } = await import('../../src/lib/education/assignment');
  const { AssignmentAudience, AssignmentStatus } = await import('../../src/types');

  const assignments = await ProjectAssignment.find({
    _id: { $in: idsOf('ProjectAssignment') },
  } as object).lean();

  const lecturersWithNoProjects = verifiedLecturers.filter(
    (l) => !assignments.some((a) => String(a.lecturerId) === String(l._id))
  );
  ok(
    'every verified lecturer has projects of their own on file',
    lecturersWithNoProjects.length === 0,
    lecturersWithNoProjects.length === 0
      ? `${assignments.length} projects across ${verifiedLecturers.length} lecturers`
      : `none set by ${lecturersWithNoProjects.map((l) => l.email).join(', ')}`
  );

  // An offer aimed at a semester none of that lecturer's students are in is an
  // offer nobody can accept — the shape the seeder had before, where a single
  // project was dealt per lecturer and matched roughly one student in eight.
  const takenUp = engagements.filter((e) => e.track === ProjectTrack.LECTURER_ASSIGNED);
  ok(
    'students have taken up work their lecturers set',
    takenUp.length > 0,
    `${takenUp.length} of ${engagements.length} projects were set by a lecturer`
  );

  // A lecturer's words reach the student unaltered. No model may rewrite them,
  // so the brief on the engagement must still be the project as written.
  const assignmentById = new Map(assignments.map((a) => [String(a._id), a]));
  const rewritten = takenUp.filter((e) => {
    const brief = e.brief as
      | { assignmentId?: string; problemStatement?: string; coreRequirements?: string[] }
      | undefined;
    const source = brief?.assignmentId ? assignmentById.get(String(brief.assignmentId)) : undefined;
    return (
      !source ||
      source.problemStatement !== brief?.problemStatement ||
      source.coreRequirements.join('\u0000') !== (brief?.coreRequirements ?? []).join('\u0000')
    );
  });
  ok(
    'every lecturer-set brief still reads exactly as the lecturer wrote it',
    rewritten.length === 0,
    `${takenUp.length - rewritten.length}/${takenUp.length} unaltered`
  );

  // A project can only be offered where its author teaches.
  const lecturerInstitution = new Map(
    verifiedLecturers.map((l) => [String(l._id), String(l.lecturerData?.institutionId ?? '')])
  );
  const misfiled = assignments.filter(
    (a) => lecturerInstitution.get(String(a.lecturerId)) !== String(a.institutionId)
  );
  ok(
    'every project is offered at the institution of the lecturer who set it',
    misfiled.length === 0,
    `${assignments.length - misfiled.length}/${assignments.length} correctly filed`
  );

  // The strongest rule the feature makes: naming a student overrules every
  // cohort filter, and a named project is invisible to everybody else. Checked
  // by running the application's own eligibility rule over every seeded
  // student, which is the only way to know the two halves both hold.
  const named = assignments.filter((a) => a.audience === AssignmentAudience.NAMED);
  const contextByStudent = new Map(
    enrolments.map((e) => [String(e.studentId), toAcademicContext(e)])
  );
  const namedFaults = named.filter((a) => {
    const record = a as unknown as Parameters<typeof isEligible>[0];
    const invited = (a.assignedStudentIds ?? []).map(String);
    return seededStudentIds.some((id) => {
      const studentId = String(id);
      const eligible = isEligible(record, {
        studentId,
        institutionId: institutionOf.get(studentId),
        academic: contextByStudent.get(studentId) ?? null,
      });
      // Eligible exactly when named: no wider, no narrower.
      return eligible !== invited.includes(studentId);
    });
  });
  ok(
    'a named project reaches its student and nobody else',
    named.length > 0 && namedFaults.length === 0,
    named.length === 0
      ? 'no named project exists to prove the rule with'
      : `${named.length - namedFaults.length}/${named.length} correctly scoped`
  );

  // An offer still open that nobody can see is dead weight on the student's
  // screen; every open project must reach at least one student.
  const unreachable = assignments
    .filter((a) => a.status === AssignmentStatus.OPEN)
    .filter((a) => {
      const record = a as unknown as Parameters<typeof isEligible>[0];
      return !seededStudentIds.some((id) =>
        isEligible(record, {
          studentId: String(id),
          institutionId: institutionOf.get(String(id)),
          academic: contextByStudent.get(String(id)) ?? null,
        })
      );
    });
  ok(
    'every open project reaches at least one student it was written for',
    unreachable.length === 0,
    unreachable.length === 0
      ? `${assignments.length} projects`
      : `${unreachable.length} offered to nobody: ${unreachable.map((a) => a.title).join('; ')}`
  );

  // Take-up per project, not merely somewhere in the world. A guarantee that
  // only said "some lecturer-set work has been taken up" was satisfied while
  // every single take-up sat on generated lecturers and Dr Ndung'u — the
  // account a presentation actually signs into — showed four projects with
  // nobody on any of them. Named projects are excluded: they are left open and
  // untaken on purpose, so a student can be shown accepting one live.
  const takenByAssignment = new Map<string, number>();
  for (const e of takenUp) {
    const id = (e.brief as { assignmentId?: string } | undefined)?.assignmentId;
    if (id) takenByAssignment.set(String(id), (takenByAssignment.get(String(id)) ?? 0) + 1);
  }
  const cohortOffers = assignments.filter((a) => a.audience === AssignmentAudience.COHORT);
  const unaccepted = cohortOffers.filter((a) => !takenByAssignment.get(String(a._id)));
  ok(
    'every project a lecturer set for their cohort has a student working on it',
    unaccepted.length === 0,
    unaccepted.length === 0
      ? `${cohortOffers.length} cohort offers, all accepted`
      : `${unaccepted.length} with nobody on them: ${unaccepted.map((a) => a.title).join('; ')}`
  );

  // The same project offered twice at one university, by two different
  // lecturers, is one project a student sees on their list twice.
  const seen = new Set<string>();
  const duplicated = cohortOffers.filter((a) => {
    const key = `${String(a.institutionId)}::${a.title}`;
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
  ok(
    'no institution offers the same project twice',
    duplicated.length === 0,
    `${duplicated.length} duplicates`
  );

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
