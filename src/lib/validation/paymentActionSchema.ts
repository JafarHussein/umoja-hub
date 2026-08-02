import { z } from 'zod';

// ---------------------------------------------------------------------------
// Buyer payment-recovery actions.
//
// RETRY  — re-attempt payment on an order whose payment failed, was cancelled
//          on the handset, or timed out. Re-reserves stock and opens a fresh
//          payment session.
// CANCEL — abandon an order that is still awaiting payment, releasing the
//          reserved stock back to the marketplace immediately rather than
//          waiting for the reconciliation sweep.
// ---------------------------------------------------------------------------

export const paymentActionSchema = z.object({
  action: z.enum(['RETRY', 'CANCEL']),
});

export type PaymentActionInput = z.infer<typeof paymentActionSchema>;
