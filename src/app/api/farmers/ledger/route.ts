import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { computeEscrowBalance } from '@/lib/foodhub/escrow';
import { handleApiError, requireRole } from '@/lib/utils';
import { Role, OrderPaymentStatus } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/farmers/ledger — Farmer escrow & settlement ledger (BE-08)
// Auth: FARMER. Returns the per-order credit side of the escrow balance —
// every order whose payment has been received (paymentStatus PAID, the only
// writer of gross) — alongside the derived balance from `computeEscrowBalance`
// (gross received − committed payout requests). There is no stored wallet;
// the balance is always recomputed. Powers SCR-FAR-004.
// ---------------------------------------------------------------------------

// Most recent settled orders surfaced as line items. The balance is computed
// independently over the full set, so truncation here never affects totals.
const LINE_ITEM_LIMIT = 100;

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    await connectDB();

    const farmerId = session!.user.id;
    const { default: Order } = await import('@/lib/models/Order.model');

    const [orders, balance] = await Promise.all([
      Order.find({ farmerId, paymentStatus: OrderPaymentStatus.PAID } as object)
        .select(
          'orderReferenceId cropName quantityOrdered unit totalAmountKES fulfillmentStatus paidAt'
        )
        .sort({ paidAt: -1 })
        .limit(LINE_ITEM_LIMIT)
        .lean(),
      computeEscrowBalance(farmerId),
    ]);

    const lineItems = orders.map((o) => ({
      orderId: String(o._id),
      orderReferenceId: o.orderReferenceId,
      cropName: o.cropName,
      quantityOrdered: o.quantityOrdered,
      unit: o.unit,
      amountKES: o.totalAmountKES,
      fulfillmentStatus: o.fulfillmentStatus,
      paidAt: o.paidAt ?? null,
    }));

    return NextResponse.json({ data: { lineItems, balance } });
  } catch (error) {
    return handleApiError(error);
  }
}
