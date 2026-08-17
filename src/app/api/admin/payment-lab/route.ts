import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import PaymentEventLog from '@/lib/models/PaymentEventLog.model';
import {
  paymentLabActionSchema,
  DEMO_BRIDGE_ACTION,
  type PaymentLabAction,
} from '@/lib/validation/paymentLabSchema';
import { confirmViaDemoBridge } from '@/lib/payments/demoBridge';
import { isDemoBridgeAvailable, isRealStkDemo, demoAmountKES } from '@/lib/payments/demoMode';
import { forceOutcomeForOrder } from '@/lib/payments/simulationProvider';
import { getActiveProviderName, isSimulationActive } from '@/lib/payments';
import { getSimulationConfig } from '@/lib/payments/simulationConfig';
import { STUCK_PAYMENT_TIMEOUT_MINUTES } from '@/lib/payments/reconcile';
import { computePlatformEscrowPosition } from '@/lib/foodhub/escrow';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, SimulatedOutcome, OrderPaymentStatus } from '@/types';

// ---------------------------------------------------------------------------
// Admin Payment Lab (BE) — drive deterministic simulated payment scenarios and
// read provider-agnostic payment metrics. A permanent operational testing tool.
//   GET  : metrics (from PaymentEventLog) + pending orders + recent event feed
//   POST : force a scenario on an order (simulation provider only)
// Auth: ADMIN.
// ---------------------------------------------------------------------------

const ACTION_MAP: Record<
  PaymentLabAction,
  { outcome: SimulatedOutcome; delaySeconds?: number; duplicate?: boolean }
