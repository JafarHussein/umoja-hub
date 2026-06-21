import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole } from '@/lib/utils';
import { orderEscrowState } from '@/lib/foodhub/orderEscrowState';
import {
  Role,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  MediationRequestStatus,
  WithdrawalRequestStatus,
} from '@/types';

// ---------------------------------------------------------------------------
// GET /api/admin/escrow — platform escrow ledger (read model).
// Auth: ADMIN. Returns platform-wide custody totals (held / releasable /
// in-dispute / refunded / settled) plus a paginated per-order ledger with each
// order's derived escrow state and both parties. Pure aggregation — there is no
// stored escrow record; everything is computed from Order + MediationRequest +
// WithdrawalRequest. Powers the admin escrow dashboard.
// ---------------------------------------------------------------------------

type LedgerFilter = 'ALL' | 'HELD' | 'RELEASABLE' | 'REFUNDED';

const ORDER_FILTER: Record<LedgerFilter, Record<string, unknown>> = {
  ALL: {
    $or: [
      { paymentStatus: OrderPaymentStatus.PAID },
      { paymentStatus: OrderPaymentStatus.REFUNDED },
    ],
  },
  HELD: {
    paymentStatus: OrderPaymentStatus.PAID,
    fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
  },
  RELEASABLE: { fulfillmentStatus: OrderFulfillmentStatus.COMPLETED },
  REFUNDED: { paymentStatus: OrderPaymentStatus.REFUNDED },
};

async function sumOrders(
  Order: mongoose.Model<Record<string, unknown>>,
  match: Record<string, unknown>
): Promise<{ total: number; count: number }> {
  const agg = await Order.aggregate<{ total: number; count: number }>([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$totalAmountKES' }, count: { $sum: 1 } } },
  ]);
  return { total: agg[0]?.total ?? 0, count: agg[0]?.count ?? 0 };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const { searchParams } = new URL(req.url);
    const filterParam = (searchParams.get('state') ?? 'ALL').toUpperCase();
    const filter: LedgerFilter = (
      ['ALL', 'HELD', 'RELEASABLE', 'REFUNDED'].includes(filterParam) ? filterParam : 'ALL'
    ) as LedgerFilter;
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);

    if (cursor && !mongoose.isValidObjectId(cursor)) {
      return NextResponse.json(
        { error: 'Invalid cursor value.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    await connectDB();

    const [{ default: Order }, { default: MediationRequest }, { default: WithdrawalRequest }, { default: User }] =
      await Promise.all([
        import('@/lib/models/Order.model'),
        import('@/lib/models/MediationRequest.model'),
        import('@/lib/models/WithdrawalRequest.model'),
        import('@/lib/models/User.model'),
      ]);

    const OrderModel = Order as unknown as mongoose.Model<Record<string, unknown>>;

    // Orders with a live escalation — their held funds are blocked from release.
    const disputedOrderIds = (await MediationRequest.distinct('orderId', {
      status: { $in: [MediationRequestStatus.OPEN, MediationRequestStatus.IN_REVIEW] },
    })) as mongoose.Types.ObjectId[];
    const disputedSet = new Set(disputedOrderIds.map(String));

    // ── Platform totals ────────────────────────────────────────────────────
    const [held, releasable, refunded, inDispute, settledAgg] = await Promise.all([
      sumOrders(OrderModel, {
        paymentStatus: OrderPaymentStatus.PAID,
        fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
      }),
      sumOrders(OrderModel, { fulfillmentStatus: OrderFulfillmentStatus.COMPLETED }),
      sumOrders(OrderModel, { paymentStatus: OrderPaymentStatus.REFUNDED }),
      disputedOrderIds.length
        ? sumOrders(OrderModel, {
            _id: { $in: disputedOrderIds },
            paymentStatus: OrderPaymentStatus.PAID,
          })
        : Promise.resolve({ total: 0, count: 0 }),
      WithdrawalRequest.aggregate<{ total: number }>([
        { $match: { status: WithdrawalRequestStatus.PAID } },
        { $group: { _id: null, total: { $sum: '$amountKES' } } },
      ]),
    ]);

    const totals = {
      heldKES: held.total,
      heldCount: held.count,
      releasableKES: releasable.total,
      releasableCount: releasable.count,
      inDisputeKES: inDispute.total,
      inDisputeCount: inDispute.count,
      refundedKES: refunded.total,
      refundedCount: refunded.count,
      settledKES: settledAgg[0]?.total ?? 0,
    };

    // ── Per-order ledger ─────────────────────────────────────────────────────
    const ledgerFilter: Record<string, unknown> = { ...ORDER_FILTER[filter] };
    if (cursor) ledgerFilter['_id'] = { $lt: new mongoose.Types.ObjectId(cursor) };

    const rawOrders = await Order.find(ledgerFilter)
      .select(
        'orderReferenceId cropName totalAmountKES paymentStatus fulfillmentStatus confirmedByFarmerAt paidAt farmerId buyerId'
      )
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rawOrders.length > limit;
    const page = hasMore ? rawOrders.slice(0, limit) : rawOrders;
    const nextCursor = hasMore ? (page.at(-1)?._id?.toString() ?? null) : null;

    const partyIds = [
      ...new Set(page.flatMap((o) => [String(o.farmerId), String(o.buyerId)])),
    ];
    const users = await User.find({ _id: { $in: partyIds } })
      .select('firstName lastName')
      .lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const lineItems = page.map((o) => {
      const farmer = userMap.get(String(o.farmerId));
      const buyer = userMap.get(String(o.buyerId));
      return {
        orderId: String(o._id),
        orderReferenceId: o.orderReferenceId,
        cropName: o.cropName,
        amountKES: o.totalAmountKES,
        escrowState: orderEscrowState(
          {
            paymentStatus: o.paymentStatus,
            fulfillmentStatus: o.fulfillmentStatus,
            confirmedByFarmerAt: o.confirmedByFarmerAt ?? null,
          },
          disputedSet.has(String(o._id))
        ),
        paidAt: o.paidAt ?? null,
        farmerName: farmer ? `${farmer.firstName ?? ''} ${farmer.lastName ?? ''}`.trim() : '—',
        buyerName: buyer ? `${buyer.firstName ?? ''} ${buyer.lastName ?? ''}`.trim() : '—',
      };
    });

    return NextResponse.json({ data: { totals, lineItems }, nextCursor });
  } catch (error) {
    return handleApiError(error);
  }
}
