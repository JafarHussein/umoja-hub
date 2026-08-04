import { z } from 'zod';

// Buyer verification submissions are validated by
// `buyerOnboardingVerificationSchema` in `onboardingSchema.ts`, which branches
// on the buyer archetype. The unbranched shape that used to live here demanded
// a KRA certificate of every buyer, including individuals who have none — it is
// gone rather than deprecated so it cannot be reached for again.

// Admin decision on a buyer KYC submission. PENDING → APPROVED | REJECTED;
// a rejection reason is required (enforced in the route, mirroring farmers).
export const adminVerifyBuyerSchema = z.object({
  buyerId: z.string().min(1, 'Buyer ID is required'),
  decision: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().trim().optional(),
});

export type AdminVerifyBuyerInput = z.infer<typeof adminVerifyBuyerSchema>;
