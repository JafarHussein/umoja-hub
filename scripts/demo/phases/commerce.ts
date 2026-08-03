// Marketplace + escrow + trust generator. For each verified farmer it creates
// listings and a backdated stream of orders across the full lifecycle, mirroring
// exactly what the real routes write (paidAt/confirmed/received, EscrowEventLog
// HELD/RELEASED/REFUND_ISSUED, PriceHistory, inventory consumption), then derives
// the farmer's trust score with the REAL recalculate(). Escrow balances and the
// admin ledger emerge from this data — nothing is hand-set.

import type { SimContext, World, PersonRef } from '../world';
import { createDoc, pushNotification } from '../helpers';
import { between, daysAgo, daysAfter, hoursAfter } from '../clock';
import {
  CROPS,
  CROPS_BY_ID,
  adjectivesFor,
  hooksFor,
  cropsGrownIn,
  type SeedCrop,
} from '../dictionaries';
import { listingDescription, pickupDescription } from '../text';
import { cropImageUrl } from '../images';
import { priceSeries } from '../priceSeries';
import { recalculate } from '../../../src/lib/trust/farmerTrustCalculator';
import {
  ListingUnit,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  FulfillmentType,
  ListingStatus,
  BuyerContactPreference,
  EscrowEventType,
  PriceHistorySource,
  WithdrawalRequestStatus,
  MediationRequestStatus,
  MediationCategory,
  NotificationType,
  Role,
} from '../../../src/types';

interface ActivityProfile {
  listings: [number, number];
  orders: [number, number];
  onTimeP: number;
  ratingP: number;
}

function activityFor(archetype: string): ActivityProfile {
  switch (archetype) {
    case 'commercial': return { listings: [3, 4], orders: [4, 7], onTimeP: 0.85, ratingP: 0.8 };
    case 'veteran': return { listings: [2, 3], orders: [4, 6], onTimeP: 0.9, ratingP: 0.85 };
    case 'cooperative': return { listings: [2, 3], orders: [3, 5], onTimeP: 0.8, ratingP: 0.75 };
    case 'seasonal': return { listings: [1, 2], orders: [2, 4], onTimeP: 0.7, ratingP: 0.7 };
    default: return { listings: [1, 2], orders: [1, 3], onTimeP: 0.7, ratingP: 0.65 };
  }
}

// Relative likelihood a buyer places any given order. Resellers and restaurants
// buy constantly (the platform's regulars / power buyers); individuals rarely.
// Weighting order assignment this way makes a few buyers dominate the order book
// and leaves some individuals with no orders at all — i.e. browse-leaning buyers
// — which is how a real marketplace's demand actually distributes.
function buyerWeight(archetype: string): number {
  switch (archetype) {
    case 'reseller': return 5;
    case 'restaurant': return 4;
    case 'ngo-procurement': return 2;
    default: return 1; // individual — browse-leaning, occasional
  }
}

// Listings tell a story rather than naming a crop. Both the adjective and the
// hook are drawn from what the crop can honestly claim, so a crate crop
// advertises crates, milk advertises the morning round, and neither is ever
// described as hand-picked.
function listingTitle(rng: SimContext['rng'], crop: SeedCrop): string {
  return `${rng.pick(adjectivesFor(crop))} ${crop.name} — ${rng.pick(hooksFor(crop))}`;
}

/**
 * The crops this farmer posts, in order, cycling if they list more times than
 * they have crops. Drawn from the produce they declared on their profile so the
 * marketplace never contradicts the farm — and falling back to their county's
 * produce for any farmer the world built without a crop list.
 */
function cropsFor(farmer: PersonRef): SeedCrop[] {
  const own = (farmer.crops ?? []).map((id) => CROPS_BY_ID[id]);
  if (own.length > 0) return own;
  const local = cropsGrownIn(farmer.county);
  return local.length > 0 ? local : CROPS;
}

// How much of a crop one buyer takes at a time, by trading unit. A restaurant
// buys kale by the sack of kilos and tomatoes by the crate; ordering "3" of
// each — as a single range across all units did — makes a KES 150 tomato order
// sit beside a KES 12,000 one for no reason a buyer would recognise.
const ORDER_SIZE: Readonly<Record<ListingUnit, [number, number]>> = {
  [ListingUnit.KG]: [20, 150],
  [ListingUnit.BAG]: [2, 20],
  [ListingUnit.CRATE]: [2, 15],
  [ListingUnit.PIECE]: [50, 400],
  [ListingUnit.LITRE]: [20, 150],
};

