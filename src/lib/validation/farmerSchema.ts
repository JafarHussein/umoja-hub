import { z } from 'zod';
import { KENYAN_COUNTIES, ListingUnit, ListingCategory, ListingStatus } from '@/types';

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

// Farmer verification submissions are validated by
// `farmerOnboardingVerificationSchema` in `onboardingSchema.ts`. There was a
// near-identical copy here, used only by the farmer-profile submission path, so
// the same request had two contracts that could drift apart. One remains.

export const cropListingSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(100),
  cropName: z.string().trim().min(1, 'Crop name is required').max(50),
  category: z.enum([
    ListingCategory.VEGETABLES,
    ListingCategory.FRUITS,
    ListingCategory.CEREALS,
    ListingCategory.LEGUMES,
    ListingCategory.LIVESTOCK,
    ListingCategory.DAIRY,
    ListingCategory.POULTRY,
    ListingCategory.SEEDS,
    ListingCategory.FARM_INPUTS,
    ListingCategory.EQUIPMENT,
  ]),
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

// Owner-facing partial update for an existing listing. Extends the creation
// fields with listingStatus, restricted to the two farmer-controllable states:
// AVAILABLE (reactivate) and INACTIVE (pause). SOLD_OUT is system-managed by
// the atomic stock reservation and must never be set by a client.
export const listingUpdateSchema = cropListingSchema.partial().extend({
  listingStatus: z.enum([ListingStatus.AVAILABLE, ListingStatus.INACTIVE]).optional(),
});

export const adminVerifyFarmerSchema = z.object({
  farmerId: z.string().min(1, 'Farmer ID is required'),
  decision: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().trim().optional(),
});

export type FarmerProfileInput = z.infer<typeof farmerProfileSchema>;
export type CropListingInput = z.infer<typeof cropListingSchema>;
export type ListingUpdateInput = z.infer<typeof listingUpdateSchema>;
export type AdminVerifyFarmerInput = z.infer<typeof adminVerifyFarmerSchema>;
