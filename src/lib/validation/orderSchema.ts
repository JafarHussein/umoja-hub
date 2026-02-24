import { z } from 'zod';
import { FulfillmentType } from '@/types';

const kenyanPhoneRegex = /^(?:\+254|0)[17]\d{8}$/;

export const createOrderSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  quantityOrdered: z.number().int().positive('Quantity must be a positive integer'),
  fulfillmentType: z.enum([FulfillmentType.PICKUP, FulfillmentType.DELIVERY]),
  buyerPhone: z
    .string()
    .trim()
    .regex(kenyanPhoneRegex, 'Invalid Kenyan phone number for M-Pesa'),
});

export const updateOrderStatusSchema = z.object({
  fulfillmentStatus: z.enum(['IN_FULFILLMENT', 'RECEIVED', 'DISPUTED']),
  disputeReason: z.string().trim().max(500).optional(),
});

export const darajaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(
            z.object({
              Name: z.string(),
              Value: z.union([z.string(), z.number()]).optional(),
            })
          ),
        })
        .optional(),
    }),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type DarajaCallbackInput = z.infer<typeof darajaCallbackSchema>;