function orderQuantity(rng: SimContext['rng'], crop: SeedCrop, available: number): number {
  const [min, max] = ORDER_SIZE[crop.unit];
  return Math.max(1, rng.int(Math.min(min, available), Math.min(max, available)));
}

// View counts that reflect standing, not noise: established farmers draw more
// eyes, and recently-listed produce trends. Order interest adds to this later so
// the "popular"/"trending" feel is consistent with actual activity.
function baseViewsFor(rng: SimContext['rng'], archetype: string, listedAt: Date): number {
  const byArchetype: Record<string, number> = {
    commercial: 130, veteran: 110, cooperative: 80, seasonal: 55,
  };
  const ageDays = (Date.now() - listedAt.getTime()) / 86_400_000;
  const trending = ageDays < 14 ? rng.int(40, 130) : ageDays < 45 ? rng.int(10, 40) : 0;
  return Math.max(5, (byArchetype[archetype] ?? 35) + rng.int(-15, 35) + trending);
}

function clampPast(d: Date): Date {
  return new Date(Math.min(d.getTime(), Date.now() - 60_000));
}

function laterOf(a: Date, b: Date): Date {
  return a.getTime() > b.getTime() ? a : b;
}

export async function generateCommerce(ctx: SimContext, world: World): Promise<void> {
  const { rng, ledger, batcher } = ctx;
  const year = new Date().getFullYear();

  const { default: MarketplaceListing } = await import('../../../src/lib/models/MarketplaceListing.model');
  const { default: Order } = await import('../../../src/lib/models/Order.model');
  const { default: EscrowEventLog } = await import('../../../src/lib/models/EscrowEventLog.model');
  const { default: PriceHistory } = await import('../../../src/lib/models/PriceHistory.model');
  const { default: Rating } = await import('../../../src/lib/models/Rating.model');
  const { default: WithdrawalRequest } = await import('../../../src/lib/models/WithdrawalRequest.model');
  const { default: MediationRequest } = await import('../../../src/lib/models/MediationRequest.model');
  const { default: FarmerTrustScore } = await import('../../../src/lib/models/FarmerTrustScore.model');

  let seq = rng.int(1000, 5000);
  let mpesa = rng.int(100000, 900000);
  const admin = world.admin;

  // Demand is uneven: weight buyers so regulars dominate the order book.
  const buyerPool: Array<[PersonRef, number]> = world.buyers.map((b) => [b, buyerWeight(b.archetype)]);

  for (const farmer of world.farmers) {
    if (farmer.archetype === 'new') continue; // unverified — cannot list legitimately
    const profile = activityFor(farmer.archetype);
    let releasable = 0;

    const nListings = rng.int(profile.listings[0], profile.listings[1]);
    const farmerCrops = cropsFor(farmer);
    // Rotated by listing index rather than re-rolled, so a farmer posting the
    // same crop twice shows two different photographs of it instead of the same
    // picture twice down the feed.
    const imageRotation = rng.int(0, 9999);
    for (let li = 0; li < nListings; li++) {
      // Their headline crop first, then the rest — a farmer's own produce, in
      // the order they would lead with, never a random draw from the catalogue.
      const crop = farmerCrops[li % farmerCrops.length] as SeedCrop;
      const price = rng.int(crop.priceMin, crop.priceMax);
      const initialQty = rng.int(crop.qtyMin, crop.qtyMax);
      const listedAt = clampPast(between(rng, farmer.joinedAt, daysAgo(3)));
      const description = listingDescription(rng, crop, farmer.county);
      const baseViews = baseViewsFor(rng, farmer.archetype, listedAt);
      // Established farmers post verified listings far more often than newcomers.
      const verifiedListing = rng.bool(
        farmer.archetype === 'commercial' || farmer.archetype === 'veteran' ? 0.8 : 0.4
      );

      const listing = ledger.track(
        'MarketplaceListing',
        await createDoc(MarketplaceListing, {
          farmerId: farmer.id,
          title: listingTitle(rng, crop),
          cropName: crop.name,
          // Set from the crop's registry category, never guessed. Listings
          // seeded without one were invisible to the feed's category browse and
          // to every category filter.
          category: crop.category,
          description,
          quantityAvailable: initialQty,
          unit: crop.unit,
          currentPricePerUnit: price,
          pickupCounty: farmer.county,
          pickupDescription: pickupDescription(rng, farmer.county),
          imageUrls: [cropImageUrl(crop.id, imageRotation + li)],
          listingStatus: ListingStatus.AVAILABLE,
          isVerifiedListing: verifiedListing,
          buyerContactPreference: rng.bool(0.6)
            ? [BuyerContactPreference.PHONE, BuyerContactPreference.PLATFORM_MESSAGE]
            : [BuyerContactPreference.PHONE],
          viewCount: baseViews,
          createdAt: listedAt,
          updatedAt: listedAt,
        })
      );
      // Order interest adds views on top of the standing-based base so the
      // "popular" feel stays consistent with the listing's actual demand.
      let orderViews = 0;

      batcher.add(PriceHistory, 'PriceHistory', {
        cropName: crop.name,
        county: farmer.county,
        pricePerUnit: price,
        unit: crop.unit,
        source: PriceHistorySource.LISTING_CREATED,
        farmerId: farmer.id,
        recordedAt: listedAt,
      });

      let consumed = 0;
      const nOrders = rng.int(profile.orders[0], profile.orders[1]);
      for (let oi = 0; oi < nOrders; oi++) {
        const buyer: PersonRef = rng.weighted(buyerPool);
        orderViews += rng.int(2, 8);
        const qty = orderQuantity(rng, crop, initialQty);
        const total = qty * price;
        const orderedAt = clampPast(between(rng, laterOf(listedAt, buyer.joinedAt), daysAgo(1)));
        const outcome = rng.weighted<string>([
          ['completed', 65], ['held', 15], ['dispute', 8], ['failed', 12],
        ]);
        seq++; mpesa++;
        const ref = `UMJ-${year}-${String(seq).padStart(6, '0')}`;
        const checkout = `ws_CO_${mpesa}`;

        if (outcome === 'failed') {
          ledger.track(
            'Order',
            await createDoc(Order, {
              orderReferenceId: ref, listingId: listing._id, farmerId: farmer.id, buyerId: buyer.id,
              cropName: crop.name, quantityOrdered: qty, unit: crop.unit, pricePerUnit: price,
              totalAmountKES: total, fulfillmentType: rng.pick([FulfillmentType.PICKUP, FulfillmentType.DELIVERY]),
              paymentStatus: OrderPaymentStatus.FAILED, fulfillmentStatus: OrderFulfillmentStatus.AWAITING_PAYMENT,
              buyerPhone: buyer.phone, mpesaCheckoutRequestId: checkout,
              createdAt: orderedAt, updatedAt: clampPast(hoursAfter(orderedAt, 1)),
            })
          );
          continue; // inventory restored — nothing consumed
        }

        const paidAt = clampPast(hoursAfter(orderedAt, rng.float(0.05, 0.6)));
        const txn = `SIM${mpesa}${rng.int(100, 999)}`;

        if (outcome === 'completed') {
          const onTime = rng.bool(profile.onTimeP);
          const confirmedAt = clampPast(hoursAfter(paidAt, onTime ? rng.int(1, 20) : rng.int(28, 80)));
          const receivedAt = clampPast(daysAfter(confirmedAt, rng.int(1, 4)));
          const order = ledger.track(
            'Order',
            await createDoc(Order, {
              orderReferenceId: ref, listingId: listing._id, farmerId: farmer.id, buyerId: buyer.id,
              cropName: crop.name, quantityOrdered: qty, unit: crop.unit, pricePerUnit: price,
              totalAmountKES: total, fulfillmentType: rng.pick([FulfillmentType.PICKUP, FulfillmentType.DELIVERY]),
              paymentStatus: OrderPaymentStatus.PAID, fulfillmentStatus: OrderFulfillmentStatus.COMPLETED,
              buyerPhone: buyer.phone, mpesaCheckoutRequestId: checkout, mpesaTransactionId: txn,
              paidAt, confirmedByFarmerAt: confirmedAt, receivedByBuyerAt: receivedAt,
              createdAt: orderedAt, updatedAt: receivedAt,
            })
          );
          consumed += qty; releasable += total;
          await escrowEvent(EscrowEventLog, batcher, EscrowEventType.HELD, order._id, farmer, buyer, total, paidAt, 'SYSTEM');
          await escrowEvent(EscrowEventLog, batcher, EscrowEventType.RELEASED, order._id, farmer, buyer, total, receivedAt, Role.BUYER, buyer.id);
          batcher.add(PriceHistory, 'PriceHistory', {
            cropName: crop.name, county: farmer.county, pricePerUnit: price, unit: crop.unit,
            source: PriceHistorySource.ORDER_COMPLETED, farmerId: farmer.id, orderId: order._id, recordedAt: receivedAt,
          });
          await pushNotification(batcher, { userId: buyer.id, type: NotificationType.ORDER_UPDATE, title: 'Payment confirmed — protected in escrow', body: `Your KES ${total.toLocaleString()} for ${crop.name} is protected in escrow.`, relatedEntity: { kind: 'Order', id: order._id }, createdAt: paidAt });
          await pushNotification(batcher, { userId: farmer.id, type: NotificationType.ESCROW_UPDATE, title: 'Funds released from escrow', body: `Order ${ref} confirmed received. KES ${total.toLocaleString()} released and available to request.`, relatedEntity: { kind: 'Order', id: order._id }, createdAt: receivedAt });

          if (rng.bool(profile.ratingP)) {
            const stars = rng.weighted<number>(
              profile.onTimeP > 0.8
                ? [[5, 6], [4, 4], [3, 2], [2, 1], [1, 1]]
                : [[5, 3], [4, 4], [3, 3], [2, 2], [1, 1]]
            );
            batcher.add(Rating, 'Rating', {
              orderId: order._id,
              farmerId: farmer.id, buyerId: buyer.id, rating: stars,
              comment: rng.pick(['Good quality and on time.', 'Fresh produce, will buy again.', 'Reliable farmer.', 'Delivery was a bit late but quality was fine.', 'As described.']),
              createdAt: clampPast(daysAfter(receivedAt, 1)),
            });
          }
        } else if (outcome === 'held') {
          const dispatched = rng.bool(0.6);
          const order = ledger.track('Order', await createDoc(Order, {
            orderReferenceId: ref, listingId: listing._id, farmerId: farmer.id, buyerId: buyer.id,
            cropName: crop.name, quantityOrdered: qty, unit: crop.unit, pricePerUnit: price,
            totalAmountKES: total, fulfillmentType: rng.pick([FulfillmentType.PICKUP, FulfillmentType.DELIVERY]),
            paymentStatus: OrderPaymentStatus.PAID, fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
            buyerPhone: buyer.phone, mpesaCheckoutRequestId: checkout, mpesaTransactionId: txn,
            paidAt, confirmedByFarmerAt: dispatched ? clampPast(hoursAfter(paidAt, rng.int(1, 20))) : undefined,
            createdAt: orderedAt, updatedAt: paidAt,
          }));
          consumed += qty;
          await escrowEvent(EscrowEventLog, batcher, EscrowEventType.HELD, order._id, farmer, buyer, total, paidAt, 'SYSTEM');
          await pushNotification(batcher, { userId: farmer.id, type: NotificationType.ESCROW_UPDATE, title: 'New order paid — held in escrow', body: `Order ${ref} for ${crop.name} is paid and held in escrow. Prepare for fulfillment.`, relatedEntity: { kind: 'Order', id: order._id }, createdAt: paidAt });
        } else {
          // dispute
          const order = ledger.track('Order', await createDoc(Order, {
            orderReferenceId: ref, listingId: listing._id, farmerId: farmer.id, buyerId: buyer.id,
            cropName: crop.name, quantityOrdered: qty, unit: crop.unit, pricePerUnit: price,
            totalAmountKES: total, fulfillmentType: rng.pick([FulfillmentType.PICKUP, FulfillmentType.DELIVERY]),
            paymentStatus: OrderPaymentStatus.PAID, fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
            buyerPhone: buyer.phone, mpesaCheckoutRequestId: checkout, mpesaTransactionId: txn,
            paidAt, confirmedByFarmerAt: clampPast(hoursAfter(paidAt, rng.int(2, 30))),
            createdAt: orderedAt, updatedAt: paidAt,
          }));
          consumed += qty;
          await escrowEvent(EscrowEventLog, batcher, EscrowEventType.HELD, order._id, farmer, buyer, total, paidAt, 'SYSTEM');
          const filedAt = clampPast(daysAfter(paidAt, rng.int(1, 4)));
          const willRefund = rng.bool(0.5);
          const resolvedAt = clampPast(daysAfter(filedAt, rng.int(1, 5)));
          ledger.track('MediationRequest', await createDoc(MediationRequest, {
            orderId: order._id, buyerId: buyer.id, farmerId: farmer.id,
            category: rng.pick(Object.values(MediationCategory)),
            description: rng.pick(['The produce did not match the listing quality.', 'Part of the order was missing on collection.', 'The farmer has not responded about dispatch.']),
            status: willRefund ? MediationRequestStatus.RESOLVED : MediationRequestStatus.OPEN,
            resolutionNote: willRefund ? 'Refund issued to the buyer after review.' : undefined,
            resolvedBy: willRefund ? admin?.id : undefined,
            resolvedAt: willRefund ? resolvedAt : undefined,
            createdAt: filedAt, updatedAt: willRefund ? resolvedAt : filedAt,
          }));
          if (willRefund) {
            await Order.updateOne({ _id: order._id }, {
              $set: {
                paymentStatus: OrderPaymentStatus.REFUNDED,
                fulfillmentStatus: OrderFulfillmentStatus.DISPUTED,
                disputeFlaggedAt: resolvedAt,
                disputeReason: 'Refunded after mediation.',
                updatedAt: resolvedAt,
              },
            });
            consumed -= qty; // inventory restored on refund
            await escrowEvent(EscrowEventLog, batcher, EscrowEventType.REFUND_ISSUED, order._id, farmer, buyer, total, resolvedAt, Role.ADMIN, admin?.id);
            await pushNotification(batcher, { userId: buyer.id, type: NotificationType.ESCROW_UPDATE, title: 'Held funds refunded', body: `Your KES ${total.toLocaleString()} for order ${ref} has been refunded after mediation.`, relatedEntity: { kind: 'Order', id: order._id }, createdAt: resolvedAt });
          }
        }
      }

      // Reconcile inventory with what real orders consumed.
      const remaining = Math.max(0, initialQty - consumed);
      await MarketplaceListing.updateOne({ _id: listing._id }, {
        $set: {
          quantityAvailable: remaining,
          listingStatus: remaining === 0 ? ListingStatus.SOLD_OUT : ListingStatus.AVAILABLE,
          viewCount: baseViews + orderViews,
        },
      });
    }

    // Genuine trust score from the real calculator. recalculate() upserts a
    // FarmerTrustScore outside the ledger, so track it here to keep the run's
    // manifest complete (and reset clean).
    // recalculate() reads the Order and Rating collections, so anything still
    // queued for this farmer has to be on disk before it runs.
    await batcher.flush();
    await recalculate(String(farmer.id));
    const trustDoc = await FarmerTrustScore.findOne({ farmerId: farmer.id }).select('_id');
    if (trustDoc) ledger.track('FarmerTrustScore', trustDoc);

    // Payout requests against releasable funds (drives the admin payout queue +
    // escrow committed/available split).
    if (releasable > 2000 && rng.bool(0.7)) {
      const nReq = rng.int(1, 2);
      let remainingReleasable = releasable;
      for (let w = 0; w < nReq && remainingReleasable > 1000; w++) {
        const amount = Math.floor(rng.float(0.2, 0.5) * remainingReleasable);
        if (amount < 500) break;
        remainingReleasable -= amount;
        const status = rng.weighted<string>([
          [WithdrawalRequestStatus.PAID, 4],
          [WithdrawalRequestStatus.APPROVED, 2],
          [WithdrawalRequestStatus.REQUESTED, 3],
          [WithdrawalRequestStatus.REJECTED, 1],
        ]);
        const reqAt = clampPast(daysAgo(rng.int(1, 60)));
        const resolved = status !== WithdrawalRequestStatus.REQUESTED;
        ledger.track('WithdrawalRequest', await createDoc(WithdrawalRequest, {
          farmerId: farmer.id, amountKES: amount, status,
          note: status === WithdrawalRequestStatus.PAID ? `Paid via M-Pesa ${`QК${rng.int(100000, 999999)}`}` : status === WithdrawalRequestStatus.REJECTED ? 'Insufficient released balance at review time.' : undefined,
          resolvedBy: resolved ? admin?.id : undefined,
          resolvedAt: resolved ? clampPast(daysAfter(reqAt, rng.int(1, 4))) : undefined,
          createdAt: reqAt, updatedAt: resolved ? clampPast(daysAfter(reqAt, rng.int(1, 4))) : reqAt,
        }));
      }
    }
  }

  // Recent market activity so the weekly market-insight cron has >=3 points per
  // crop-county in the last 7 days for several combinations.
  const combos = rng.sample(CROPS, 4);
  for (const crop of combos) {
    // Drawn from the counties that grow it, not from every farming county —
    // price points for a crop the county has never planted are noise the
    // recommendation engine would have to weigh as though they were real.
    const county = rng.pick(crop.grownIn);
    for (let k = 0; k < 3; k++) {
      batcher.add(PriceHistory, 'PriceHistory', {
        cropName: crop.name, county, pricePerUnit: rng.int(crop.priceMin, crop.priceMax),
        unit: crop.unit, source: PriceHistorySource.LISTING_CREATED,
        recordedAt: clampPast(daysAgo(rng.int(1, 6))),
      });
    }
  }

  // Deliberate trends for the crop-county pairs the presentation opens. The
  // scatter above is realistic but directionless; Price Intelligence is judged
  // on whether it can show a rise or a fall and say so with confidence, so these
  // three series are laid down with a known drift inside the engine's 90-day
  // window. Anchored on the canonical farmers, whose counties are fixed.
  await curatedTrends(ctx, world, PriceHistory);
}

