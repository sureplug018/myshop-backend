import { z } from 'zod';

export const signUpSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.email({ error: 'Invalid email address' }),
    phoneNumber: z.string().min(10, 'Phone number is required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    passwordConfirm: z
      .string()
      .min(8, 'Confirm Password must be at least 8 characters long'),
  }),
});

export const signInSchema = z.object({
  body: z.object({
    email: z.email({ error: 'Invalid email address' }),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.email({ error: 'Invalid email address' }),
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
  body: z.object({
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    passwordConfirm: z
      .string()
      .min(8, 'Confirm Password must be at least 8 characters long'),
  }),
});

export const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(8, 'Current password must be at least 8 characters long'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long'),
    passwordConfirm: z
      .string()
      .min(8, 'Confirm Password must be at least 8 characters long'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    email: z.email({ error: 'Invalid email address' }).optional(),
    phoneNumber: z.string().min(10, 'Phone number is required').optional(),
  }),
});
