import { z } from 'zod';
import { MediationOutcome } from '@/types';

// ---------------------------------------------------------------------------
// Admin escrow console validation.
//
// A direct settlement moves real custodial funds without a dispute having been
// filed, so the reason is mandatory and substantive — it becomes the permanent
// justification on the escrow event and the admin audit log. There are only two
// outcomes because there are only two places held money can go.
// ---------------------------------------------------------------------------

export const adminEscrowSettlementSchema = z.object({
  outcome: z.enum([MediationOutcome.RELEASE, MediationOutcome.REFUND]),
  reason: z
    .string()
    .trim()
    .min(10, 'Give a reason of at least 10 characters — it is recorded permanently.')
    .max(500, 'Keep the reason under 500 characters.'),
});

export type AdminEscrowSettlementInput = z.infer<typeof adminEscrowSettlementSchema>;
