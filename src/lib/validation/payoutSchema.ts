import { z } from 'zod';

// Upper sanity bound for a single payout request (KES 10M) — well above any
// realistic smallholder settlement; protects against fat-finger zeros.
const MAX_PAYOUT_KES = 10_000_000;

export const payoutRequestSchema = z.object({
  amountKES: z
    .number()
    .positive('Amount must be greater than zero')
    .finite()
    .max(MAX_PAYOUT_KES, `Amount cannot exceed KSh ${MAX_PAYOUT_KES.toLocaleString()}`),
});

export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;

// Admin decision on a withdrawal request. Transitions enforced in the route:
// REQUESTED→APPROVED, REQUESTED→REJECTED (note required), APPROVED→PAID
// (note carries the manual M-Pesa payment reference).
export const adminPayoutDecisionSchema = z
  .object({
    requestId: z.string().min(1, 'Request ID is required'),
    decision: z.enum(['APPROVED', 'REJECTED', 'PAID']),
    note: z.string().trim().max(500).optional(),
  })
  .refine(
    (d) => d.decision !== 'REJECTED' || (d.note !== undefined && d.note.length > 0),
    { message: 'A reason note is required when rejecting a payout request', path: ['note'] }
  );

export type AdminPayoutDecisionInput = z.infer<typeof adminPayoutDecisionSchema>;
