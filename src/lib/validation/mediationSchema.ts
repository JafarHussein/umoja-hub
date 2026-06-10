import { z } from 'zod';
import { MediationCategory } from '@/types';

export const mediationRequestSchema = z.object({
  category: z.enum([
    MediationCategory.NOT_DELIVERED,
    MediationCategory.QUALITY_ISSUE,
    MediationCategory.WRONG_QUANTITY,
    MediationCategory.OTHER,
  ]),
  description: z
    .string()
    .trim()
    .min(20, 'Describe the problem in at least 20 characters')
    .max(1000),
});

export type MediationRequestInput = z.infer<typeof mediationRequestSchema>;

// Admin transition: OPEN → IN_REVIEW, or OPEN/IN_REVIEW → RESOLVED.
// A resolution note is mandatory when resolving — the outcome must be on
// record, mirroring the rejection-reason rule elsewhere on the platform.
export const adminMediationDecisionSchema = z
  .object({
    requestId: z.string().min(1, 'Request ID is required'),
    status: z.enum(['IN_REVIEW', 'RESOLVED']),
    resolutionNote: z.string().trim().max(500).optional(),
  })
  .refine(
    (d) =>
      d.status !== 'RESOLVED' ||
      (d.resolutionNote !== undefined && d.resolutionNote.length > 0),
    { message: 'A resolution note is required when resolving', path: ['resolutionNote'] }
  );

export type AdminMediationDecisionInput = z.infer<typeof adminMediationDecisionSchema>;
