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

export const paymentLabActionSchema = z.object({
  orderId: z.string().min(1, 'An order is required'),
  action: z.enum(PAYMENT_LAB_ACTIONS),
});

export type PaymentLabActionInput = z.infer<typeof paymentLabActionSchema>;