> = {
  success: { outcome: SimulatedOutcome.SUCCESS },
  insufficient_funds: { outcome: SimulatedOutcome.INSUFFICIENT_FUNDS },
  user_cancelled: { outcome: SimulatedOutcome.USER_CANCELLED },
  phone_unreachable: { outcome: SimulatedOutcome.PHONE_UNREACHABLE },
  timeout: { outcome: SimulatedOutcome.TIMEOUT },
  network_failure: { outcome: SimulatedOutcome.NETWORK_FAILURE },
  unknown_error: { outcome: SimulatedOutcome.UNKNOWN_ERROR },
  // A delayed (but ultimately successful) callback — left scheduled for the
  // poll/cron to deliver, exercising the waiting/reconciliation paths.
  delayed: { outcome: SimulatedOutcome.SUCCESS, delaySeconds: 30 },
  // Success delivered twice — proves the idempotency guard.
  duplicate: { outcome: SimulatedOutcome.SUCCESS, duplicate: true },
  // Callback dropped — the order is reconciled by the stuck-payment cron.
  lost: { outcome: SimulatedOutcome.LOST },
};

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    await connectDB();

    const [agg] = await PaymentEventLog.aggregate([
      {
        $group: {
          _id: null,
          success: { $sum: { $cond: [{ $eq: ['$eventType', 'SUCCESS'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$eventType', 'FAILED'] }, 1, 0] } },
          timeout: { $sum: { $cond: [{ $eq: ['$eventType', 'TIMEOUT'] }, 1, 0] } },
          duplicate: { $sum: { $cond: [{ $eq: ['$eventType', 'DUPLICATE'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$eventType', 'LOST'] }, 1, 0] } },
          // Counted on the FAILED row only. Every cancellation writes two rows
          // -- CALLBACK_RECEIVED carrying the code, then FAILED carrying it
          // again -- so counting the code alone double-counted, and the panel
          // showed more payments cancelled than had failed at all. A number
          // that cannot be true is worse than one that is missing.
          cancelled: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$resultCode', 1032] }, { $eq: ['$eventType', 'FAILED'] }] },
                1,
                0,
              ],
            },
          },
          initiated: { $sum: { $cond: [{ $eq: ['$eventType', 'INITIATED'] }, 1, 0] } },
          avgCompletionMs: {
            $avg: {
              $cond: [{ $eq: ['$eventType', 'SUCCESS'] }, '$processingTimeMs', null],
            },
          },
        },
      },
    ]);

    const metrics = {
      initiated: agg?.initiated ?? 0,
      success: agg?.success ?? 0,
      failed: agg?.failed ?? 0,
      cancelled: agg?.cancelled ?? 0,
      timeout: agg?.timeout ?? 0,
      duplicate: agg?.duplicate ?? 0,
      lost: agg?.lost ?? 0,
      avgCompletionMs: agg?.avgCompletionMs ? Math.round(agg.avgCompletionMs) : 0,
    };

    // Awaiting callback, oldest first.
    //
    // Sorted newest-first before, which is the wrong end: the row that needs an
    // operator is the one that has been waiting longest with a buyer's produce
    // reserved behind it, and with a cap of 15 those were the rows that fell off
    // the list. `paymentRequestedAt` is the start of the CURRENT session — a
    // retry reopens a payment on an order that may be days old, and ageing it
    // from createdAt would report a fresh prompt as long overdue.
    const pendingRaw = await Order.find({ paymentStatus: OrderPaymentStatus.PENDING_PAYMENT })
      .sort({ createdAt: 1 })
      .limit(15)
      .select('orderReferenceId cropName totalAmountKES buyerId createdAt paymentRequestedAt')
      .lean();

    const { default: User } = await import('@/lib/models/User.model');
    const buyerIds = [...new Set(pendingRaw.map((o) => String(o.buyerId)))];
    const buyers = await User.find({ _id: { $in: buyerIds } })
      .select('firstName lastName')
      .lean();
    const buyerMap = new Map(buyers.map((b) => [String(b._id), b]));

    const now = Date.now();
    const pendingOrders = pendingRaw.map((o) => {
      const buyer = buyerMap.get(String(o.buyerId));
      const sessionStarted = o.paymentRequestedAt ?? o.createdAt;
      const waitingMinutes = sessionStarted
        ? Math.max(0, Math.floor((now - new Date(sessionStarted).getTime()) / 60_000))
        : 0;
      return {
        orderId: String(o._id),
        orderReferenceId: o.orderReferenceId,
        cropName: o.cropName,
        totalAmountKES: o.totalAmountKES,
        buyerName: buyer ? `${buyer.firstName ?? ''} ${buyer.lastName ?? ''}`.trim() : 'Unknown',
        createdAt: o.createdAt,
        // How long this payment has been silent, and whether it is now old
        // enough for reconciliation to go and ask the provider about it. Both
        // matter to an operator because the buyer's produce is reserved for the
        // whole of that wait: this list doubles as the reservations approaching
        // release, which is what makes the inventory consequence visible rather
        // than something inferred from a timeout constant in the source.
        waitingMinutes,
        reconciliationDue: waitingMinutes >= STUCK_PAYMENT_TIMEOUT_MINUTES,
      };
    });

    // Payments the platform could not resolve either way.
    //
    // Reconciliation asks the provider what happened to a payment whose
    // callback never arrived. When the provider cannot say, the order lands in
    // UNRESOLVED and an administrator is notified to settle it by hand — and
    // until now there was nowhere for them to go and look. These are the only
    // orders where UmojaHub does not know whether a buyer was charged, so they
    // are the most consequential rows in the system and get their own queue.
    //
    // The checkout request id is included deliberately: it is the reference an
    // administrator needs to search the M-Pesa statement or re-query Daraja by
    // hand, which is what "settle it by hand" actually means.
    const unresolvedRaw = await Order.find({ paymentStatus: OrderPaymentStatus.UNRESOLVED })
      .sort({ updatedAt: -1 })
      .limit(25)
      .select(
        'orderReferenceId cropName totalAmountKES buyerId buyerPhone mpesaCheckoutRequestId createdAt updatedAt'
      )
      .lean();

    const unresolvedBuyerIds = [...new Set(unresolvedRaw.map((o) => String(o.buyerId)))];
    const unresolvedBuyers = await User.find({ _id: { $in: unresolvedBuyerIds } })
      .select('firstName lastName')
      .lean();
    const unresolvedBuyerMap = new Map(unresolvedBuyers.map((b) => [String(b._id), b]));

    const unresolvedPayments = unresolvedRaw.map((o) => {
      const buyer = unresolvedBuyerMap.get(String(o.buyerId));
      return {
        orderId: String(o._id),
        orderReferenceId: o.orderReferenceId,
        cropName: o.cropName,
        totalAmountKES: o.totalAmountKES,
        buyerName: buyer ? `${buyer.firstName ?? ''} ${buyer.lastName ?? ''}`.trim() : 'Unknown',
        buyerPhone: o.buyerPhone ?? null,
        checkoutRequestId: o.mpesaCheckoutRequestId ?? null,
        unresolvedSince: o.updatedAt ?? o.createdAt,
      };
    });

    const recentEvents = (
      await PaymentEventLog.find().sort({ occurredAt: -1 }).limit(15).lean()
    ).map((e) => ({
      eventType: e.eventType,
      provider: e.provider,
      amount: e.amount ?? null,
      paymentReference: e.paymentReference ?? null,
      resultCode: e.resultCode ?? null,
      processingTimeMs: e.processingTimeMs ?? null,
      // Causation, the transition, and the thread that ties one payment
      // session's events together. The feed showed an event type and an amount,
      // which is enough to see that something happened and never enough to see
      // what it did or who did it.
      actor: e.actor ?? null,
      previousStatus: e.previousStatus ?? null,
      newStatus: e.newStatus ?? null,
      reason: e.reason ?? null,
      correlationId: e.correlationId ?? null,
      occurredAt: e.occurredAt,
    }));

    // How much of other people's money the platform is holding right now.
    const escrowPosition = await computePlatformEscrowPosition();

    // Which fixture is loaded, and what it is for. Surfaced rather than left in
    // an env var so the outcome mix on this screen is never mistaken for a
    // measurement of M-Pesa — the profile says, in its own words, which
    // workflow it exists to exercise.
    const simConfig = getSimulationConfig();

    return NextResponse.json({
      data: {
        provider: getActiveProviderName(),
        simulationActive: isSimulationActive(),
        // The demonstration configuration, surfaced so an operator (and a
        // panel) can see from the screen which leg of the payment is real.
        realStkDemo: isRealStkDemo(),
        demoAmountKES: isRealStkDemo() ? demoAmountKES() : null,
        demoBridgeAvailable: isDemoBridgeAvailable(),
        simulationProfile: isSimulationActive()
          ? { name: simConfig.profile, purpose: simConfig.purpose }
          : null,
        metrics,
        escrowPosition,
        pendingOrders,
        unresolvedPayments,
        recentEvents,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    if (!isSimulationActive()) {
      throw new AppError(
        'The Payment Lab is only available when the simulation provider is active.',
        409,
        'PAYMENT_SIMULATION_INACTIVE'
      );
    }

    const body: unknown = await req.json();
    const preParsed = paymentLabActionSchema.safeParse(body);

    // The demonstration bridge is handled before the simulation gate below,
    // because it exists for the opposite situation: a REAL Daraja sandbox
    // payment that Safaricom cannot complete. Its own guard lives in
    // isDemoBridgeAvailable().
    if (preParsed.success && preParsed.data.action === DEMO_BRIDGE_ACTION) {
      const requestId = crypto.randomUUID();
      const session2 = await getServerSession(authOptions);
      requireRole(session2, Role.ADMIN);
      const result = await confirmViaDemoBridge(preParsed.data.orderId, session2!.user.id);
      logger.warn('admin/payment-lab', 'Demonstration bridge invoked', {
        requestId,
        adminId: session2!.user.id,
        ...result,
      });
      return NextResponse.json({ data: { action: DEMO_BRIDGE_ACTION, ...result } });
    }

    const parsed = paymentLabActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'The submitted data is invalid. Check the details and try again.',
          code: 'VALIDATION_FAILED',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { orderId, action } = parsed.data;
    // The bridge returned above; anything reaching here is a simulator action.
    if (action === DEMO_BRIDGE_ACTION) {
      throw new AppError('Unsupported action.', 400, 'VALIDATION_FAILED');
    }
    const opts = ACTION_MAP[action];

    const result = await forceOutcomeForOrder(orderId, opts);

    logger.info('admin/payment-lab', 'Forced simulated payment scenario', {
      requestId,
      adminId: session!.user.id,
      orderId,
      action,
      delivered: result.delivered,
    });

    return NextResponse.json({ data: { action, ...result } });
  } catch (error) {
    return handleApiError(error);
  }
}
