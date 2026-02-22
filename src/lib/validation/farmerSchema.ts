import { z } from 'zod';
import { KENYAN_COUNTIES, ListingUnit, DocumentType } from '@/types';

const kenyanPhoneRegex = /^(?:\+254|0)[17]\d{8}$/;
const cloudinaryUrlRegex = /^https:\/\/res\.cloudinary\.com\//;

export const farmerProfileSchema = z.object({
  cropsGrown: z.array(z.string().trim().min(1)).min(1, 'At least one crop is required'),
  livestockKept: z.array(z.string().trim()).optional(),
  farmSizeAcres: z.number().positive().optional(),
  primaryLanguage: z.string().trim().optional(),
  county: z.enum(KENYAN_COUNTIES),
  phoneNumber: z
    .string()
    .trim()
    .regex(kenyanPhoneRegex, 'Invalid Kenyan phone number'),
});

export const verificationDocSchema = z.object({
  documentType: z.enum([
    DocumentType.NATIONAL_ID,
    DocumentType.COOPERATIVE_CARD,
    DocumentType.PASSPORT,
  ]),
  documentNumber: z.string().trim().min(1, 'Document number is required'),
  documentImageUrl: z
    .string()
    .regex(cloudinaryUrlRegex, 'Image must be uploaded to Cloudinary'),
});

export const cropListingSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(100),
  cropName: z.string().trim().min(1, 'Crop name is required').max(50),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(1000),
  quantityAvailable: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.enum([
    ListingUnit.KG,
    ListingUnit.BAG,
    ListingUnit.CRATE,
    ListingUnit.LITRE,
    ListingUnit.PIECE,
  ]),
  currentPricePerUnit: z.number().min(0, 'Price cannot be negative'),
  pickupCounty: z.enum(KENYAN_COUNTIES),
  pickupDescription: z
    .string()
    .trim()
    .min(10, 'Pickup description must be at least 10 characters'),
  imageUrls: z
    .array(z.string().regex(cloudinaryUrlRegex, 'Images must be Cloudinary URLs'))
    .min(1, 'At least one image is required')
    .max(5, 'Maximum 5 images allowed'),
  buyerContactPreference: z
    .array(z.enum(['PHONE', 'PLATFORM_MESSAGE']))
    .min(1, 'Select at least one contact preference'),
});

export const adminVerifyFarmerSchema = z.object({
  farmerId: z.string().min(1, 'Farmer ID is required'),
  decision: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().trim().optional(),
});

export type FarmerProfileInput = z.infer<typeof farmerProfileSchema>;
export type VerificationDocInput = z.infer<typeof verificationDocSchema>;
export type CropListingInput = z.infer<typeof cropListingSchema>;
export type AdminVerifyFarmerInput = z.infer<typeof adminVerifyFarmerSchema>;
