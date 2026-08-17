import { z } from 'zod';

// ---------------------------------------------------------------------------
// Admin Payment Lab — trigger a deterministic simulated payment scenario on an
// order. Each action maps to a forced simulated outcome (see the route).
// ---------------------------------------------------------------------------

export const PAYMENT_LAB_ACTIONS = [
  'success',
  'insufficient_funds',
  'user_cancelled',
  'phone_unreachable',
  'timeout',
  'network_failure',
  'unknown_error',
  'delayed',
  'duplicate',
  'lost',
] as const;

export type PaymentLabAction = (typeof PAYMENT_LAB_ACTIONS)[number];

/**
 * The demonstration bridge, kept out of the list above on purpose.
 *
 * Every action in PAYMENT_LAB_ACTIONS drives the *simulator*. This one acts on a
 * real Daraja sandbox payment, is available only under
 * `PAYMENT_MODE=REAL_STK_DEMO`, and is recorded against a different provider
 * name. Folding it into the same enum would put it behind the same
 * "simulation only" gate and, worse, would read as one more simulated outcome.
 */
export const DEMO_BRIDGE_ACTION = 'demo_confirm' as const;

export const paymentLabActionSchema = z.object({
  orderId: z.string().min(1, 'An order is required'),
  action: z.enum([...PAYMENT_LAB_ACTIONS, DEMO_BRIDGE_ACTION]),
});

export type PaymentLabActionInput = z.infer<typeof paymentLabActionSchema>;
