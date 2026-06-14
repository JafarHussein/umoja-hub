import { randomUUID, randomInt } from 'crypto';
import SimulatedPayment from '@/lib/models/SimulatedPayment.model';
import { connectDB } from '@/lib/db';
import { AppError, logger } from '@/lib/utils';
import { deliverSimulatedPayment } from '@/lib/payments/dispatcher';
import {
  getSimulationConfig,
  pickOutcome,
  pickDelaySeconds,
} from '@/lib/payments/simulationConfig';
import type {
  PaymentProvider,
  PaymentInitiationParams,
  PaymentInitiationResult,
} from '@/lib/payments/types';
import { SimulatedOutcome, SimulatedPaymentStatus } from '@/types';

// ---------------------------------------------------------------------------
// Simulation payment provider.
//
// initiatePayment() returns immediately (like a real STK push) and persists a
// SimulatedPayment carrying the chosen outcome + a deliverAt instant. The
// dispatcher delivers it later through the shared callback processor. The
// Payment Lab uses forceOutcomeForOrder() to drive deterministic scenarios.
// ---------------------------------------------------------------------------

const RECEIPT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** A realistic 10-char uppercase M-Pesa receipt, e.g. "QGR1ABCD23". */
export function generateReceiptNumber(): string {
  let out = '';
  for (let i = 0; i < 10; i += 1) out += RECEIPT_CHARSET[randomInt(RECEIPT_CHARSET.length)];
  return out;
}

function newCheckoutRequestId(): string {
  return `ws_CO_sim_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

function newMerchantRequestId(): string {
  return `${randomInt(10000, 99999)}-${randomInt(1000000, 9999999)}-1`;
}

interface ScheduleOverrides {
  outcome?: SimulatedOutcome;
  delaySeconds?: number;
  duplicate?: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
}

async function createScheduledPayment(
  params: PaymentInitiationParams,
  overrides: ScheduleOverrides = {}
): Promise<{ checkoutRequestId: string; merchantRequestId: string; outcome: SimulatedOutcome }> {
  const config = getSimulationConfig();
  const outcome = overrides.outcome ?? pickOutcome(config);
  const delaySeconds = overrides.delaySeconds ?? pickDelaySeconds(config);
  const duplicate = overrides.duplicate ?? Math.random() < config.duplicateRate;

  const checkoutRequestId = overrides.checkoutRequestId ?? newCheckoutRequestId();
  const merchantRequestId = overrides.merchantRequestId ?? newMerchantRequestId();
  const mpesaReceiptNumber =
    outcome === SimulatedOutcome.SUCCESS ? generateReceiptNumber() : undefined;

  await SimulatedPayment.create({
    orderId: params.orderId,
    checkoutRequestId,
    merchantRequestId,
    outcome,
    amount: params.amount,
    buyerId: params.buyerId,
    farmerId: params.farmerId,
    deliverAt: new Date(Date.now() + delaySeconds * 1000),
    duplicate,
    status: SimulatedPaymentStatus.SCHEDULED,
    ...(mpesaReceiptNumber ? { mpesaReceiptNumber } : {}),
  });

  return { checkoutRequestId, merchantRequestId, outcome };
}

export const simulationProvider: PaymentProvider = {
  name: 'simulation',
  async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    await connectDB();
    const { checkoutRequestId, merchantRequestId } = await createScheduledPayment(params);
    logger.info('payments', 'Simulated STK push initiated', {
      orderId: params.orderId,
      checkoutRequestId,
    });
    return {
      checkoutRequestId,
      merchantRequestId,
      customerMessage: 'Success. Request accepted for processing',
    };
  },
};

// ---------------------------------------------------------------------------
// Payment Lab — force a deterministic outcome on an existing order.
//
// Reuses the order's own checkoutRequestId so the shared processor resolves the
// order. Reuses any existing simulated-payment row for the order (resetting it)
// to avoid a unique-index collision; otherwise creates one. When delaySeconds is
// 0 the callback is delivered immediately, otherwise it is left for the poll/
// cron to deliver.
// ---------------------------------------------------------------------------

export async function forceOutcomeForOrder(
  orderId: string,
  opts: { outcome: SimulatedOutcome; delaySeconds?: number; duplicate?: boolean }
): Promise<{ delivered: boolean; outcome: SimulatedOutcome; scheduledFor: Date }> {
  await connectDB();

  const { default: Order } = await import('@/lib/models/Order.model');
  const order = await Order.findById(orderId).lean();
  if (!order) {
    throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
  }
  if (!order.mpesaCheckoutRequestId) {
    throw new AppError(
      'This order has no payment session to act on.',
      409,
      'PAYMENT_NO_SESSION'
    );
  }

  const delaySeconds = opts.delaySeconds ?? 0;
  const deliverAt = new Date(Date.now() + delaySeconds * 1000);
  const mpesaReceiptNumber =
    opts.outcome === SimulatedOutcome.SUCCESS ? generateReceiptNumber() : undefined;

  // Reuse any existing row for this order (reset it) to avoid colliding with the
  // unique checkoutRequestId index.
  let sim = await SimulatedPayment.findOne({ orderId }).sort({ createdAt: -1 });
  if (sim) {
    sim.set({
      outcome: opts.outcome,
      deliverAt,
      duplicate: opts.duplicate ?? false,
      status: SimulatedPaymentStatus.SCHEDULED,
      mpesaReceiptNumber,
      deliveredAt: undefined,
      resultCode: undefined,
      processingTimeMs: undefined,
    });
    await sim.save();
  } else {
    sim = await SimulatedPayment.create({
      orderId,
      checkoutRequestId: order.mpesaCheckoutRequestId,
      merchantRequestId: newMerchantRequestId(),
      outcome: opts.outcome,
      amount: order.totalAmountKES,
      buyerId: order.buyerId,
      farmerId: order.farmerId,
      deliverAt,
      duplicate: opts.duplicate ?? false,
      status: SimulatedPaymentStatus.SCHEDULED,
      ...(mpesaReceiptNumber ? { mpesaReceiptNumber } : {}),
    });
  }

  if (delaySeconds === 0) {
    await deliverSimulatedPayment(sim);
    return { delivered: true, outcome: opts.outcome, scheduledFor: deliverAt };
  }
  return { delivered: false, outcome: opts.outcome, scheduledFor: deliverAt };
}
