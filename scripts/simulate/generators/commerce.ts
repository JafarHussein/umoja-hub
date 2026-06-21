// Marketplace + escrow + trust generator. For each verified farmer it creates
// listings and a backdated stream of orders across the full lifecycle, mirroring
// exactly what the real routes write (paidAt/confirmed/received, EscrowEventLog
// HELD/RELEASED/REFUND_ISSUED, PriceHistory, inventory consumption), then derives
// the farmer's trust score with the REAL recalculate(). Escrow balances and the
// admin ledger emerge from this data — nothing is hand-set.

import type { SimContext, World, PersonRef } from '../world';
import { createDoc, pushNotification } from '../helpers';
import { between, daysAgo, daysAfter, hoursAfter } from '../clock';
import { CROPS, LISTING_TEMPLATES, FARMING_COUNTIES, type Crop } from '../dictionaries';
import { cropImageUrl } from '../images';
import { recalculate } from '../../../src/lib/trust/farmerTrustCalculator';
import {
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  FulfillmentType,
  ListingStatus,
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

function clampPast(d: Date): Date {
  return new Date(Math.min(d.getTime(), Date.now() - 60_000));
}

function laterOf(a: Date, b: Date): Date {
  return a.getTime() > b.getTime() ? a : b;
}

export async function generateCommerce(ctx: SimContext, world: World): Promise<void> {
  const { rng, ledger } = ctx;
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

  for (const farmer of world.farmers) {
    if (farmer.archetype === 'new') continue; // unverified — cannot list legitimately
    const profile = activityFor(farmer.archetype);
    let releasable = 0;

    const nListings = rng.int(profile.listings[0], profile.listings[1]);
    for (let li = 0; li < nListings; li++) {
      const crop: Crop = rng.pick(CROPS);
      const price = rng.int(crop.priceMin, crop.priceMax);
      const initialQty = rng.int(30, 220);
      const listedAt = clampPast(between(rng, farmer.joinedAt, daysAgo(3)));
      const description = rng
        .pick(LISTING_TEMPLATES)
        .replace('{crop}', crop.name)
        .replace('{county}', farmer.county);

      const listing = ledger.track(
        'MarketplaceListing',
        await createDoc(MarketplaceListing, {
          farmerId: farmer.id,
          title: `${crop.name} — ${farmer.county}`,
          cropName: crop.name,
          description,
          quantityAvailable: initialQty,
          unit: crop.unit,
          currentPricePerUnit: price,
          pickupCounty: farmer.county,
          pickupDescription: `Pickup at ${farmer.county} town, along the main road. Call ahead to arrange collection.`,
          imageUrls: [cropImageUrl(crop.imageKey, rng.int(1, 9999))],
          listingStatus: ListingStatus.AVAILABLE,
          isVerifiedListing: rng.bool(0.5),
          viewCount: rng.int(8, 240),
          createdAt: listedAt,
          updatedAt: listedAt,
        })
      );

      ledger.track(
        'PriceHistory',
        await createDoc(PriceHistory, {
          cropName: crop.name,
          county: farmer.county,
          pricePerUnit: price,
          unit: crop.unit,
          source: PriceHistorySource.LISTING_CREATED,
          farmerId: farmer.id,
          recordedAt: listedAt,
        })
      );

      let consumed = 0;
      const nOrders = rng.int(profile.orders[0], profile.orders[1]);
      for (let oi = 0; oi < nOrders; oi++) {
        const buyer: PersonRef = rng.pick(world.buyers);
        const qty = rng.int(1, Math.min(8, initialQty));
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
          await escrowEvent(EscrowEventLog, ledger, EscrowEventType.HELD, order._id, farmer, buyer, total, paidAt, 'SYSTEM');
          await escrowEvent(EscrowEventLog, ledger, EscrowEventType.RELEASED, order._id, farmer, buyer, total, receivedAt, Role.BUYER, buyer.id);
          ledger.track('PriceHistory', await createDoc(PriceHistory, {
            cropName: crop.name, county: farmer.county, pricePerUnit: price, unit: crop.unit,
            source: PriceHistorySource.ORDER_COMPLETED, farmerId: farmer.id, orderId: order._id, recordedAt: receivedAt,
          }));
          await pushNotification(ledger, { userId: buyer.id, type: NotificationType.ORDER_UPDATE, title: 'Payment confirmed — protected in escrow', body: `Your KES ${total.toLocaleString()} for ${crop.name} is protected in escrow.`, relatedEntity: { kind: 'Order', id: order._id }, createdAt: paidAt });
          await pushNotification(ledger, { userId: farmer.id, type: NotificationType.ESCROW_UPDATE, title: 'Funds released from escrow', body: `Order ${ref} confirmed received. KES ${total.toLocaleString()} released and available to request.`, relatedEntity: { kind: 'Order', id: order._id }, createdAt: receivedAt });

          if (rng.bool(profile.ratingP)) {
            const stars = rng.weighted<number>(
              profile.onTimeP > 0.8
                ? [[5, 6], [4, 4], [3, 2], [2, 1], [1, 1]]
                : [[5, 3], [4, 4], [3, 3], [2, 2], [1, 1]]
            );
            ledger.track('Rating', await createDoc(Rating, {
              orderId: order._id,
              farmerId: farmer.id, buyerId: buyer.id, rating: stars,
              comment: rng.pick(['Good quality and on time.', 'Fresh produce, will buy again.', 'Reliable farmer.', 'Delivery was a bit late but quality was fine.', 'As described.']),
              createdAt: clampPast(daysAfter(receivedAt, 1)),
            }));
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
          await escrowEvent(EscrowEventLog, ledger, EscrowEventType.HELD, order._id, farmer, buyer, total, paidAt, 'SYSTEM');
          await pushNotification(ledger, { userId: farmer.id, type: NotificationType.ESCROW_UPDATE, title: 'New order paid — held in escrow', body: `Order ${ref} for ${crop.name} is paid and held in escrow. Prepare for fulfillment.`, relatedEntity: { kind: 'Order', id: order._id }, createdAt: paidAt });
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
          await escrowEvent(EscrowEventLog, ledger, EscrowEventType.HELD, order._id, farmer, buyer, total, paidAt, 'SYSTEM');
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
            await escrowEvent(EscrowEventLog, ledger, EscrowEventType.REFUND_ISSUED, order._id, farmer, buyer, total, resolvedAt, Role.ADMIN, admin?.id);
            await pushNotification(ledger, { userId: buyer.id, type: NotificationType.ESCROW_UPDATE, title: 'Held funds refunded', body: `Your KES ${total.toLocaleString()} for order ${ref} has been refunded after mediation.`, relatedEntity: { kind: 'Order', id: order._id }, createdAt: resolvedAt });
          }
        }
      }

      // Reconcile inventory with what real orders consumed.
      const remaining = Math.max(0, initialQty - consumed);
      await MarketplaceListing.updateOne({ _id: listing._id }, {
        $set: {
          quantityAvailable: remaining,
          listingStatus: remaining === 0 ? ListingStatus.SOLD_OUT : ListingStatus.AVAILABLE,
        },
      });
    }

    // Genuine trust score from the real calculator. recalculate() upserts a
    // FarmerTrustScore outside the ledger, so track it here to keep the run's
    // manifest complete (and reset clean).
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
    const county = rng.pick(FARMING_COUNTIES);
    for (let k = 0; k < 3; k++) {
      ledger.track('PriceHistory', await createDoc(PriceHistory, {
        cropName: crop.name, county, pricePerUnit: rng.int(crop.priceMin, crop.priceMax),
        unit: crop.unit, source: PriceHistorySource.LISTING_CREATED,
        recordedAt: clampPast(daysAgo(rng.int(1, 6))),
      }));
    }
  }
}

async function escrowEvent(
  EscrowEventLog: import('mongoose').Model<unknown>,
  ledger: SimContext['ledger'],
  eventType: string,
  orderId: import('mongoose').Types.ObjectId,
  farmer: PersonRef,
  buyer: PersonRef,
  amountKES: number,
  occurredAt: Date,
  actorRole: string,
  actorId?: import('mongoose').Types.ObjectId
): Promise<void> {
  ledger.track('EscrowEventLog', await createDoc(EscrowEventLog, {
    eventType, orderId, buyerId: buyer.id, farmerId: farmer.id,
    amountKES, actorRole, actorId, occurredAt,
  }));
}
