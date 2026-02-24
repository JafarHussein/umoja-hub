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
