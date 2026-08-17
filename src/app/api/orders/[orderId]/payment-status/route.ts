import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import { AppError, handleApiError } from '@/lib/utils';
import { isSimulationActive } from '@/lib/payments';
import { dispatchDuePayments } from '@/lib/payments/dispatcher';
import { reconcileStuckPayments } from '@/lib/payments/reconcile';
import { PAYMENT_LABEL, RESULT_CODE_DETAIL } from '@/lib/foodhub/receipt';
import { OrderPaymentStatus, Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/orders/[orderId]/payment-status — the state of one payment session.
// Auth: BUYER or FARMER who owns this order.
//
// This used to return a terminal status and nothing else, so checkout could
// only ever be "spinner, then result" — the same thing a mock would produce.
// The backend has always recorded a stream: PaymentEventLog rows written by the
// order route and the shared callback processor, identical under real Daraja
// and the simulator. It returns that stream now, so the waiting screen narrates
// what actually happened and when, rather than animating a guess.
// ---------------------------------------------------------------------------

/** One recorded step of the payment session, in the words the receipt uses. */
export interface IPaymentSessionEvent {
  type: string;
  label: string;
  detail: string | null;
  occurredAt: string;
}

interface IPaymentEventLean {
  eventType: string;
  resultCode?: number | null;
  reason?: string | null;
  occurredAt?: Date | string | null;
}

// The vocabulary comes from the receipt so the live session and the permanent
// record describe the same event with the same sentence. A buyer who watched
// "M-Pesa responded" go by should find that exact line on the receipt later.
//
// The recorded `reason` is preferred over the result-code gloss for the same
// reason the receipt prefers it: it was written by the code that caused the
// event and says why, where a code only says what. Without this the waiting
// screen said strictly less about an event than the receipt did about the same
// event, which is an odd thing for the live view to do.
function narrate(events: IPaymentEventLean[]): IPaymentSessionEvent[] {
  return events.map((e) => ({
    type: e.eventType,
    label: PAYMENT_LABEL[e.eventType] ?? e.eventType,
    detail:
      e.reason ??
      (typeof e.resultCode === 'number' ? (RESULT_CODE_DETAIL[e.resultCode] ?? null) : null),
    occurredAt: new Date(e.occurredAt ?? Date.now()).toISOString(),
  }));
}

async function sessionEvents(orderId: string): Promise<IPaymentSessionEvent[]> {
  try {
    const { default: PaymentEventLog } = await import('@/lib/models/PaymentEventLog.model');
    const rows = (await PaymentEventLog.find({ orderId })
      .select('eventType resultCode reason occurredAt')
      .sort({ occurredAt: 1 })
      .lean()) as unknown as IPaymentEventLean[];
    return narrate(rows);
  } catch {
    // The narration is decoration over the status. Never let it break the poll
    // the buyer is depending on to learn whether their money moved.
    return [];
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }

    const { orderId } = await params;

    type OrderStatusLean = {
      paymentStatus: string;
      fulfillmentStatus: string;
      buyerId: { toString(): string };
      farmerId: { toString(): string };
      mpesaTransactionId?: string | null;
    };

    const order = (await Order.findById(orderId)
      .select('paymentStatus fulfillmentStatus buyerId farmerId mpesaTransactionId')
      .lean()) as unknown as OrderStatusLean | null;

    if (!order) {
      throw new AppError('This order does not exist.', 404, 'ORDER_NOT_FOUND');
    }

    const { id: userId, role } = session.user;

    if (
      (role === Role.BUYER && order.buyerId.toString() !== userId) ||
      (role === Role.FARMER && order.farmerId.toString() !== userId)
    ) {
      throw new AppError(
        'You do not have permission to perform this action.',
        403,
        'AUTH_FORBIDDEN'
      );
    }

    // The buyer's poll is the timely trigger for both lazy payment jobs, since
    // Vercel Hobby only permits a daily cron sweep.
    //
    // Reconciliation first: if this order's payment has passed the timeout with
    // no callback, close it out here rather than leaving it stranded until the
    // next daily sweep. Scoped to this order, and a no-op until the timeout.
    if (order.paymentStatus === OrderPaymentStatus.PENDING_PAYMENT) {
      try {
        const closed = await reconcileStuckPayments({ orderId });
        if (closed > 0) {
          // Re-read rather than assume. This branch used to answer a hardcoded
          // FAILED, which was true while reconciliation had only one possible
          // ending. It now has three: it asks the provider first, so a stuck
          // payment can come back PAID when the debit was real and only the
          // callback was lost, or UNRESOLVED when the provider cannot say.
          // Announcing "failed" for either of those tells the buyer their money
          // is safe at the exact moment we know it might not be — and for a
          // recovered payment it would report failure on an order that had just
          // succeeded. The delivery sweep below has always re-read; this now
          // matches it.
          const settled = (await Order.findById(orderId)
            .select('paymentStatus fulfillmentStatus mpesaTransactionId')
            .lean()) as unknown as Pick<
            OrderStatusLean,
            'paymentStatus' | 'fulfillmentStatus' | 'mpesaTransactionId'
          > | null;

          if (settled) {
            return NextResponse.json({
              paymentStatus: settled.paymentStatus,
              fulfillmentStatus: settled.fulfillmentStatus,
              isSimulated: isSimulationActive(),
              mpesaTransactionId: settled.mpesaTransactionId ?? null,
              events: await sessionEvents(orderId),
            });
          }
        }
      } catch {
        // Best-effort; fall through to the delivery sweep and current status.
      }
    }

    // Simulation mode: the buyer's poll is the primary delivery trigger for due
    // simulated callbacks. Deliver any that are due for this order, then re-read
    // the (possibly updated) status. Real Daraja delivers via the webhook, so
    // this is a no-op there.
    if (isSimulationActive()) {
      try {
        const delivered = await dispatchDuePayments({ orderId });
        if (delivered > 0) {
          const fresh = (await Order.findById(orderId)
            .select('paymentStatus fulfillmentStatus mpesaTransactionId')
            .lean()) as unknown as Pick<
            OrderStatusLean,
            'paymentStatus' | 'fulfillmentStatus' | 'mpesaTransactionId'
          > | null;
          if (fresh) {
            return NextResponse.json({
              paymentStatus: fresh.paymentStatus,
              fulfillmentStatus: fresh.fulfillmentStatus,
              isSimulated: true,
              // The simulator mints a realistic 10-character M-Pesa receipt and
              // the platform stored it without ever showing it. It is the one
              // thing a Kenyan buyer checks a payment against.
              mpesaTransactionId: fresh.mpesaTransactionId ?? null,
              events: await sessionEvents(orderId),
            });
          }
        }
      } catch {
        // Delivery is best-effort; fall through to the current status.
      }
    }

    // The waiting screen must tell the buyer the truth about what it is asking
    // them to do: under simulation no STK prompt reaches their handset, so a
    // "enter your M-Pesa PIN" instruction would be false.
    return NextResponse.json({
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      isSimulated: isSimulationActive(),
      mpesaTransactionId: order.mpesaTransactionId ?? null,
      events: await sessionEvents(orderId),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
