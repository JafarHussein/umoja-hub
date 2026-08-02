import { z } from 'zod';
import { MediationCategory, MediationOutcome } from '@/types';

// Evidence is uploaded first via /api/upload (Cloudinary), then attached here
// by reference. Capped so a dispute stays reviewable by a human.
const evidenceSchema = z
  .array(
    z.object({
      url: z.string().url('Each piece of evidence needs a valid URL'),
      publicId: z.string().min(1),
    })
  )
  .max(5, 'Attach at most 5 photos')
  .optional();

export const mediationRequestSchema = z.object({
  // Both sides may file, under different categories — the route enforces which
  // categories each role is allowed (see BUYER_/FARMER_MEDIATION_CATEGORIES).
  category: z.enum([
    MediationCategory.NOT_DELIVERED,
    MediationCategory.QUALITY_ISSUE,
    MediationCategory.WRONG_QUANTITY,
    MediationCategory.RECEIPT_NOT_CONFIRMED,
    MediationCategory.OTHER,
  ]),
  description: z
    .string()
    .trim()
    .min(20, 'Describe the problem in at least 20 characters')
    .max(1000),
  evidence: evidenceSchema,
});

export type MediationRequestInput = z.infer<typeof mediationRequestSchema>;

// The respondent's account of the same order. One statement each.
export const mediationResponseSchema = z.object({
  statement: z
    .string()
    .trim()
    .min(20, 'Give your account in at least 20 characters')
    .max(1000),
  evidence: evidenceSchema,
});

export type MediationResponseInput = z.infer<typeof mediationResponseSchema>;

// Admin transition: OPEN → IN_REVIEW, or OPEN/IN_REVIEW → RESOLVED.
// A resolution note is mandatory when resolving — the outcome must be on
// record, mirroring the rejection-reason rule elsewhere on the platform.
// `outcome` decides what happens to the held escrow funds on resolution:
//   RELEASE → funds go to the farmer (order completed by admin)
//   REFUND  → funds returned to the buyer (order refunded)
//   NONE    → resolved without moving money (default; order continues)
// A money-moving outcome is only valid when RESOLVED.
export const adminMediationDecisionSchema = z
  .object({
    requestId: z.string().min(1, 'Request ID is required'),
    status: z.enum(['IN_REVIEW', 'RESOLVED']),
    resolutionNote: z.string().trim().max(500).optional(),
    outcome: z
      .enum([MediationOutcome.RELEASE, MediationOutcome.REFUND, MediationOutcome.NONE])
      .optional(),
  })
  .refine(
    (d) =>
      d.status !== 'RESOLVED' ||
      (d.resolutionNote !== undefined && d.resolutionNote.length > 0),
    { message: 'A resolution note is required when resolving', path: ['resolutionNote'] }
  )
  .refine(
    (d) =>
      d.status === 'RESOLVED' ||
      d.outcome === undefined ||
      d.outcome === MediationOutcome.NONE,
    {
      message: 'An escrow outcome can only be applied when resolving a request',
      path: ['outcome'],
    }
  );

export type AdminMediationDecisionInput = z.infer<typeof adminMediationDecisionSchema>;
