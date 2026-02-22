import { z } from 'zod';
import { KENYAN_COUNTIES, MAX_GROUP_MEMBERS } from '@/types';

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

export type GroupCreationInput = z.infer<typeof groupCreationSchema>;
export type GroupMemberInput = z.infer<typeof groupMemberSchema>;
export type GroupOrderInput = z.infer<typeof groupOrderSchema>;
