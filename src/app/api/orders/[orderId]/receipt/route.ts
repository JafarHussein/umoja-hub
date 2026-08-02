import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError } from '@/lib/utils';
import { getActiveProviderName, isSimulationActive } from '@/lib/payments';
import { orderEscrowState } from '@/lib/foodhub/orderEscrowState';
import { buildOrderReceipt, buildTransactionTrail, hasReceipt } from '@/lib/foodhub/receipt';
import { MediationRequestStatus, Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/orders/[orderId]/receipt — the transaction receipt and full audit
// trail for one order.
//
// Auth: the buyer or the farmer on the order, or any ADMIN.
//
// Nothing here is stored: the receipt is derived from the order, and the trail
// is a chronological replay of the append-only PaymentEventLog and
// EscrowEventLog rows. This is the read surface for those two logs, which were
// previously written but never exposed to anyone.
// ---------------------------------------------------------------------------

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }

    const { orderId } = await params;
    if (!mongoose.isValidObjectId(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    await connectDB();

    const { default: Order } = await import('@/lib/models/Order.model');
    const order = await Order.findById(orderId).lean();
    if (!order) {
      throw new AppError('This order does not exist.', 404, 'ORDER_NOT_FOUND');
    }

    const { id: userId, role } = session.user;
    const isParty = String(order.buyerId) === userId || String(order.farmerId) === userId;
    if (!isParty && role !== Role.ADMIN) {
      throw new AppError(
        'You do not have permission to perform this action.',
        403,
        'AUTH_FORBIDDEN'
      );
    }

    // An unpaid order has no receipt to show — say so plainly rather than
    // rendering a document that attests to nothing.
    if (!hasReceipt(order.paymentStatus)) {
      throw new AppError(
        'This order has no receipt yet. A receipt is issued once payment is confirmed.',
        404,
        'RECEIPT_NOT_AVAILABLE'
      );
    }

    const [
      { default: User },
      { default: PaymentEventLog },
      { default: EscrowEventLog },
      { default: MediationRequest },
    ] = await Promise.all([
      import('@/lib/models/User.model'),
      import('@/lib/models/PaymentEventLog.model'),
      import('@/lib/models/EscrowEventLog.model'),
      import('@/lib/models/MediationRequest.model'),
    ]);

    const [parties, paymentEvents, escrowEvents, openMediation] = await Promise.all([
      User.find({ _id: { $in: [order.buyerId, order.farmerId] } })
        .select('firstName lastName phoneNumber')
        .lean(),
      PaymentEventLog.find({ orderId: order._id }).sort({ occurredAt: 1 }).lean(),
      EscrowEventLog.find({ orderId: order._id }).sort({ occurredAt: 1 }).lean(),
      MediationRequest.findOne({
        orderId: order._id,
        status: { $in: [MediationRequestStatus.OPEN, MediationRequestStatus.IN_REVIEW] },
      } as object)
        .select('_id')
        .lean(),
    ]);

    const partyMap = new Map(parties.map((p) => [String(p._id), p]));
    const buyerDoc = partyMap.get(String(order.buyerId));
    const farmerDoc = partyMap.get(String(order.farmerId));
    const nameOf = (p?: { firstName?: string; lastName?: string }): string =>
      p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || '—' : '—';

    const escrowState = orderEscrowState(
      {
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        confirmedByFarmerAt: order.confirmedByFarmerAt ?? null,
      },
      Boolean(openMediation)
    );

    const receipt = buildOrderReceipt({
      order: {
        orderReferenceId: order.orderReferenceId,
        mpesaTransactionId: order.mpesaTransactionId ?? null,
        cropName: order.cropName,
        quantityOrdered: order.quantityOrdered,
        unit: order.unit,
        pricePerUnit: order.pricePerUnit,
        totalAmountKES: order.totalAmountKES,
        fulfillmentType: order.fulfillmentType,
        paymentStatus: order.paymentStatus,
        paidAt: order.paidAt ?? null,
      },
      // The buyer's own phone is the one that was charged; the farmer's is not
      // part of the payment and is deliberately omitted from the receipt.
      buyer: { name: nameOf(buyerDoc), phone: order.buyerPhone },
      farmer: { name: nameOf(farmerDoc) },
      escrowState,
      provider: getActiveProviderName(),
      isSimulated: isSimulationActive(),
    });

    const events = buildTransactionTrail(paymentEvents, escrowEvents);

    return NextResponse.json({ data: { receipt, events } });
  } catch (error) {
    return handleApiError(error);
  }
}
