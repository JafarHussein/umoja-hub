import { z } from 'zod';
import { Role, KENYAN_COUNTIES } from '@/types';

const kenyanPhoneRegex = /^(?:\+254|0)[17]\d{8}$/;

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  phoneNumber: z
    .string()
    .trim()
    .regex(kenyanPhoneRegex, 'Invalid Kenyan phone number (e.g. 0712 345 678 or +254712345678)'),
  role: z.enum([Role.FARMER, Role.BUYER, Role.STUDENT, Role.LECTURER]),
  county: z.enum(KENYAN_COUNTIES),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
