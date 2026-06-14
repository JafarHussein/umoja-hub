import { z } from 'zod';

const cloudinaryUrlRegex = /^https:\/\/res\.cloudinary\.com\//;

// Buyer submits a KRA tax compliance certificate for KYC review (BE-09). The
// file is uploaded to Cloudinary client-side; only the resulting URL is sent.
export const buyerVerificationDocSchema = z.object({
  taxComplianceCertificate: z
    .string()
    .regex(cloudinaryUrlRegex, 'Certificate must be uploaded to Cloudinary'),
});

// Admin decision on a buyer KYC submission. PENDING → APPROVED | REJECTED;
// a rejection reason is required (enforced in the route, mirroring farmers).
export const adminVerifyBuyerSchema = z.object({
  buyerId: z.string().min(1, 'Buyer ID is required'),
  decision: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().trim().optional(),
});

export type BuyerVerificationDocInput = z.infer<typeof buyerVerificationDocSchema>;
export type AdminVerifyBuyerInput = z.infer<typeof adminVerifyBuyerSchema>;
