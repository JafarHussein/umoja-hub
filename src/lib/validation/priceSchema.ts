import { z } from 'zod';
import { KENYAN_COUNTIES } from '@/types';

export const priceAlertSchema = z.object({
  cropName: z.string().trim().min(1, 'Crop name is required').max(50),
  county: z.enum(KENYAN_COUNTIES),
  targetPricePerUnit: z.number().positive('Target price must be positive'),
  unit: z.enum(['KG', 'BAG', 'CRATE', 'LITRE', 'PIECE']),
  notificationMethod: z.enum(['SMS', 'EMAIL', 'BOTH']),
});

export type PriceAlertInput = z.infer<typeof priceAlertSchema>;

// Query schema for GET /api/prices/recommendation. `quantity` arrives as a query
// string, so it is coerced; absent quantity simply omits the earnings projection.
export const priceRecommendationQuerySchema = z.object({
  cropName: z.string().trim().min(1, 'Crop name is required').max(50),
  county: z.enum(KENYAN_COUNTIES),
  unit: z.enum(['KG', 'BAG', 'CRATE', 'LITRE', 'PIECE']).default('KG'),
  quantity: z.coerce.number().positive('Quantity must be positive').optional(),
});

export type PriceRecommendationQuery = z.infer<typeof priceRecommendationQuerySchema>;