// Rising tomatoes in Kirinyaga, falling potatoes in Nyandarua, steady maize in
// Uasin Gishu — one of each direction, so the recommendation, the trend arrow
// and the confidence score all have something honest to report.
async function curatedTrends(
  ctx: SimContext,
  world: World,
  PriceHistory: import('mongoose').Model<unknown>
): Promise<void> {
  const { batcher } = ctx;

  const TRENDS: Array<{ crop: string; county: string; unit: ListingUnit; endPrice: number; driftPct: number }> = [
    { crop: 'Tomatoes', county: 'Kirinyaga', unit: ListingUnit.CRATE, endPrice: 4100, driftPct: 18 },
    { crop: 'Potatoes', county: 'Nyandarua', unit: ListingUnit.BAG, endPrice: 2150, driftPct: -14 },
    { crop: 'Maize', county: 'Uasin Gishu', unit: ListingUnit.BAG, endPrice: 4300, driftPct: 4 },
  ];

  for (const trend of TRENDS) {
    // Attribute the series to a farmer who actually sells there, so the rows are
    // not orphaned against a farmerId from another county.
    const farmer =
      world.farmers.find((f) => f.county === trend.county && f.archetype !== 'new') ?? world.farmers[0];
    if (!farmer) continue;

    const docs = priceSeries({
      cropName: trend.crop,
      county: trend.county,
      unit: trend.unit,
      farmerId: farmer.id,
      endPrice: trend.endPrice,
      driftPct: trend.driftPct,
      points: 12,
      spanDays: 75,
    });
    for (const doc of docs) {
      batcher.add(PriceHistory, 'PriceHistory', doc);
    }
  }
}

async function escrowEvent(
  EscrowEventLog: import('mongoose').Model<unknown>,
  batcher: SimContext['batcher'],
  eventType: string,
  orderId: import('mongoose').Types.ObjectId,
  farmer: PersonRef,
  buyer: PersonRef,
  amountKES: number,
  occurredAt: Date,
  actorRole: string,
  actorId?: import('mongoose').Types.ObjectId
): Promise<void> {
  batcher.add(EscrowEventLog, 'EscrowEventLog', {
    eventType, orderId, buyerId: buyer.id, farmerId: farmer.id,
    amountKES, actorRole, actorId, occurredAt,
  });
}
