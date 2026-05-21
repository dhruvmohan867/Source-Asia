// ============================================================
// Zod Validation Schemas
// ============================================================
// WHY Zod: Runtime validation that generates TypeScript types.
// Validates on both client (forms) and server (API routes).
// ============================================================

import { z } from 'zod';

export const searchSchema = z.object({
  origin: z.string().min(3, 'Select origin airport').max(3),
  destination: z.string().min(3, 'Select destination airport').max(3),
  date: z.string().min(1, 'Select a departure date'),
  passengers: z.number().int().min(1, 'At least 1 passenger').max(9, 'Maximum 9 passengers'),
});

export type SearchFormData = z.infer<typeof searchSchema>;

export const passengerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),

  email: z.string().email(),

  phone: z.string().min(10),

  passportNumber: z.string(),

  nationality: z
    .string()
    .min(2, 'Nationality is required'),

  dob: z
    .string()
    .min(1, 'Date of birth is required'),
});
export type PassengerFormValues = z.infer<typeof passengerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
