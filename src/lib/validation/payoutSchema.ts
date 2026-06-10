import { z } from 'zod';

// Upper sanity bound for a single payout request (KES 10M) — well above any
// realistic smallholder settlement; protects against fat-finger zeros.
const MAX_PAYOUT_KES = 10_000_000;

export const payoutRequestSchema = z.object({
  amountKES: z
    .number()
    .positive('Amount must be greater than zero')
    .finite()
    .max(MAX_PAYOUT_KES, `Amount cannot exceed KES ${MAX_PAYOUT_KES.toLocaleString()}`),
});

export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;
