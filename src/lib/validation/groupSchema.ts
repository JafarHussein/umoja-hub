import { z } from 'zod';
import { KENYAN_COUNTIES, MAX_GROUP_MEMBERS } from '@/types';

const kenyanPhoneRegex = /^(?:\+254|0)[17]\d{8}$/;

export const groupCreationSchema = z.object({
  groupName: z.string().trim().min(3, 'Group name must be at least 3 characters').max(100),
  county: z.enum(KENYAN_COUNTIES),
});

export const groupMemberSchema = z.object({
  action: z.enum(['ADD', 'REMOVE']),
  userId: z.string().min(1, 'User ID is required'),
});

export const groupOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  inputType: z.string().trim().min(3, 'Input type must be at least 3 characters').max(100),
  quantityPerMember: z.number().positive('Quantity per member must be positive'),
  pricePerMember: z.number().positive('Price per member must be positive'),
  joiningDeadline: z.string().datetime('Invalid deadline date'),
  minimumMembers: z
    .number()
    .int()
    .min(5, 'Minimum 5 members required')
    .max(MAX_GROUP_MEMBERS, `Maximum ${MAX_GROUP_MEMBERS} members allowed`),
});

export const groupOrderActionSchema = z.object({
  action: z.enum(['JOIN', 'CLOSE', 'FULFILL', 'CANCEL']),
});

// Admin mints a single-use join token for a group and has it SMS-dispatched to
// the recipient farmer's phone (Africa's Talking). Expiry is admin-tunable
// within a 1-hour…30-day window; the route applies a default when omitted.
export const groupTokenMintSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  recipientPhone: z
    .string()
    .trim()
    .regex(kenyanPhoneRegex, 'Invalid Kenyan phone number (e.g. 0712 345 678 or +254712345678)'),
  expiresInHours: z.number().int().min(1).max(720).optional(),
});

// Farmer redeems a token from their settings pane. The code is normalised to
// uppercase in the route before lookup.
export const redeemTokenSchema = z.object({
  token: z.string().trim().min(1, 'A join token is required').max(32),
});

export type GroupCreationInput = z.infer<typeof groupCreationSchema>;
export type GroupMemberInput = z.infer<typeof groupMemberSchema>;
export type GroupOrderInput = z.infer<typeof groupOrderSchema>;
export type GroupOrderActionInput = z.infer<typeof groupOrderActionSchema>;
export type GroupTokenMintInput = z.infer<typeof groupTokenMintSchema>;
export type RedeemTokenInput = z.infer<typeof redeemTokenSchema>;
