import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import PaymentEventLog from '@/lib/models/PaymentEventLog.model';
import { paymentLabActionSchema, type PaymentLabAction } from '@/lib/validation/paymentLabSchema';
import { forceOutcomeForOrder } from '@/lib/payments/simulationProvider';
import { getActiveProviderName, isSimulationActive } from '@/lib/payments';
import { getSimulationConfig } from '@/lib/payments/simulationConfig';
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
          cancelled: { $sum: { $cond: [{ $eq: ['$resultCode', 1032] }, 1, 0] } },
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

    const pendingRaw = await Order.find({ paymentStatus: OrderPaymentStatus.PENDING_PAYMENT })
      .sort({ createdAt: -1 })
      .limit(15)
      .select('orderReferenceId cropName totalAmountKES buyerId createdAt')
      .lean();

    const { default: User } = await import('@/lib/models/User.model');
    const buyerIds = [...new Set(pendingRaw.map((o) => String(o.buyerId)))];
    const buyers = await User.find({ _id: { $in: buyerIds } })
      .select('firstName lastName')
      .lean();
    const buyerMap = new Map(buyers.map((b) => [String(b._id), b]));

    const pendingOrders = pendingRaw.map((o) => {
      const buyer = buyerMap.get(String(o.buyerId));
      return {
        orderId: String(o._id),
        orderReferenceId: o.orderReferenceId,
        cropName: o.cropName,
        totalAmountKES: o.totalAmountKES,
        buyerName: buyer ? `${buyer.firstName ?? ''} ${buyer.lastName ?? ''}`.trim() : 'Unknown',
        createdAt: o.createdAt,
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
      occurredAt: e.occurredAt,
    }));

    // Which fixture is loaded, and what it is for. Surfaced rather than left in
    // an env var so the outcome mix on this screen is never mistaken for a
    // measurement of M-Pesa — the profile says, in its own words, which
    // workflow it exists to exercise.
    const simConfig = getSimulationConfig();

    return NextResponse.json({
      data: {
        provider: getActiveProviderName(),
        simulationActive: isSimulationActive(),
        simulationProfile: isSimulationActive()
          ? { name: simConfig.profile, purpose: simConfig.purpose }
          : null,
        metrics,
        pendingOrders,
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
